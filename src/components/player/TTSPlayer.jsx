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
  downloadMP3,
  isDownloading,
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
        <button onClick={() => handleSpeakToggle(processedText || clipboardText)} className="btn btn-accent" style={{ flex: 3, minWidth: "120px" }}>
          {isPlaying && !isPaused ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="soundwave-icon">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
              Playing...
            </span>
          ) : (
            <span>{isPlaying && isPaused ? "▶ Resume" : "▶ Play"}</span>
          )}
        </button>
        <button onClick={() => downloadMP3(processedText || clipboardText)} className="btn btn-mp3" style={{ flex: 1, minWidth: "70px" }} title="Save as MP3" disabled={isDownloading}>
          {isDownloading ? "..." : "MP3"}
        </button>
        <button onClick={stopSpeech} className="btn btn-secondary" style={{ flex: 1, minWidth: "50px", maxWidth: "60px", display: "flex", justifyContent: "center", alignItems: "center" }} disabled={!isPlaying && !isPaused} title="Stop">
          ■
        </button>
      </div>
    </div>
  );
}
