const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client using the secure environment variable we just created
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT_REGISTRY = {
  summarize: (text) => `Please provide a concise, single-paragraph summary of the following text:\n\n${text}`,
  categorize: (text) => `Please analyze the following text and assign it 3 to 5 relevant categories or tags. Output ONLY the tags, separated by commas:\n\n${text}`,
  correct: (text) => `Please correct any grammar, spelling, or punctuation errors in the following text. ONLY return the corrected text, without any conversational filler or explanations:\n\n${text}`,
  bulletpoints: (text) => `Extract the key takeaways and main points from the following text as a clean list of bullet points. Return only the bullet points:\n\n${text}`,
  explain: (text) => `Please explain the core concepts of the following text in simple, easy-to-understand language as if explaining to a 10-year-old:\n\n${text}`,
  translate_es: (text) => `Please translate the following text into Spanish. Output ONLY the translation without any extra comments, introduction, or formatting:\n\n${text}`,
  translate_th: (text) => `Please translate the following text into Thai. Output ONLY the translation without any extra comments, introduction, or formatting:\n\n${text}`,
  newsletter: (text) => `You are a reading assistant preparing an email newsletter to be read aloud. Your job is to extract ONLY the editorial content — the actual stories, opinions, facts, and insights the author intended to communicate. You MUST silently discard everything else: navigation menus, sponsored content labels, calls-to-action, social media prompts, "view online" links, unsubscribe text, reply/forward headers, mailing addresses, photo captions, and date navigation bars. Do not say what you removed. Write the result as clean, flowing prose with natural paragraph breaks. Do not use bullet points or headers. Make it sound like a human read you the newsletter over coffee.\n\nText:\n${text}`,
  listenmode: (text) => `
You are the Vocalize.it Distillery Engine.

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
  default: (text) => `Process the following text: ${text}`
};

exports.processClip = onCall({ cors: true }, async (request) => {
  const { text, rule } = request.data;

  if (!text) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'text' argument.",
    );
  }

  logger.info(`Processing clip for rule: ${rule}`);

  try {
    // We are using gemini-2.5-flash because it is incredibly fast for text tasks
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build the specific prompt based on the registry
    const promptGenerator = PROMPT_REGISTRY[rule] || PROMPT_REGISTRY.default;
    const prompt = promptGenerator(text);

    // Send the prompt to Gemini and wait for the response
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Send the AI's actual response back to your React frontend
    return {
      result: aiResponse,
    };
  } catch (error) {
    logger.error("Gemini API Error:", error);
    throw new HttpsError("internal", "Failed to process text with Gemini.");
  }
});
