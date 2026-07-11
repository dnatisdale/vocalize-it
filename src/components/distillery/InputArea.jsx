import React from "react";
import { ClipboardIcon } from "../shared/Icons";

export function InputArea({ clipboardText, setClipboardText, handlePaste, handleTextPaste, manualPasteMode }) {
  if (!clipboardText && !manualPasteMode) {
    return (
      <button onClick={handlePaste} className="paste-hero-btn">
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", color: "var(--color-primary)", fontSize: "1.2rem", marginBottom: "4px" }}>
          <span style={{ fontWeight: 600 }}>Paste Text to</span>
          <span style={{ width: "0.4em" }}></span>
          <span style={{ fontWeight: 400 }}>Listen</span>
          <span style={{ width: "0.25em" }}></span>
          <span style={{ fontWeight: 800 }}>Better</span>
        </span>
        <span style={{ fontSize: "0.9rem", opacity: 0.8, marginTop: "8px" }}>Click here to paste an email, newsletter, article, or document</span>
      </button>
    );
  }

  return (
    <div className="form-group" style={{ animation: "fadeIn 0.3s" }}>
      <label className="form-label">Active Clip Text</label>
      <div className="textarea-container">
        <textarea
          value={clipboardText}
          onChange={(e) => setClipboardText(e.target.value)}
          onPaste={(e) => {
            const pastedText = e.clipboardData.getData("text");
            if (pastedText) {
              // Slight delay to let React cycle finish, then run paste handler
              setTimeout(() => handleTextPaste(pastedText), 50);
            }
          }}
          className="modern-textarea"
          autoFocus={manualPasteMode}
          placeholder="Paste email, newsletter, article, PDF text, devotional, report, or any document..."
        />
        <span className="char-counter">{clipboardText.length} chars</span>
      </div>
    </div>
  );
}
