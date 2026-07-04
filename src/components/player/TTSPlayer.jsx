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
        <button onClick={() => handleSpeakToggle(processedText || clipboardText)} className="btn btn-accent" style={{ flex: 1, minWidth: "140px" }}>
          <span>{isPlaying ? (isPaused ? "▶ Resume Audio" : "⏸ Pause Audio") : "▶ Play Audio"}</span>
        </button>
        {isPlaying && (
          <button onClick={stopSpeech} className="btn btn-secondary">
            ■ Stop
          </button>
        )}
        {processedText && (
          <button onClick={handleCopyResult} className="btn btn-secondary" style={{ flex: 1, minWidth: "120px" }}>
            ⎘ Copy Text
          </button>
        )}
      </div>
    </div>
  );
}
