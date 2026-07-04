import React from "react";
import { ShareIcon, SunIcon, MoonIcon } from "../shared/Icons";

export function Header({ theme, toggleTheme, handleShareApp, toggleSettings }) {
  return (
    <header className="app-header" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Bar: Navigation & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <button
          onClick={toggleSettings}
          className="theme-toggle-btn"
          title="Settings"
          aria-label="Settings"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.95rem", padding: "8px", display: "flex", gap: "6px", alignItems: "center" }}
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>≡</span> Settings
        </button>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            onClick={handleShareApp}
            className="theme-toggle-btn"
            title="Share App"
            aria-label="Share App"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.9rem", padding: "8px" }}
          >
            Share ↑
          </button>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Toggle theme"
            aria-label="Toggle Theme"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.9rem", padding: "8px" }}
          >
            Theme {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>

      {/* Main Title Area */}
      <div className="app-title-group" style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h1 
          className="app-title" 
          style={{ fontSize: "2.5rem", marginBottom: "8px" }}
        >
          Listen Better
        </h1>
        <p className="app-subtitle" style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "12px", color: "var(--text-primary)" }}>Paste anything. Hear what matters.</p>
      </div>
    </header>
  );
}
