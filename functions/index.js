const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client using the secure environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hard cap: Gemini 2.5 Flash has a large context window but very long inputs
// cause cold-start timeouts on mobile networks. Cap at ~100k chars (~25k tokens).
const MAX_TEXT_LENGTH = 100_000;

const VALID_RULES = new Set([
  "summarize", "categorize", "correct", "bulletpoints",
  "explain", "translate_es", "translate_th", "newsletter", "listenmode", "default"
]);

const PROMPT_REGISTRY = {
  summarize: (text) =>
    `Please provide a concise, single-paragraph summary of the following text:\n\n${text}`,
  categorize: (text) =>
    `Please analyze the following text and assign it 3 to 5 relevant categories or tags. Output ONLY the tags, separated by commas:\n\n${text}`,
  correct: (text) =>
    `Please correct any grammar, spelling, or punctuation errors in the following text. ONLY return the corrected text, without any conversational filler or explanations:\n\n${text}`,
  bulletpoints: (text) =>
    `Extract the key takeaways and main points from the following text as a clean list of bullet points. Return only the bullet points:\n\n${text}`,
  explain: (text) =>
    `Please explain the core concepts of the following text in simple, easy-to-understand language as if explaining to a 10-year-old:\n\n${text}`,
  translate_es: (text) =>
    `Please translate the following text into Spanish. Output ONLY the translation without any extra comments, introduction, or formatting:\n\n${text}`,
  translate_th: (text) =>
    `Please translate the following text into Thai. Output ONLY the translation without any extra comments, introduction, or formatting:\n\n${text}`,
  newsletter: (text) =>
    `You are a reading assistant preparing an email newsletter to be read aloud. Your job is to extract ONLY the editorial content — the actual stories, opinions, facts, and insights the author intended to communicate. You MUST silently discard everything else: navigation menus, sponsored content labels, calls-to-action, social media prompts, "view online" links, unsubscribe text, reply/forward headers, mailing addresses, photo captions, and date navigation bars. Do not say what you removed. Write the result as clean, flowing prose with natural paragraph breaks. Do not use bullet points or headers. Make it sound like a human read you the newsletter over coffee.\n\nText:\n${text}`,
  listenmode: (text) => `
You are the Listen Better Distillery Engine.

MISSION:
Users must be able to trust Listen Better.
The system must distinguish between:
1. Content that can be rewritten for listening.
2. Content that should be preserved verbatim.
The goal is to improve listening while preserving the integrity of important source material.

==================================================
TRUST-PRESERVING NARRATION (CORE PRINCIPLE)
==================================================
You are NOT allowed to rewrite certain classes of content.
For those protected classes of content:
- preserve wording exactly
- preserve sequence
- preserve meaning
Only improve presentation for audio. Never alter the actual words.

==================================================
PROTECTED CONTENT CLASSES
==================================================

CATEGORY 1: SCRIPTURE
Examples: John 3:16, Romans 8, Psalm 23, Philippians 4:13
Rules:
- Preserve translation wording exactly.
- Do not summarize, paraphrase, modernize, simplify, or reorganize verses.
Allowed:
- Read chapter and verse naturally (e.g., "John chapter three, verses sixteen through eighteen").
- Suppress repeated verse numbers when appropriate.
- Remove cross-reference markers and study footnotes.

CATEGORY 2: DIRECT QUOTATIONS
Examples: Martin Luther King Jr., C.S. Lewis, Corrie ten Boom, Dallas Willard, A.W. Tozer, Charles Spurgeon, Billy Graham, Dietrich Bonhoeffer, Abraham Lincoln, Winston Churchill, Theodore Roosevelt
Rules:
- Preserve wording exactly.
- Do not summarize, modernize, simplify, or rewrite for conversational style.
- Narration may introduce the quote, but the quote itself remains untouched.

CATEGORY 3: PRAYERS
Examples: Written prayers, Benedictions, Liturgical prayers, Prayer requests containing a written prayer
Rules:
- Preserve wording. Do not rewrite. Do not summarize.

CATEGORY 4: POETRY
Examples: Poems, Creeds, Liturgical readings, Hymn text
Rules:
- Preserve wording and structure.

==================================================
DETECTION RULES
==================================================
Detect:
- Quotation marks: " ... "
- Block quotes: Author wrote: " ... "
- Attribution patterns: According to..., As Martin Luther King Jr. wrote..., C.S. Lewis said..., Abraham Lincoln stated...
When detected: Protect quoted text.

==================================================
SPEECH INTELLIGENCE RULE
==================================================
The system may optimize speech around protected content.
It may:
- expand abbreviations
- improve pronunciation
- remove citation markers
- suppress footnote numbers
- suppress superscript markers
The system may NOT:
- rewrite, paraphrase, shorten, or summarize protected content.

==================================================
CONTENT THAT MAY BE REWRITTEN
==================================================
The following remain eligible for full Listen Better narration:
- newsletters, email updates, articles, reports, meeting notes, announcements, training materials, government notices, informational documents.

For content that MAY be rewritten:
- Remove: Navigation menus, social media links, unsubscribe instructions, email headers, legal disclaimers, advertising, metadata, reference numbers, etc.
- Write a natural narrative that sounds like a knowledgeable friend explaining the content.
- Use: Clear language, complete sentences, smooth transitions, natural speech patterns, short to medium-length paragraphs.
- Rewrite content for speech rather than reading. Replace visual references with spoken equivalents.

IMPORTANT OUTPUT RULES:
- Do NOT output: Document Type, Source, Author, Section headings, Metadata, Explanations of what was removed, Bullet points, Markdown formatting.
- The output should never sound like a report, an analysis, metadata, or a document breakdown.

Return ONLY the final spoken narrative.

Text to process:

${text}
`,
  default: (text) => `Process the following text: ${text}`,
};

exports.processClip = onCall({ cors: true }, async (request) => {
  const startMs = Date.now();
  const { text, rule } = request.data;

  // ── Structured request logging ─────────────────────────────────────────────
  const hasAuth = !!(request.auth && request.auth.uid);
  logger.info("processClip: request received", {
    rule: rule || "(none)",
    textLength: text ? text.length : 0,
    hasAuth,
    timestamp: new Date().toISOString(),
  });

  // ── Input validation ───────────────────────────────────────────────────────
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    logger.warn("processClip: rejected — missing or empty text");
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a non-empty 'text' argument."
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    logger.warn("processClip: rejected — text too long", { textLength: text.length, limit: MAX_TEXT_LENGTH });
    throw new HttpsError(
      "resource-exhausted",
      `Input text is too long (${text.length} chars). Maximum allowed is ${MAX_TEXT_LENGTH} characters.`
    );
  }

  const resolvedRule = (rule && VALID_RULES.has(rule)) ? rule : "default";
  if (rule && !VALID_RULES.has(rule)) {
    logger.warn("processClip: unknown rule, falling back to default", { requestedRule: rule });
  }

  // ── Gemini call ────────────────────────────────────────────────────────────
  const modelName = "gemini-2.5-flash";
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const promptGenerator = PROMPT_REGISTRY[resolvedRule];
    const prompt = promptGenerator(text);

    logger.info("processClip: sending to Gemini", {
      model: modelName,
      rule: resolvedRule,
      promptLength: prompt.length,
    });

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    const processingMs = Date.now() - startMs;

    logger.info("processClip: success", {
      rule: resolvedRule,
      responseLength: aiResponse.length,
      processingMs,
    });

    // Return versioned response with diagnostics
    return {
      result: aiResponse,
      meta: {
        rule: resolvedRule,
        model: modelName,
        processingMs,
      },
    };
  } catch (error) {
    const processingMs = Date.now() - startMs;

    // Log the full error so Cloud Logging captures it
    logger.error("processClip: Gemini API error", {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code || null,
      errorStatus: error.status || null,
      processingMs,
      rule: resolvedRule,
      textLength: text.length,
    });

    // Surface a meaningful error to the client (not just "internal")
    const detail = error.message
      ? `Gemini error: ${error.message.slice(0, 200)}`
      : "Failed to process text with Gemini.";

    throw new HttpsError("internal", detail);
  }
});
