import React from "react";
import { ShareIcon, SunIcon, MoonIcon, MenuIcon } from "../shared/Icons";

export function Header({ theme, toggleTheme, handleShareApp, toggleSettings }) {
  return (
    <header className="app-header" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Main Title Area */}
      <div className="app-title-group" style={{ position: "relative", textAlign: "center", maxWidth: "600px", margin: "0 auto", padding: "0" }}>
        
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
          <h1 className="app-title" style={{ textAlign: "center", display: "block" }}>
            {"Listen Better".split("").map((char, index) => (
              <span 
                key={index} 
                className="piano-key"
                style={{ 
                  animationDelay: `${index * 0.06}s`,
                  WebkitAnimationDelay: `${index * 0.06}s`,
                  minWidth: char === " " ? "0.5em" : "auto",
                  fontWeight: index < 6 ? 400 : 800
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <sup style={{ fontSize: "0.4em", fontWeight: 400, marginLeft: "2px", opacity: 0.8, verticalAlign: "super" }}>®</sup>
          </h1>
          <p className="app-subtitle">Paste anything. Hear what matters.</p>
        </div>
      </div>
    </header>
  );
}
