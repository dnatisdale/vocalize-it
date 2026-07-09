import React from "react";

export function UpdateBanner({ needRefresh, updateServiceWorker }) {
  if (!needRefresh) return null;

  return (
    <div className="install-banner" style={{ background: "var(--color-primary)", border: "none" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <h4 style={{ margin: 0, color: "white", fontSize: "1.05rem" }}>Update Available</h4>
        <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "0.85rem" }}>A newer version of <b><span style={{ marginRight: "0.15em" }}>Listen</span>Better</b> is ready.</p>
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
