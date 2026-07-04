import React from "react";

export function InstallBanner({ showInstallBanner, triggerInstallPrompt, dismissInstallBanner }) {
  if (!showInstallBanner) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        <h4>Install Vocalize.it</h4>
        <p>Add to your home screen for quick, offline-capable clipboard processing.</p>
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
