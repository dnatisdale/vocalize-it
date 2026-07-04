import React from "react";
import { BoilerplateTuner } from "./BoilerplateTuner";

export function ResultCard({
  rule,
  clipboardText,
  processedText,
  distillerStats,
  processingModeFeedback,
  activeTemplate,
  handleRemoveBlockedPhrase,
  handleAddBlockedPhrase,
  renderLayoutGrip,
  isDragged,
  onDragStart,
  onDragOver,
  onDragEnd,
  getRuleLabel,
  handleAddToBlocklist
}) {
  const [confirmBlock, setConfirmBlock] = React.useState(null);

  if (!clipboardText || (rule !== "distill" && !processedText)) return null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className="result-card"
      style={{
        marginTop: "20px",
        animation: "fadeIn 0.3s",
        opacity: isDragged ? 0.4 : 1,
        transition: "opacity 0.2s ease, transform 0.2s ease"
      }}
    >
      <div className="result-header">
        <span>{rule === "distill" ? "Distillery" : "AI Output Result"}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {rule !== "distill" && processingModeFeedback && (
            <span style={{ fontSize: "0.75rem", fontStyle: "italic", opacity: 0.8, marginRight: "4px", background: "var(--bg-input)", padding: "2px 8px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              {processingModeFeedback}
            </span>
          )}
          {renderLayoutGrip("distillery")}
          <span className="result-badge">{getRuleLabel(rule)}</span>
        </div>
      </div>

      {rule === "distill" && distillerStats && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px", fontStyle: "italic" }}>
          {distillerStats}
        </p>
      )}
      
      {rule === "distill" ? (
        <BoilerplateTuner 
          clipboardText={clipboardText}
          processedText={processedText}
          activeTemplate={activeTemplate}
          handleRemoveBlockedPhrase={handleRemoveBlockedPhrase}
          handleAddBlockedPhrase={handleAddBlockedPhrase}
        />
      ) : (
        <div className="result-content" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {processedText.split(/\n+/).filter(p => p.trim()).map((para, idx) => (
            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", position: "relative" }}>
              <p style={{ margin: 0, flex: 1, whiteSpace: "pre-wrap" }}>{para}</p>
              
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setConfirmBlock(idx)}
                  title="Don't read this again"
                  style={{
                    background: "var(--bg-input)", border: "1px solid var(--border-color)", 
                    borderRadius: "8px", cursor: "pointer", padding: "4px 8px", fontSize: "0.9rem",
                    opacity: confirmBlock === idx ? 1 : 0.4, transition: "opacity 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => { if (confirmBlock !== idx) e.currentTarget.style.opacity = 0.4; }}
                >
                  × Ignore
                </button>
                {confirmBlock === idx && (
                  <div style={{
                    position: "absolute", right: "100%", top: "0", marginRight: "8px",
                    background: "var(--card-bg)", border: "1px solid var(--border-color)",
                    padding: "8px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    whiteSpace: "nowrap", zIndex: 10, display: "flex", alignItems: "center", gap: "8px"
                  }}>
                    <span style={{ fontSize: "0.85rem" }}>Add to blocklist?</span>
                    <button onClick={() => { handleAddToBlocklist(para); setConfirmBlock(null); }} style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}>Yes</button>
                    <button onClick={() => setConfirmBlock(null)} style={{ background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}>No</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
