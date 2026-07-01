import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/firebase"; // Your config file
import "./App.css";

function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rule, setRule] = useState("summarize");

  // Grab text directly from the device clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      setProcessedText(""); // Reset output when new text is pasted
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      alert("Please allow clipboard permissions in your browser.");
    }
  };

  // Placeholder for the Firebase Cloud Function
  const handleProcess = async () => {
    if (!clipboardText) return;
    setIsProcessing(true);

    try {
      // Initialize the Functions service
      const functions = getFunctions(app);

      // Point to the specific function we just wrote
      const processClip = httpsCallable(functions, "processClip");

      // Send the text and the rule to the backend
      const response = await processClip({ text: clipboardText, rule: rule });

      // Update the UI with the backend's response
      setProcessedText(response.data.result);
    } catch (error) {
      console.error("Error calling backend:", error);
      setProcessedText(
        "An error occurred while processing. Check the console.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Built-in browser Text-to-Speech
  const handleSpeak = () => {
    if (!processedText) return;

    // Cancel any ongoing speech before starting a new one
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(processedText);
    // You can eventually customize the voice, pitch, and speed here
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      {/* App Header */}
      <h1 style={{ color: "#2c3e50", marginBottom: "5px" }}>Vocalize.it</h1>
      <p style={{ color: "#7f8c8d", marginTop: "0", marginBottom: "30px" }}>
        Your smart, active clipboard processor.
      </p>

      {/* Primary Action */}
      <button onClick={handlePaste} style={btnStylePrimary}>
        📋 Paste from Clipboard
      </button>

      {/* Input Area (Appears after pasting) */}
      {clipboardText && (
        <div
          style={{
            marginTop: "30px",
            textAlign: "left",
            animation: "fadeIn 0.3s",
          }}
        >
          <label style={{ fontWeight: "bold", color: "#34495e" }}>
            Current Clip:
          </label>
          <textarea
            value={clipboardText}
            onChange={(e) => setClipboardText(e.target.value)}
            style={{
              width: "100%",
              height: "120px",
              padding: "12px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "1px solid #bdc3c7",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              marginTop: "15px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #bdc3c7",
              }}
            >
              <option value="summarize">Summarize</option>
              <option value="categorize">Categorize</option>
              <option value="correct">Correct Grammar</option>
            </select>

            <button
              onClick={handleProcess}
              disabled={isProcessing}
              style={isProcessing ? btnStyleDisabled : btnStyleAction}
            >
              {isProcessing ? "Processing..." : "✨ Process with AI"}
            </button>
          </div>
        </div>
      )}

      {/* Output Area (Appears after processing) */}
      {processedText && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            textAlign: "left",
            border: "1px solid #e9ecef",
          }}
        >
          <h3 style={{ marginTop: "0", color: "#2c3e50" }}>Result:</h3>
          <p style={{ lineHeight: "1.6", color: "#2c3e50" }}>{processedText}</p>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={handleSpeak} style={btnStyleSecondary}>
              🔊 Play Audio
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(processedText)}
              style={btnStyleSecondary}
            >
              📄 Copy Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Inline Styles ---
const btnStylePrimary = {
  padding: "12px 24px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "8px",
  border: "2px solid #2c3e50",
  backgroundColor: "#fff",
  color: "#2c3e50",
  fontWeight: "bold",
  transition: "0.2s",
};
const btnStyleAction = {
  padding: "12px 24px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#2980b9",
  color: "#fff",
  fontWeight: "bold",
};
const btnStyleDisabled = {
  padding: "12px 24px",
  fontSize: "16px",
  cursor: "not-allowed",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#95a5a6",
  color: "#fff",
  fontWeight: "bold",
};
const btnStyleSecondary = {
  padding: "10px 16px",
  cursor: "pointer",
  borderRadius: "6px",
  border: "1px solid #bdc3c7",
  backgroundColor: "#fff",
  color: "#34495e",
  fontWeight: "600",
};

export default App;
