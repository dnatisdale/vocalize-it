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
  const [showSettings, setShowSettings] = useState(false);

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
        <button onClick={() => setShowSettings(!showSettings)} className="btn btn-secondary" style={{ minWidth: "50px", maxWidth: "60px", display: "flex", justifyContent: "center", alignItems: "center" }} title="Settings">
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="speed-slider-group" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-color)", animation: "fadeIn 0.2s ease-out" }}>
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
      )}
    </div>
  );
}
