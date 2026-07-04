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
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Speech Rate: {Number(rate).toFixed(2)}x</span>
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
