import React from "react";

export function InstallBanner({ showInstallBanner, triggerInstallPrompt, dismissInstallBanner }) {
  if (!showInstallBanner) return null;

  return (
    <div className="install-banner">
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
        <img src="/pwa-192x192.png" alt="Listen Better Icon" style={{ width: "48px", height: "48px", borderRadius: "12px" }} />
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Install <span className="brand-text-inline"><img src="/pwa-192x192.png" alt="" className="inline-brand-logo" /><b><span style={{ marginRight: "0.15em" }}>Listen</span>Better</b></span></h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>Get the full app experience</p>
        </div>
      </div>
      <div className="install-banner-actions">
        <button className="btn-white" onClick={triggerInstallPrompt}>
          Install
        </button>
        <button
          className="btn-secondary"
          style={{ padding: "8px 12px", border: "none" }}
          onClick={dismissInstallBanner}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
