const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.processClip = onCall(async (request) => {
  // Grab the data sent from your React frontend
  const { text, rule } = request.data;

  // Basic validation
  if (!text) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'text' argument.",
    );
  }

  logger.info(`Processing clip for rule: ${rule}`);

  // --- LLM PLACEHOLDER ---
  // This is exactly where we will put the code to talk to your chosen AI.
  // For now, we will just send a mock response to prove the frontend and backend are talking.

  const simulatedResponse = `[Backend Success! Rule applied: ${rule.toUpperCase()}]\n\nOriginal text started with: "${text.substring(0, 30)}..."`;

  // Send the result back to the frontend
  return {
    result: simulatedResponse,
  };
});
