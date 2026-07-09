import React, { useState } from "react";
import { distillContent } from "../../utils/contentDistiller";

export function BoilerplateTuner({
  clipboardText,
  processedText,
  activeTemplate,
  handleRemoveBlockedPhrase,
  handleAddBlockedPhrase,
}) {
  const [showDistilledText, setShowDistilledText] = useState(false);

  return (
    <div className="boilerplate-tuner-panel" style={{ animation: "fadeIn 0.2s" }}>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        Click the <strong>"X"</strong> means you want to exclude that section, and clicking the <strong>"+"</strong> means you want the section included and read aloud.
        {activeTemplate ? (
          activeTemplate.isLocked && (
            <span style={{ marginLeft: "8px", color: "var(--color-danger)", fontWeight: 600, fontSize: "0.8rem" }}>
              🔒 Template is locked — unlock it in the Filters manager below to make changes.
            </span>
          )
        ) : (
          <span style={{ marginLeft: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>
            No template selected — changes here won't be saved until you apply or create a template below.
          </span>
        )}
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {(() => {
          const baseClean = distillContent(clipboardText);
          return baseClean.split("\n\n").map((para, idx) => {
            const trimmedPara = para.trim();
            if (!trimmedPara) return null;

            const lowerPara = trimmedPara.toLowerCase();
            const blockedPhrases = activeTemplate ? activeTemplate.blockedPhrases : [];
            const matchingPhrase = blockedPhrases.find(phrase =>
              phrase && lowerPara.includes(phrase.toLowerCase())
            );
            const isBlocked = !!matchingPhrase;
            const isLocked = activeTemplate ? activeTemplate.isLocked : false;

            return (
              <div
                key={idx}
                className="tuner-row"
                style={{
                  position: "relative",
                  padding: "10px 44px 10px 12px",
                  background: isBlocked ? "rgba(239, 68, 68, 0.04)" : "var(--bg-app)",
                  border: isBlocked ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--border-color)",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{
                  display: "block",
                  whiteSpace: "pre-wrap",
                  textDecoration: isBlocked ? "line-through" : "none",
                  opacity: isBlocked ? 0.4 : 1,
                  color: isBlocked ? "var(--text-secondary)" : "var(--text-primary)",
                  lineHeight: 1.5
                }}>
                  {trimmedPara}
                </span>

                {activeTemplate ? (
                  <button
                    onClick={() => {
                      if (isLocked) {
                        alert("This template is locked. Unlock it in the Filters manager below to make changes.");
                        return;
                      }
                      if (isBlocked) {
                        handleRemoveBlockedPhrase(activeTemplate.id, matchingPhrase);
                      } else {
                        const filterPhrase = trimmedPara.length > 70 ? trimmedPara.substring(0, 70) : trimmedPara;
                        handleAddBlockedPhrase(activeTemplate.id, filterPhrase);
                      }
                    }}
                    title={isLocked ? "Unlock template to make changes" : isBlocked ? "Restore: include this section in the reading" : "Exclude this section from reading"}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      border: `1.5px solid ${isBlocked ? "var(--color-success)" : "var(--color-danger)"}`,
                      background: isBlocked ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: isBlocked ? "var(--color-success)" : "var(--color-danger)",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: isLocked ? 0.4 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                      padding: 0
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {isBlocked
                        ? <path d="M12 5v14M5 12h14"/> 
                        : <path d="M18 6L6 18M6 6l12 12"/>
                      }
                    </svg>
                  </button>
                ) : (
                  <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "0.65rem", color: "var(--text-secondary)", fontStyle: "italic", whiteSpace: "nowrap" }}>no template</span>
                )}
              </div>
            );
          });
        })()}
      </div>

      {processedText && (
        <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <button
            onClick={() => setShowDistilledText(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}
          >
            <span style={{ fontSize: "0.7rem" }}>{showDistilledText ? "▼" : "▶"}</span>
            {showDistilledText ? "Hide" : "Show"} distilled reading text
          </button>
          {showDistilledText && (
            <p className="result-content" style={{ marginTop: "10px", fontSize: "0.9rem" }}>{processedText}</p>
          )}
        </div>
      )}
    </div>
  );
}
