import React from "react";

export function UpdateBanner({ needRefresh, updateServiceWorker }) {
  if (!needRefresh) return null;

  return (
    <div className="install-banner" style={{ background: "var(--color-primary)", border: "none" }}>
      <div className="install-banner-text">
        <h4 style={{ color: "#fff" }}>Update Available!</h4>
        <p style={{ color: "rgba(255, 255, 255, 0.9)" }}>A newer version of Listen Better is ready.</p>
      </div>
      <div className="install-banner-actions">
        <button 
          className="btn-white" 
          style={{ background: "#fff", color: "var(--color-primary)" }}
          onClick={() => updateServiceWorker(true)}
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
