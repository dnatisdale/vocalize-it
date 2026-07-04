import React, { useState, useRef, useEffect } from "react";
import { GripIcon, SparklesIcon, ClearIcon } from "../shared/Icons";

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
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const dragIndexRef = useRef(null);
  const catDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) return;
    const updated = [...categoryOrder];
    const [moved] = updated.splice(from, 1);
    updated.splice(index, 0, moved);
    dragIndexRef.current = index;
    setCategoryOrder(updated);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
  };

  const handleCategorySelect = (cat) => {
    if (cat.value === "distill") {
      setRule("distill");
      handleDistill();
    } else {
      setRule(cat.value);
    }
    setCatDropdownOpen(false);
  };

  return (
    <div className="controls-row" style={{ marginTop: "16px" }}>
      {/* Custom reorderable category dropdown */}
      <div className="select-wrapper cat-dropdown-wrapper" ref={catDropdownRef} style={{ position: "relative" }}>
        <button
          className="modern-select cat-dropdown-trigger"
          onClick={() => setCatDropdownOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={catDropdownOpen}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%", cursor: "pointer" }}
        >
          <span>{categoryOrder.find((c) => c.value === rule)?.label ?? "Summarize"}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "transform 0.2s", transform: catDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {catDropdownOpen && (
          <ul
            role="listbox"
            className="cat-dropdown-list"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 200,
              minWidth: "100%",
              background: "var(--bg-input)",
              isolation: "isolate",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              padding: "6px",
              margin: 0,
              listStyle: "none",
              animation: "fadeIn 0.15s",
            }}
          >
            {categoryOrder.map((cat, index) => (
              <li
                key={cat.value}
                role="option"
                aria-selected={rule === cat.value}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: rule === cat.value ? "var(--color-primary)" : "var(--bg-input)",
                  color: rule === cat.value ? "#fff" : "var(--text-primary)",
                  fontWeight: rule === cat.value ? 600 : 400,
                  fontSize: "0.9rem",
                  userSelect: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (rule !== cat.value) e.currentTarget.style.background = "var(--border-color)";
                }}
                onMouseLeave={(e) => {
                  if (rule !== cat.value) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  title="Drag to reorder"
                  style={{ cursor: "grab", opacity: 0.45, flexShrink: 0, lineHeight: 0 }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripIcon />
                </span>
                <span
                  className="cat-label-wrapper"
                  style={{ flex: 1, position: "relative" }}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat.label}
                  {cat.description && (
                    <span className="cat-tooltip">
                      {cat.description}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Newsletter Template Selector (Only visible for Clean-It-Up mode) */}
      {templates.length > 0 && rule === "distill" && (
        <div className="select-wrapper" style={{ flex: 1, minWidth: "160px" }}>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="modern-select"
            style={{ paddingRight: "32px", fontSize: "0.95rem" }}
          >
            <option value="none">Select Newsletter Template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={rule === "distill" ? handleDistill : handleProcess}
        disabled={isProcessing}
        className="btn btn-primary"
      >
        {isProcessing ? (
          "Processing..."
        ) : rule === "distill" ? (
          <>
            <SparklesIcon /> Clean Up Text
          </>
        ) : (
          <>
            <SparklesIcon /> Process with Gemini AI
          </>
        )}
      </button>

      <button onClick={handleClear} className="btn btn-secondary">
        <ClearIcon /> Clear
      </button>
    </div>
  );
}

export { DEFAULT_CATEGORIES };
