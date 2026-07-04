import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { InstallBanner } from "./components/layout/InstallBanner";
import { UpdateBanner } from "./components/layout/UpdateBanner";
import { InputArea } from "./components/distillery/InputArea";
import { ActionControls, DEFAULT_CATEGORIES } from "./components/distillery/ActionControls";
import { ResultCard } from "./components/distillery/ResultCard";
import { TTSPlayer } from "./components/player/TTSPlayer";
import { TemplateManager } from "./components/templates/TemplateManager";

import { useSpeech } from "./hooks/useSpeech";
import { useTemplates } from "./hooks/useTemplates";
import { usePWA } from "./hooks/usePWA";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AmbientBackground } from "./components/layout/AmbientBackground";

import { distillContent, getDistillerStats, advancedOfflineDistill } from "./utils/contentDistiller";
import { processWithGemini } from "./services/aiService";

import "./App.css";

function generateHistoryId() {
  return Date.now().toString();
}

function App() {
  // PWA & Storage Hooks
  const { showInstallBanner, triggerInstallPrompt, dismissInstallBanner, needRefresh, updateServiceWorker } = usePWA();
  const [theme, setTheme] = useLocalStorage("vocalize_theme", "dark");
  // eslint-disable-next-line no-unused-vars
  const [history, setHistory] = useLocalStorage("vocalize_history", []);
  const [blocklist, setBlocklist] = useLocalStorage("vocalize_blocklist", []);
  const [isBlocklistOpen, setIsBlocklistOpen] = useState(false);

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
  const [processingModeFeedback, setProcessingModeFeedback] = useState("");
  
  const [rule, setRule] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sharedAction = params.get("action");
      const validRules = ["summarize", "correct", "bulletpoints", "explain", "categorize", "translate_es", "translate_th", "distill", "listenmode"];
      if (sharedAction && validRules.includes(sharedAction)) return sharedAction;
      const saved = localStorage.getItem("vocalize_default_rule");
      if (saved && validRules.includes(saved)) return saved;
    }
    return "listenmode";
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    const clean = distillContent(textToDistill, { customBlockedPhrases: blockedPhrases, blocklist });
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
  }, [clipboardText, templateState.activeTemplate, speech, setHistory, blocklist]);

  const handleProcess = useCallback(async () => {
    if (!clipboardText) return;
    setIsProcessing(true);
    speech.stopSpeech();
    setProcessingModeFeedback("");

    try {
      // Phase O5: Hybrid Processing Decision Tree
      const offlineResult = advancedOfflineDistill(clipboardText, { blocklist });
      const { type, confidence } = offlineResult.classification;
      const offlineEligibleTypes = ["email", "newsletter", "prayer request", "devotional"];
      
      let resultText = "";

      if (confidence > 0.80 && offlineEligibleTypes.includes(type)) {
        // Process offline instantly
        resultText = offlineResult.cleanedText;
        setProcessingModeFeedback("Processed Offline ⚡");
      } else {
        // Two-pass pipeline: Auto pre-clean before sending to AI
        const preClean = distillContent(clipboardText, { blocklist });
        resultText = await processWithGemini(preClean, rule);
        setProcessingModeFeedback("Enhanced with AI ✨");
      }
      
      setProcessedText(resultText);

      // Autoplay removed for Issue 1 (Playback must require explicit user action)
      
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
  }, [clipboardText, rule, speech, setHistory, blocklist]);

  const handleTextPaste = useCallback((text) => {
    setClipboardText(text);
    speech.stopSpeech();
    if (rule === "distill") {
      const clean = distillContent(text, { customBlockedPhrases: templateState.activeTemplate ? templateState.activeTemplate.blockedPhrases : [], blocklist });
      setProcessedText(clean);
      setDistillerStats(getDistillerStats(text, clean));
    } else {
      setProcessedText("");
      setDistillerStats("");
    }
  }, [rule, templateState.activeTemplate, speech, blocklist]);

  const handleAddToBlocklist = useCallback((line) => {
    const norm = line.trim();
    if (norm && !blocklist.includes(norm)) {
      setBlocklist(prev => [...prev, norm]);
    }
  }, [blocklist, setBlocklist]);

  const handleRemoveFromBlocklist = useCallback((line) => {
    setBlocklist(prev => prev.filter(b => b !== line));
  }, [setBlocklist]);

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
      case "listenmode": return "Listen Mode";
      default: return "Processed";
    }
  };

  return (
    <div className="app-container">
      <AmbientBackground theme={theme} />

      <UpdateBanner needRefresh={needRefresh} updateServiceWorker={updateServiceWorker} />
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
          toggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        />

        {isSettingsOpen && (
          <div className="settings-panel collapsible-drawer" style={{ animation: "slideDown 0.3s ease-out", overflow: "hidden" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>Settings</h2>
            
            <div className="settings-section" style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Audio playback controls (speed and voice selection) are now always accessible directly in the player.
              </p>
            </div>

            <TemplateManager 
              templates={templateState.templates}
              handleCreateTemplate={templateState.handleCreateTemplate}
              handleDeleteTemplate={templateState.handleDeleteTemplate}
              handleToggleLockTemplate={templateState.handleToggleLockTemplate}
              handleRenameTemplate={templateState.handleRenameTemplate}
              handleAddBlockedPhrase={templateState.handleAddBlockedPhrase}
              handleRemoveBlockedPhrase={templateState.handleRemoveBlockedPhrase}
              renderLayoutGrip={() => null}
              isDragged={false}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDragEnd={() => {}}
            />

            <div className="settings-section" style={{ marginTop: "24px", background: "var(--bg-card)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <div 
                onClick={() => setIsBlocklistOpen(!isBlocklistOpen)}
                style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", fontWeight: "bold" }}
              >
                <span>Global Ignored Phrases ({blocklist.length})</span>
                <span>{isBlocklistOpen ? "▲" : "▼"}</span>
              </div>
              {isBlocklistOpen && (
                <div style={{ marginTop: "12px" }}>
                  {blocklist.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No phrases ignored globally. Click <b>× Ignore</b> on any result paragraph to ignore it in the future.</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {blocklist.map((item, i) => (
                        <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.9rem" }}>
                          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item}</span>
                          <button onClick={() => handleRemoveFromBlocklist(item)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--error-color)" }}>✖</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="main-content" style={{ marginTop: isSettingsOpen ? "24px" : "0", transition: "margin-top 0.3s ease" }}>
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

            {processedText && (
              <TTSPlayer 
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
                renderLayoutGrip={() => null}
                isDragged={false}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDragEnd={() => {}}
                handleCopyResult={handleCopyResult}
              />
            )}

            {processedText && (
              <div style={{ marginTop: "24px" }}>
                <ResultCard 
                  rule={rule}
                  clipboardText={clipboardText}
                  processedText={processedText}
                  distillerStats={distillerStats}
                  processingModeFeedback={processingModeFeedback}
                  activeTemplate={templateState.activeTemplate}
                  handleRemoveBlockedPhrase={templateState.handleRemoveBlockedPhrase}
                  handleAddBlockedPhrase={templateState.handleAddBlockedPhrase}
                  renderLayoutGrip={() => null}
                  isDragged={false}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnd={() => {}}
                  getRuleLabel={getRuleLabel}
                  handleAddToBlocklist={handleAddToBlocklist}
                />
              </div>
            )}
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "24px", paddingBottom: "24px", color: "var(--text-secondary)", fontSize: "0.85rem", opacity: 0.8 }}>
        <p style={{ marginBottom: "12px", maxWidth: "400px", margin: "0 auto 12px auto", lineHeight: "1.4" }}>
          Turn emails, newsletters, PDFs, articles, devotionals, reports, and documents into audio you can actually understand.
        </p>
        {typeof window !== "undefined" && (
          <div style={{ marginBottom: "16px" }}>
            <a 
              href={window.location.href} 
              style={{ color: "inherit", textDecoration: "none" }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              {window.location.href}
            </a>
          </div>
        )}
        
        {typeof __APP_VERSION__ !== "undefined" && typeof __APP_UPDATED__ !== "undefined" && (
          <div style={{ fontSize: "0.75rem", opacity: 0.6, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span>Version {__APP_VERSION__}</span>
            <span>Updated {__APP_UPDATED__}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
