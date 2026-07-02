const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client using the secure environment variable we just created
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.processClip = onCall(async (request) => {
  const { text, rule } = request.data;

  if (!text) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'text' argument.",
    );
  }

  logger.info(`Processing clip for rule: ${rule}`);

  try {
    // We are using gemini-1.5-flash because it is incredibly fast for text tasks
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build the specific prompt based on what the React frontend asked for
    let prompt = "";
    if (rule === "summarize") {
      prompt = `Please provide a concise, single-paragraph summary of the following text:\n\n${text}`;
    } else if (rule === "categorize") {
      prompt = `Please analyze the following text and assign it 3 to 5 relevant categories or tags. Output ONLY the tags, separated by commas:\n\n${text}`;
    } else if (rule === "correct") {
      prompt = `Please correct any grammar, spelling, or punctuation errors in the following text. ONLY return the corrected text, without any conversational filler or explanations:\n\n${text}`;
    } else {
      prompt = `Process the following text: ${text}`;
    }

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
