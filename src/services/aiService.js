import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";

// Timeout (ms) for the Firebase callable. Gemini 2.5 Flash is fast but on
// marginal Android networks a cold-start + long input can take 15–20 s.
// Large texts (newsletters, long articles) can take 40–55 s on slow connections.
// We surface a clear timeout message instead of hanging indefinitely.
const CALLABLE_TIMEOUT_MS = 60_000;

/**
 * Wraps a Promise with a timeout. Rejects with a labelled error if the
 * promise does not settle within `ms` milliseconds.
 */
function withTimeout(promise, ms) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`TIMEOUT: Request took longer than ${ms / 1000}s. Try again on a stronger connection.`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

/**
 * Extracts a human-readable diagnostic string from a Firebase Functions error.
 * Firebase HTTPS callable errors have: .code (e.g. "functions/internal"),
 * .message, and optionally .details.
 */
function extractFirebaseError(error) {
  // Firebase Functions errors expose a structured code
  const code = error.code || "unknown";
  const message = error.message || "No error message provided.";
  const details = error.details ? ` | Details: ${JSON.stringify(error.details)}` : "";

  // Map common Firebase error codes to actionable user messages
  const codeMap = {
    "functions/unavailable":
      "Firebase service is temporarily unavailable. Check your connection and try again.",
    "functions/deadline-exceeded":
      "The request timed out on the server. Your input may be too long, or the network is slow.",
    "functions/unauthenticated":
      "Authentication required. Please refresh the page and try again.",
    "functions/permission-denied":
      "You do not have permission to use this feature.",
    "functions/not-found":
      "The processing function could not be found. The app may need to be updated.",
    "functions/internal":
      "The server encountered an error processing your request.",
    "functions/invalid-argument":
      "Invalid input sent to the server. Please try again.",
  };

  const friendly = codeMap[code] || null;

  return {
    code,
    message,
    details,
    friendly,
    full: `[${code}] ${message}${details}`,
  };
}

/**
 * Sends text to the Firebase processClip Cloud Function via Gemini.
 *
 * @param {string} clipboardText - The pre-cleaned text to process.
 * @param {string} rule - The processing rule key (e.g. "listenmode").
 * @returns {Promise<string>} - The AI-processed text.
 * @throws {Error} - With a diagnostic message suitable for display.
 */
export async function processWithGemini(clipboardText, rule) {
  const startMs = Date.now();

  // ── Pre-flight checks ──────────────────────────────────────────────────────
  if (!clipboardText || clipboardText.trim().length === 0) {
    throw new Error("No text provided to process.");
  }

  // navigator.onLine is a coarse signal but catches obvious offline states
  // (airplane mode, no Wi-Fi, etc.) before wasting a request attempt.
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.warn("[aiService] navigator.onLine is false — device appears offline.");
    throw new Error("You appear to be offline. Please check your connection and try again.");
  }

  console.log(`[aiService] Starting processWithGemini — rule="${rule}", textLength=${clipboardText.length}, online=${navigator.onLine}`);

  // ── Firebase callable setup ────────────────────────────────────────────────
  // Explicitly pass the region matching your v2 function deployment.
  // v2 functions default to us-central1; change if you deployed elsewhere.
  const functions = getFunctions(app, "us-central1");
  const processClip = httpsCallable(functions, "processClip");

  try {
    const callPromise = processClip({ text: clipboardText, rule });
    const response = await withTimeout(callPromise, CALLABLE_TIMEOUT_MS);

    const elapsedMs = Date.now() - startMs;
    const meta = response.data.meta || {};
    console.log(`[aiService] Success — elapsedMs=${elapsedMs}, serverMs=${meta.processingMs ?? "?"}ms, model=${meta.model ?? "?"}, rule=${meta.rule ?? rule}`);

    return response.data.result;

  } catch (error) {
    const elapsedMs = Date.now() - startMs;

    // Distinguish timeout (our wrapper) from Firebase errors
    if (error.message && error.message.startsWith("TIMEOUT:")) {
      console.error(`[aiService] Client-side timeout after ${elapsedMs}ms — rule="${rule}"`, error);
      throw new Error(error.message);
    }

    // Extract structured Firebase error info
    const firebaseError = extractFirebaseError(error);
    console.error(
      `[aiService] Firebase callable error after ${elapsedMs}ms:`,
      firebaseError.full,
      "\nFull error object:",
      error
    );

    // Throw with the best available message for the UI
    const displayMessage = firebaseError.friendly
      ? `${firebaseError.friendly} (${firebaseError.code})`
      : `Processing failed: ${firebaseError.full}`;

    throw new Error(displayMessage);
  }
}
