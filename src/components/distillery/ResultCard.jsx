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
  handleAddToBlocklist,
  rate,
  voices,
  selectedVoice,
  handleRateChange,
  handleVoiceChange
}) {
  const [confirmBlock, setConfirmBlock] = React.useState(null);
  const [showSettings, setShowSettings] = React.useState(false);

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
        <span>{rule === "distill" ? "Distillery" : "Results"}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {rule !== "distill" && processingModeFeedback && (
            <span style={{ fontSize: "0.75rem", fontStyle: "italic", opacity: 0.8, marginRight: "4px", background: "var(--bg-input)", padding: "2px 8px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              {processingModeFeedback}
            </span>
          )}
          {renderLayoutGrip("distillery")}
          
          {rule !== "distill" && rate && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg-input)", padding: "2px 8px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{Number(rate).toFixed(2)}x</span>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontSize: "0.9rem" }}
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && rule !== "distill" && (
        <div className="speed-slider-group" style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)", animation: "fadeIn 0.2s ease-out" }}>
          <div className="slider-label" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Speech Rate: {Number(rate).toFixed(2)}x</span>
            {rate !== 1.0 && (
              <span onClick={() => handleRateChange(1.0, processedText || clipboardText)} style={{ fontSize: "0.8rem", color: "var(--color-primary)", cursor: "pointer" }}>Reset to 1.0x</span>
            )}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value), processedText || clipboardText)}
              className="modern-slider"
              style={{ width: "100%", height: "6px", borderRadius: "3px", appearance: "none", background: "var(--border-color)", outline: "none", marginTop: "8px" }}
            />
          </div>

          <div className="select-wrapper" style={{ minWidth: "100%" }}>
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value, processedText || clipboardText)}
              className="modern-select"
              style={{ padding: "12px 14px", fontSize: "0.95rem" }}
            >
              {voices?.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang}) {v.localService ? "[Offline]" : "[Cloud]"}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
                  className="btn-ignore"
                  style={{
                    opacity: confirmBlock === idx ? 1 : 0.4
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => { if (confirmBlock !== idx) e.currentTarget.style.opacity = 0.4; }}
                >
                  × Ignore
                </button>
                {confirmBlock === idx && (
                  <div style={{
                    position: "absolute", right: "100%", top: "0", marginRight: "8px",
                    background: "var(--color-secondary)", border: "1px solid var(--border-color)", color: "#ffffff",
                    padding: "8px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    whiteSpace: "nowrap", zIndex: 10, display: "flex", alignItems: "center", gap: "8px"
                  }}>
                    <span style={{ fontSize: "0.85rem" }}>Add to blocklist?</span>
                    <button onClick={() => { handleAddToBlocklist(para); setConfirmBlock(null); }} style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}>Yes</button>
                    <button onClick={() => setConfirmBlock(null)} style={{ background: "#ffffff", color: "#000000", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>No</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {rule !== "distill" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <span className="result-badge">{getRuleLabel(rule)}</span>
        </div>
      )}
    </div>
  );
}
