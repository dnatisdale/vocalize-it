import React from "react";
import { ShareIcon, SunIcon, MoonIcon } from "../shared/Icons";

export function Header({ theme, toggleTheme, handleShareApp }) {
  return (
    <header className="app-header">
      <div className="app-title-group">
        <h1 className="app-title">Vocalize.it</h1>
        <p className="app-subtitle">Smart AI Clipboard Processor & TTS Hub</p>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={handleShareApp}
          className="theme-toggle-btn"
          title="Share App"
          aria-label="Share App"
        >
          <ShareIcon />
        </button>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title="Toggle theme"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
