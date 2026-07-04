import React, { useState } from "react";
import { SpeakerIcon, PlayIcon, PauseIcon, StopIcon, CopyIcon } from "../shared/Icons";

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
  const [isPlayerSettingsExpanded, setIsPlayerSettingsExpanded] = useState(false);

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
      <div className="result-header">
        <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span>TTS Player</span>
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {renderLayoutGrip("player")}
          <button
            onClick={() => setIsPlayerSettingsExpanded(prev => !prev)}
            title={isPlayerSettingsExpanded ? "Hide Player Settings" : "Show Player Settings"}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              color: "var(--text-secondary)",
              transition: "color 0.2s",
              marginLeft: "4px"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.25s ease", transform: isPlayerSettingsExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {isPlayerSettingsExpanded && (
        <div className="tts-controls-panel" style={{ marginTop: 0, animation: "fadeIn 0.2s" }}>
          <div className="tts-controls-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label className="slider-label" style={{ fontSize: "0.8rem" }}>Select Voice</label>
              <div className="select-wrapper" style={{ minWidth: "100%" }}>
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value, processedText || clipboardText)}
                  className="modern-select"
                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                >
                  {voices.length === 0 ? (
                    <option>Default Voice</option>
                  ) : (
                    voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="speed-slider-group">
              <div className="slider-label">
                <span>Speed / Rate</span>
                <span>{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value), processedText || clipboardText)}
                className="modern-slider"
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "space-between" }}>
                <button 
                  onClick={() => handleRateChange(0.85, processedText || clipboardText)}
                  style={{ flex: 1, fontSize: "0.75rem", padding: "4px 0", background: rate === 0.85 ? "var(--color-primary)" : "var(--bg-input)", color: rate === 0.85 ? "#fff" : "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }}
                >Slow</button>
                <button 
                  onClick={() => handleRateChange(1.0, processedText || clipboardText)}
                  style={{ flex: 1, fontSize: "0.75rem", padding: "4px 0", background: rate === 1.0 ? "var(--color-primary)" : "var(--bg-input)", color: rate === 1.0 ? "#fff" : "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }}
                >Normal</button>
                <button 
                  onClick={() => handleRateChange(1.1, processedText || clipboardText)}
                  style={{ flex: 1, fontSize: "0.75rem", padding: "4px 0", background: rate === 1.1 ? "var(--color-primary)" : "var(--bg-input)", color: rate === 1.1 ? "#fff" : "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }}
                >Podcast</button>
                <button 
                  onClick={() => handleRateChange(1.25, processedText || clipboardText)}
                  style={{ flex: 1, fontSize: "0.75rem", padding: "4px 0", background: rate === 1.25 ? "var(--color-primary)" : "var(--bg-input)", color: rate === 1.25 ? "#fff" : "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }}
                >Fast</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
        <button onClick={() => handleSpeakToggle(processedText || clipboardText)} className="btn btn-accent" style={{ flex: 1, minWidth: "140px" }}>
          {isPlaying ? (isPaused ? <PlayIcon /> : <PauseIcon />) : <SpeakerIcon />}
          <span>{isPlaying ? (isPaused ? " Resume Audio" : " Pause Audio") : " Play Audio"}</span>
        </button>
        {isPlaying && (
          <button onClick={stopSpeech} className="btn btn-secondary">
            <StopIcon /> Stop
          </button>
        )}
        {processedText && (
          <button onClick={handleCopyResult} className="btn btn-secondary" style={{ flex: 1, minWidth: "120px" }}>
            <CopyIcon /> Copy Clean Text
          </button>
        )}
      </div>
    </div>
  );
}
