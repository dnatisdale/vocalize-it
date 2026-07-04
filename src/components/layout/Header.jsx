import React from "react";
import { ShareIcon, SunIcon, MoonIcon } from "../shared/Icons";

export function Header({ theme, toggleTheme, handleShareApp, toggleSettings }) {
  return (
    <header className="app-header" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Bar: Navigation & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <button
          onClick={toggleSettings}
          className="header-action-btn"
          title="Settings"
          aria-label="Settings"
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>≡</span> Settings
        </button>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <button
            onClick={handleShareApp}
            className="header-action-btn"
            title="Share App"
            aria-label="Share App"
          >
            <ShareIcon /> Share
          </button>
          <button
            onClick={toggleTheme}
            className="header-action-btn"
            title="Toggle theme"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />} Theme
          </button>
        </div>
      </div>

      {/* Main Title Area */}
      <div className="app-title-group" style={{ position: "relative", textAlign: "center", maxWidth: "600px", margin: "0 auto", padding: "16px 0" }}>
        
        {/* Decorative Wavy Line */}
        <svg 
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100vw", height: "150px", zIndex: 0, opacity: 0.15, pointerEvents: "none", color: "var(--text-secondary)" }}
          viewBox="0 150 1440 350" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,320 C320,160 640,480 1440,250" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 
            className="app-title" 
            style={{ fontSize: "2.5rem", marginBottom: "8px", display: "inline-flex" }}
          >
            {"Listen Better".split("").map((char, index) => (
              <span 
                key={index} 
                className="piano-key"
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  minWidth: char === " " ? "0.3em" : "auto" 
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>
          <p className="app-subtitle" style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "12px", color: "var(--text-primary)" }}>Paste anything. Hear what matters.</p>
        </div>
      </div>
    </header>
  );
}
