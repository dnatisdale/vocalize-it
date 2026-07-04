import React from "react";
import { BoilerplateTuner } from "./BoilerplateTuner";

export function ResultCard({
  rule,
  clipboardText,
  processedText,
  distillerStats,
  activeTemplate,
  handleRemoveBlockedPhrase,
  handleAddBlockedPhrase,
  renderLayoutGrip,
  isDragged,
  onDragStart,
  onDragOver,
  onDragEnd,
  getRuleLabel
}) {
  if (!clipboardText || (rule !== "distill" && !processedText)) return null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className="result-card"
      style={{
        marginTop: "20px",
        animation: "fadeIn 0.3s",
        opacity: isDragged ? 0.4 : 1,
        transition: "opacity 0.2s ease, transform 0.2s ease"
      }}
    >
      <div className="result-header">
        <span>{rule === "distill" ? "Distillery" : "AI Output Result"}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {renderLayoutGrip("distillery")}
          <span className="result-badge">{getRuleLabel(rule)}</span>
        </div>
      </div>

      {rule === "distill" && distillerStats && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px", fontStyle: "italic" }}>
          {distillerStats}
        </p>
      )}
      
      {rule === "distill" ? (
        <BoilerplateTuner 
          clipboardText={clipboardText}
          processedText={processedText}
          activeTemplate={activeTemplate}
          handleRemoveBlockedPhrase={handleRemoveBlockedPhrase}
          handleAddBlockedPhrase={handleAddBlockedPhrase}
        />
      ) : (
        <p className="result-content">{processedText}</p>
      )}
    </div>
  );
}
