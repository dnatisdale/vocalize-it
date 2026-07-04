import React, { useState } from "react";
import { LockIcon, UnlockIcon, EditIcon, TrashIcon } from "../shared/Icons";

export function TemplateManager({
  templates,
  handleCreateTemplate,
  handleDeleteTemplate,
  handleToggleLockTemplate,
  handleRenameTemplate,
  handleAddBlockedPhrase,
  handleRemoveBlockedPhrase,
  renderLayoutGrip,
  isDragged,
  onDragStart,
  onDragOver,
  onDragEnd,
}) {
  const [expandedTemplateId, setExpandedTemplateId] = useState(null);
  const [addPhraseInputs, setAddPhraseInputs] = useState({});

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className="result-card templates-section" 
      style={{ 
        marginTop: "20px", 
        textAlign: "left",
        opacity: isDragged ? 0.4 : 1,
        transition: "opacity 0.2s ease, transform 0.2s ease"
      }}
    >
      <div className="result-header" style={{ marginBottom: "16px" }}>
        <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          Custom Filters ({templates.length})
        </span>
        {renderLayoutGrip("filters")}
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
        Create custom templates for newsletters you paste regularly to exclude specific boilerplate and repeating sections from being read.
      </p>

      <div className="new-template-form" style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "var(--bg-app)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "20px" }}>
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <input 
            type="text" 
            id="new-tpl-name" 
            placeholder="Template Name" 
            className="modern-select" 
            style={{ padding: "8px 12px", background: "var(--bg-input)" }} 
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button 
            onClick={() => {
              const nameInput = document.getElementById("new-tpl-name");
              if (nameInput) {
                const name = nameInput.value.trim();
                if (!name) {
                  alert("Please enter a template name.");
                  return;
                }
                const newTpl = handleCreateTemplate(name);
                if (newTpl) setExpandedTemplateId(newTpl.id);
                nameInput.value = "";
              }
            }} 
            className="btn btn-accent" 
            style={{ padding: "10px 16px", fontSize: "0.85rem", height: "40px" }}
          >
            + Create Template
          </button>
        </div>
      </div>

      <div className="templates-list">
        {templates.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
            No templates yet. Create one above!
          </p>
        ) : (
          templates.map(tpl => (
            <div key={tpl.id} className="template-item" style={{ marginBottom: "12px", border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden", background: "var(--bg-app)" }}>
              <div 
                className="template-item-header" 
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", background: expandedTemplateId === tpl.id ? "var(--border-color)" : "transparent", transition: "background 0.2s ease" }}
                onClick={() => setExpandedTemplateId(prev => prev === tpl.id ? null : tpl.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ transition: "transform 0.2s", transform: expandedTemplateId === tpl.id ? "rotate(90deg)" : "rotate(0deg)", color: "var(--text-secondary)", fontSize: "0.8rem", display: "inline-block" }}>▶</span>
                  <strong style={{ fontSize: "0.95rem" }}>{tpl.name}</strong>
                  {tpl.isLocked && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "rgba(0,0,0,0.1)", padding: "2px 6px", borderRadius: "4px" }} title="Locked template">Locked</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleToggleLockTemplate(tpl.id)} className="btn-icon" title={tpl.isLocked ? "Unlock template to edit" : "Lock template to prevent accidental edits"} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}>
                    {tpl.isLocked ? <LockIcon /> : <UnlockIcon />}
                  </button>
                  <button onClick={() => handleRenameTemplate(tpl.id, tpl.name)} className="btn-icon" title="Rename template" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}>
                    <EditIcon />
                  </button>
                  <button onClick={() => handleDeleteTemplate(tpl.id)} className="btn-icon" title="Delete template" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-danger)", padding: "4px" }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {expandedTemplateId === tpl.id && (
                <div className="template-item-body" style={{ padding: "16px", borderTop: "1px solid var(--border-color)", background: "var(--bg-card)", animation: "fadeIn 0.2s" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <input 
                      type="text" 
                      value={addPhraseInputs[tpl.id] || ""}
                      onChange={(e) => setAddPhraseInputs(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddBlockedPhrase(tpl.id, addPhraseInputs[tpl.id] || "");
                          setAddPhraseInputs(prev => ({ ...prev, [tpl.id]: "" }));
                        }
                      }}
                      placeholder="Add exact phrase to exclude..." 
                      className="modern-select" 
                      style={{ flex: 1, padding: "8px 12px", background: "var(--bg-input)", fontSize: "0.85rem" }}
                      disabled={tpl.isLocked}
                    />
                    <button 
                      onClick={() => {
                        handleAddBlockedPhrase(tpl.id, addPhraseInputs[tpl.id] || "");
                        setAddPhraseInputs(prev => ({ ...prev, [tpl.id]: "" }));
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: "8px 12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                      disabled={tpl.isLocked || !addPhraseInputs[tpl.id]?.trim()}
                    >
                      Add Filter
                    </button>
                  </div>

                  <div className="phrases-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {tpl.blockedPhrases.length === 0 ? (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>No filters added yet.</p>
                    ) : (
                      tpl.blockedPhrases.map((phrase, idx) => (
                        <div key={idx} className="phrase-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", wordBreak: "break-word" }}>{phrase}</span>
                          <button 
                            onClick={() => handleRemoveBlockedPhrase(tpl.id, phrase)} 
                            disabled={tpl.isLocked}
                            title={tpl.isLocked ? "Template is locked" : "Remove filter"}
                            style={{ background: "transparent", border: "none", cursor: tpl.isLocked ? "not-allowed" : "pointer", color: "var(--color-danger)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", opacity: tpl.isLocked ? 0.4 : 1 }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
