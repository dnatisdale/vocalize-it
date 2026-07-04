import React from "react";
import { ClipboardIcon } from "../shared/Icons";

export function InputArea({ clipboardText, setClipboardText, handlePaste, handleTextPaste }) {
  if (!clipboardText) {
    return (
      <button onClick={handlePaste} className="paste-hero-btn">
        <ClipboardIcon /> Paste from Device Clipboard
        <span>Click here to grab contents from your system clipboard</span>
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
          placeholder="Enter or paste text to process..."
        />
        <span className="char-counter">{clipboardText.length} chars</span>
      </div>
    </div>
  );
}
