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
