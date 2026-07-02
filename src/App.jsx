import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/firebase"; // Your config file
import "./App.css";

function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rule, setRule] = useState("summarize");

  // We keep this to track if the button should say Play or Pause
  const [isPlaying, setIsPlaying] = useState(false);

  // Grab text directly from the device clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      setProcessedText(""); // Reset output when new text is pasted
      window.speechSynthesis.cancel(); // Stop any audio if they paste new text
      setIsPlaying(false);
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      alert("Please allow clipboard permissions in your browser.");
    }
  };

  // Your Firebase Cloud Function call
  const handleProcess = async () => {
    if (!clipboardText) return;
    setIsProcessing(true);

    try {
      const functions = getFunctions(app);
      const processClip = httpsCallable(functions, "processClip");
      const response = await processClip({ text: clipboardText, rule: rule });
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

  // Updated Text-to-Speech with Play/Pause functionality
  const handleSpeakToggle = () => {
    if (!processedText) return;

    // 1. If it's currently speaking, pause it
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    // 2. If it is paused, resume it from where it left off
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    // 3. If it isn't playing at all, start fresh
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(processedText);

    // Tell the button to switch back to "Play" when the audio finishes
    utterance.onend = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
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

      {/* Input Area */}
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

      {/* Output Area */}
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
            {/* The updated Play/Pause Button */}
            <button onClick={handleSpeakToggle} style={btnStyleSecondary}>
              {isPlaying ? "⏸ Pause Audio" : "🔊 Play Audio"}
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
  minWidth: "140px", // Keeps the button from resizing aggressively
};

export default App;
