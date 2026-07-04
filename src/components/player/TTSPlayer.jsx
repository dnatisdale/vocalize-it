import React, { useState } from "react";

export function TTSPlayer({
  clipboardText,
  processedText,
  voices,
  selectedVoice,
  rate,
  isPlaying,
  isPaused,
  handleSpeakToggle,
  stopSpeech,
  handleVoiceChange,
  handleRateChange,
  renderLayoutGrip,
  isDragged,
  onDragStart,
  onDragOver,
  onDragEnd,
  handleCopyResult
}) {
  if (!clipboardText) return null;

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className="result-card tts-player-card" 
      style={{ 
        marginTop: "20px", 
        animation: "fadeIn 0.3s",
        opacity: isDragged ? 0.4 : 1,
        transition: "opacity 0.2s ease, transform 0.2s ease"
      }}
    >
      <div className="result-header" style={{ marginBottom: "16px" }}>
        <span style={{ display: "flex", gap: "8px", alignItems: "center", fontWeight: "bold" }}>
          <span>Listen Better Player</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
        <button onClick={() => handleSpeakToggle(processedText || clipboardText)} className="btn btn-accent" style={{ flex: 2, minWidth: "120px" }}>
          <span>{isPlaying ? (isPaused ? "▶ Resume" : "⏸ Pause") : "▶ Play"}</span>
        </button>
        <button onClick={stopSpeech} className="btn btn-secondary" style={{ flex: 1, minWidth: "100px" }} disabled={!isPlaying && !isPaused}>
          ■ Stop
        </button>
      </div>

      <div className="speed-slider-group" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
        <div className="slider-label" style={{ marginBottom: "8px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Speech Rate: {rate}x</span>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", marginBottom: "16px" }}>
          {[0.75, 1.0, 1.25, 1.5].map((speed) => (
            <button 
              key={speed}
              onClick={() => handleRateChange(speed, processedText || clipboardText)}
              style={{ flex: 1, fontSize: "0.85rem", padding: "8px 0", background: rate === speed ? "var(--color-primary)" : "var(--bg-input)", color: rate === speed ? "#fff" : "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s ease" }}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="select-wrapper" style={{ minWidth: "100%" }}>
          <select
            value={selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value, processedText || clipboardText)}
            className="modern-select"
            style={{ padding: "12px 14px", fontSize: "0.95rem" }}
          >
            {voices.length === 0 ? (
              <option>Default Voice</option>
            ) : (
              voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang}) {v.localService ? "[Offline]" : "[Cloud]"}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
