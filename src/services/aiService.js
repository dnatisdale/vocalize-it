import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";

export async function processWithGemini(clipboardText, rule) {
  if (!clipboardText) throw new Error("No text provided");
  
  const functions = getFunctions(app);
  const processClip = httpsCallable(functions, "processClip");
  
  try {
    const response = await processClip({ text: clipboardText, rule: rule });
    return response.data.result;
  } catch (error) {
    console.error("Error calling backend:", error);
    throw new Error("An error occurred while processing. Please ensure your backend is running and you are online.");
  }
}
