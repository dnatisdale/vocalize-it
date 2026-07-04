import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { InstallBanner } from "./components/layout/InstallBanner";
import { InputArea } from "./components/distillery/InputArea";
import { ActionControls, DEFAULT_CATEGORIES } from "./components/distillery/ActionControls";
import { ResultCard } from "./components/distillery/ResultCard";
import { TTSPlayer } from "./components/player/TTSPlayer";
import { TemplateManager } from "./components/templates/TemplateManager";

import { useSpeech } from "./hooks/useSpeech";
import { useTemplates } from "./hooks/useTemplates";
import { usePWA } from "./hooks/usePWA";
import { useLocalStorage } from "./hooks/useLocalStorage";

import { distillContent, getDistillerStats } from "./utils/contentDistiller";
import { processWithGemini } from "./services/aiService";

import "./App.css";

function generateHistoryId() {
  return Date.now().toString();
}

function App() {
  // PWA & Storage Hooks
  const { showInstallBanner, triggerInstallPrompt, dismissInstallBanner } = usePWA();
  const [theme, setTheme] = useLocalStorage("vocalize_theme", "dark");
  const [history, setHistory] = useLocalStorage("vocalize_history", []);

  // Application State
  const [clipboardText, setClipboardText] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("text") || params.get("title") || params.get("url") || "";
    }
    return "";
  });
  const [processedText, setProcessedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [distillerStats, setDistillerStats] = useState("");
  
  const [rule, setRule] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sharedAction = params.get("action");
      const validRules = ["summarize", "correct", "bulletpoints", "explain", "categorize", "translate_es", "translate_th", "distill"];
      if (sharedAction && validRules.includes(sharedAction)) return sharedAction;
      const saved = localStorage.getItem("vocalize_default_rule");
      if (saved && validRules.includes(saved)) return saved;
    }
    return "categorize";
  });

  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("vocalize_cat_order");
      if (saved) {
        const savedValues = JSON.parse(saved);
        const ordered = savedValues
          .map((v) => DEFAULT_CATEGORIES.find((c) => c.value === v))
          .filter(Boolean);
        const missing = DEFAULT_CATEGORIES.filter(
          (c) => !savedValues.includes(c.value)
        );
        return [...ordered, ...missing];
      }
    } catch { /* ignore parse errors */ }
    return DEFAULT_CATEGORIES;
  });

  // Persist rule changes
  useEffect(() => {
    localStorage.setItem("vocalize_default_rule", rule);
  }, [rule]);

  useEffect(() => {
    localStorage.setItem("vocalize_cat_order", JSON.stringify(categoryOrder.map((c) => c.value)));
  }, [categoryOrder]);

  // Layout State
  const [layoutOrder, setLayoutOrder] = useLocalStorage("vocalize_layout_order", ["distillery", "player", "filters"]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggableSection, setDraggableSection] = useState(null);
  
  const handleLayoutDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleLayoutDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...layoutOrder];
    const item = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, item);
    setLayoutOrder(updated);
    setDraggedIndex(index);
  };

  const handleLayoutDragEnd = () => {
    setDraggedIndex(null);
    setDraggableSection(null);
  };

  const handleMoveSection = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= layoutOrder.length) return;
    const updated = [...layoutOrder];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setLayoutOrder(updated);
  };

  const renderLayoutGrip = (sectionId) => {
    const index = layoutOrder.indexOf(sectionId);
    if (index === -1) return null;
    return (
      <div 
        className="layout-grip-controls" 
        style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => handleMoveSection(index, -1)}
          disabled={index === 0}
          className="btn-layout-arrow"
          style={{ background: "transparent", border: "none", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 0.7, padding: "2px 4px", color: "var(--text-primary)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
          title="Move section up"
        >
          ▲
        </button>
        <span 
          style={{ cursor: "grab", opacity: 0.7, display: "inline-flex", alignItems: "center" }}
          title="Drag and hold to rearrange"
          onMouseEnter={() => setDraggableSection(sectionId)}
          onMouseLeave={() => setDraggableSection(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="icon-svg">
            <line x1="4" y1="9"  x2="20" y2="9"/>
            <line x1="4" y1="15" x2="20" y2="15"/>
          </svg>
        </span>
        <button
          onClick={() => handleMoveSection(index, 1)}
          disabled={index === layoutOrder.length - 1}
          className="btn-layout-arrow"
          style={{ background: "transparent", border: "none", cursor: index === layoutOrder.length - 1 ? "not-allowed" : "pointer", opacity: index === layoutOrder.length - 1 ? 0.3 : 0.7, padding: "2px 4px", color: "var(--text-primary)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
          title="Move section down"
        >
          ▼
        </button>
      </div>
    );
  };

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Clean URL Params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hasParams = params.get("text") || params.get("title") || params.get("url") || params.get("action");
      if (hasParams) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Custom Hooks
  const speech = useSpeech();
  
  const handleTemplateChange = useCallback((tpl) => {
    if (rule === "distill" && clipboardText) {
      const clean = distillContent(clipboardText, { customBlockedPhrases: tpl ? tpl.blockedPhrases : [] });
      setProcessedText(clean);
      setDistillerStats(getDistillerStats(clipboardText, clean));
    }
  }, [rule, clipboardText]);

  const templateState = useTemplates(handleTemplateChange);

  // Core Actions
  const handleDistill = useCallback((overrideText = null, overrideTemplate = null) => {
    const textToDistill = overrideText !== null ? overrideText : clipboardText;
    if (!textToDistill) return;
    speech.stopSpeech();

    const tpl = overrideTemplate !== null ? overrideTemplate : templateState.activeTemplate;
    const blockedPhrases = tpl ? tpl.blockedPhrases : [];

    const clean = distillContent(textToDistill, { customBlockedPhrases: blockedPhrases });
    const stats = getDistillerStats(textToDistill, clean);
    
    setProcessedText(clean);
    setDistillerStats(stats);
    setRule("distill");

    const newHistoryItem = {
      id: generateHistoryId(),
      originalText: textToDistill,
      processedText: clean,
      rule: "distill",
      timestamp: new Date().toLocaleString(),
    };
    setHistory(prev => [newHistoryItem, ...(prev || []).slice(0, 9)]);
  }, [clipboardText, templateState.activeTemplate, speech, setHistory]);

  const handleProcess = useCallback(async () => {
    if (!clipboardText) return;
    setIsProcessing(true);
    speech.stopSpeech();

    try {
      const resultText = await processWithGemini(clipboardText, rule);
      setProcessedText(resultText);
      
      const newHistoryItem = {
        id: generateHistoryId(),
        originalText: clipboardText,
        processedText: resultText,
        rule: rule,
        timestamp: new Date().toLocaleString(),
      };
      setHistory(prev => [newHistoryItem, ...(prev || []).slice(0, 9)]);
    } catch (error) {
      setProcessedText(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [clipboardText, rule, speech, setHistory]);

  const handleTextPaste = useCallback((text) => {
    setClipboardText(text);
    speech.stopSpeech();
    if (rule === "distill") {
      const clean = distillContent(text, { customBlockedPhrases: templateState.activeTemplate ? templateState.activeTemplate.blockedPhrases : [] });
      setProcessedText(clean);
      setDistillerStats(getDistillerStats(text, clean));
    } else {
      setProcessedText("");
      setDistillerStats("");
    }
  }, [rule, templateState.activeTemplate, speech]);

  const handlePaste = async () => {
    try {
      if (window.confirm("Do you want to paste the text from your clipboard?")) {
        const text = await navigator.clipboard.readText();
        handleTextPaste(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("Please allow clipboard permissions or manually paste the text.");
    }
  };

  const handleClear = () => {
    setClipboardText("");
    setProcessedText("");
    setDistillerStats("");
    speech.stopSpeech();
  };

  const handleShareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Vocalize.it",
          text: "Check out this app to quickly clean up newsletters and text for reading!",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("App link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing app:", err);
    }
  };

  const handleCopyResult = () => {
    if (!processedText) return;
    navigator.clipboard.writeText(processedText)
      .then(() => alert("Result copied to clipboard!"))
      .catch((err) => console.error("Failed to copy text:", err));
  };

  const getRuleLabel = (r) => {
    switch (r) {
      case "summarize": return "Summary";
      case "categorize": return "Categories";
      case "correct": return "Grammar Corrected";
      case "bulletpoints": return "Key Points";
      case "explain": return "Explanation";
      case "translate_es": return "Spanish (ES)";
      case "translate_th": return "Thai (TH)";
      case "distill": return "Clean-It-Up";
      default: return "Processed";
    }
  };

  return (
    <div className="app-container">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <InstallBanner 
        showInstallBanner={showInstallBanner} 
        triggerInstallPrompt={triggerInstallPrompt} 
        dismissInstallBanner={dismissInstallBanner} 
      />

      <div className="glass-card">
        <Header 
          theme={theme} 
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} 
          handleShareApp={handleShareApp} 
        />

        <InputArea 
          clipboardText={clipboardText}
          setClipboardText={setClipboardText}
          handlePaste={handlePaste}
          handleTextPaste={handleTextPaste}
        />

        {clipboardText && (
          <ActionControls 
            rule={rule}
            setRule={setRule}
            handleDistill={handleDistill}
            handleProcess={handleProcess}
            handleClear={handleClear}
            isProcessing={isProcessing}
            templates={templateState.templates}
            selectedTemplateId={templateState.selectedTemplateId}
            handleSelectTemplate={templateState.handleSelectTemplate}
            categoryOrder={categoryOrder}
            setCategoryOrder={setCategoryOrder}
          />
        )}

        {layoutOrder.map((sectionId, index) => {
          if (sectionId === "distillery") {
            return (
              <ResultCard 
                key="distillery"
                rule={rule}
                clipboardText={clipboardText}
                processedText={processedText}
                distillerStats={distillerStats}
                activeTemplate={templateState.activeTemplate}
                handleRemoveBlockedPhrase={templateState.handleRemoveBlockedPhrase}
                handleAddBlockedPhrase={templateState.handleAddBlockedPhrase}
                renderLayoutGrip={renderLayoutGrip}
                isDragged={draggedIndex === index}
                onDragStart={(e) => handleLayoutDragStart(e, index)}
                onDragOver={(e) => handleLayoutDragOver(e, index)}
                onDragEnd={handleLayoutDragEnd}
                getRuleLabel={getRuleLabel}
              />
            );
          }
          if (sectionId === "player") {
            return (
              <TTSPlayer 
                key="player"
                clipboardText={clipboardText}
                processedText={processedText}
                voices={speech.voices}
                selectedVoice={speech.selectedVoice}
                rate={speech.rate}
                isPlaying={speech.isPlaying}
                isPaused={speech.isPaused}
                handleSpeakToggle={speech.handleSpeakToggle}
                stopSpeech={speech.stopSpeech}
                handleVoiceChange={speech.handleVoiceChange}
                handleRateChange={speech.handleRateChange}
                renderLayoutGrip={renderLayoutGrip}
                isDragged={draggedIndex === index}
                onDragStart={(e) => handleLayoutDragStart(e, index)}
                onDragOver={(e) => handleLayoutDragOver(e, index)}
                onDragEnd={handleLayoutDragEnd}
                handleCopyResult={handleCopyResult}
              />
            );
          }
          if (sectionId === "filters") {
            return (
              <TemplateManager 
                key="filters"
                templates={templateState.templates}
                handleCreateTemplate={templateState.handleCreateTemplate}
                handleDeleteTemplate={templateState.handleDeleteTemplate}
                handleToggleLockTemplate={templateState.handleToggleLockTemplate}
                handleRenameTemplate={templateState.handleRenameTemplate}
                handleAddBlockedPhrase={templateState.handleAddBlockedPhrase}
                handleRemoveBlockedPhrase={templateState.handleRemoveBlockedPhrase}
                renderLayoutGrip={renderLayoutGrip}
                isDragged={draggedIndex === index}
                onDragStart={(e) => handleLayoutDragStart(e, index)}
                onDragOver={(e) => handleLayoutDragOver(e, index)}
                onDragEnd={handleLayoutDragEnd}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default App;
