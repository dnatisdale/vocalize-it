import React, { useState, useRef, useEffect } from "react";
import { GripIcon, SparklesIcon, ClearIcon, HeadphoneIcon } from "../shared/Icons";

const DEFAULT_CATEGORIES = [
  {
    value: "categorize",
    label: "Categorize Text",
    description: "Reads the content and assigns 3–5 descriptive topic tags or categories.",
  },
  {
    value: "listenmode",
    label: "Listen Mode",
    description: "Transforms content into a natural audio-first narrative.",
  },
  {
    value: "newsletter",
    label: "🗞️ Newsletter Digest",
    description: "Strips everything except the main editorial content.",
  },
  {
    value: "distill",
    label: "Clean-It-Up",
    description: "Instantly strips nav menus, footers, ads, and email boilerplate — no AI needed.",
  },
  {
    value: "correct",
    label: "Correct Grammar",
    description: "Fixes spelling, punctuation, and grammar without changing your meaning or tone.",
  },
  {
    value: "explain",
    label: "Explain Simply (ELI10)",
    description: "Rewrites complex or jargon-heavy content so a 10-year-old could understand it.",
  },
  {
    value: "bulletpoints",
    label: "Key Takeaways",
    description: "Pulls out the most important facts and ideas as a clean, scannable bullet list.",
  },
  {
    value: "summarize",
    label: "Summarize",
    description: "Condenses the text into a single, clear paragraph capturing the main point.",
  },
  {
    value: "translate_es",
    label: "Translate to Spanish",
    description: "Translates the full text into natural, fluent Spanish.",
  },
  {
    value: "translate_th",
    label: "Translate to Thai",
    description: "Translates the full text into natural, fluent Thai (ภาษาไทย).",
  },
];

export function ActionControls({
  rule,
  setRule,
  handleDistill,
  handleProcess,
  handleClear,
  isProcessing,
  templates,
  selectedTemplateId,
  handleSelectTemplate,
  categoryOrder,
  setCategoryOrder
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const onListenBetter = () => {
    // FIX: Pass the rule directly as an override so handleProcess uses "listenmode"
    // immediately — setRule() is async and would run AFTER handleProcess() fires,
    // causing the wrong prompt to be sent to Gemini (the race condition bug).
    setRule("listenmode");
    handleProcess("listenmode");
  };

  const handleAdvancedToolSelect = (val) => {
    // FIX: Same race condition fix — pass val directly as rule override.
    setRule(val);
    if (val === "distill") {
      handleDistill();
    } else {
      handleProcess(val);
    }
  };

  return (
    <div className="controls-row" style={{ marginTop: "24px", flexDirection: "column", gap: "16px", alignItems: "stretch" }}>
      
      {/* Primary Action */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onListenBetter}
          disabled={isProcessing}
          className="btn btn-primary btn-action-main"
        >
          {isProcessing ? "Processing..." : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5em", pointerEvents: "none" }}>
              <HeadphoneIcon />
              <span className="listen-word">Listen</span>
              <span className="better-word">Better</span>
            </div>
          )}
        </button>
        <button onClick={handleClear} className="btn btn-secondary" style={{ padding: "0 20px", fontSize: "1.2rem", fontWeight: "bold" }} title="Clear Text">
          X
        </button>
      </div>
    </div>
  );
}

export function AdvancedTools({ rule, setRule, handleDistill, handleProcess, isProcessing }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleAdvancedToolSelect = (val) => {
    // FIX: Pass val directly as rule override — same race condition fix as ActionControls.
    setRule(val);
    if (val === "distill") {
      handleDistill();
    } else {
      handleProcess(val);
    }
  };

  return (
    <div style={{ padding: "16px", marginTop: "16px" }}>
      <button 
        onClick={() => setAdvancedOpen(!advancedOpen)}
        style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", width: "100%", justifyContent: "center" }}
      >
        <span>Advanced Tools</span>
        <span style={{ transition: "transform 0.2s", transform: advancedOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>

      {advancedOpen && (
        <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", animation: "fadeIn 0.2s" }}>
          {DEFAULT_CATEGORIES.filter(c => c.value !== "listenmode").map(cat => (
            <button
              key={cat.value}
              onClick={() => handleAdvancedToolSelect(cat.value)}
              disabled={isProcessing}
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem", padding: "6px 12px", background: "var(--bg-input)" }}
              title={cat.description}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { DEFAULT_CATEGORIES };
