import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { InstallBanner } from "./components/layout/InstallBanner";
import { UpdateBanner } from "./components/layout/UpdateBanner";
import { InputArea } from "./components/distillery/InputArea";
import { ActionControls, AdvancedTools, DEFAULT_CATEGORIES } from "./components/distillery/ActionControls";
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
import { analyzeLayout } from "./utils/layoutAnalyzer";
import { analyzeStructuredData } from "./utils/structuredDataDetector";
import { DatasetControls } from "./components/distillery/DatasetControls";

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
  const [manualPasteMode, setManualPasteMode] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(null);
  
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

    const layoutFixed = analyzeLayout(textToDistill);
    const clean = distillContent(layoutFixed, { customBlockedPhrases: blockedPhrases, blocklist });
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

  const handleProcess = useCallback(async (ruleOverride = null) => {
    if (!clipboardText) return;

    // Use the explicitly passed rule override (from button click) or fall back
    // to the current rule state. This eliminates the race condition where
    // setRule() is async and the closure captures the old value.
    const effectiveRule = ruleOverride !== null ? ruleOverride : rule;

    // Pre-flight: catch obvious offline state before attempting the network call
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setProcessedText("You appear to be offline. Please check your connection and try again.");
      return;
    }

    setIsProcessing(true);
    setProcessedText("");
    speech.stopSpeech();
    setProcessingModeFeedback("");

    console.log(`[App] handleProcess — effectiveRule="${effectiveRule}", stateRule="${rule}", textLength=${clipboardText.length}, online=${navigator.onLine}`);

    try {
      const layoutFixed = analyzeLayout(clipboardText);

      // Phase O5: Hybrid Processing Decision Tree
      const offlineResult = advancedOfflineDistill(layoutFixed, { blocklist });
      const { type, confidence } = offlineResult.classification;
      const offlineEligibleTypes = ["email", "newsletter", "prayer request", "devotional"];
      
      let resultText = "";

      if (confidence > 0.80 && offlineEligibleTypes.includes(type)) {
        // Process offline instantly
        resultText = offlineResult.cleanedText;
        setProcessingModeFeedback("Processed Offline ⚡");
        console.log(`[App] Offline path taken — type="${type}", confidence=${confidence}`);
      } else {
        // Two-pass pipeline: Auto pre-clean before sending to AI
        const preClean = distillContent(layoutFixed, { blocklist });
        console.log(`[App] AI path — sending ${preClean.length} chars with rule="${effectiveRule}"`);
        resultText = await processWithGemini(preClean, effectiveRule);
        setProcessingModeFeedback("Enhanced with AI ✨");
      }
      
      setProcessedText(resultText);
      // Autoplay removed for Issue 1 (Playback must require explicit user action)
      
      const newHistoryItem = {
        id: generateHistoryId(),
        originalText: clipboardText,
        processedText: resultText,
        rule: effectiveRule,
        timestamp: new Date().toLocaleString(),
      };
      setHistory(prev => [newHistoryItem, ...(prev || []).slice(0, 9)]);
    } catch (error) {
      // Display the real diagnostic error message from aiService (not a generic string)
      console.error("[App] handleProcess error:", error);
      setProcessedText(`⚠️ ${error.message || "An unexpected error occurred."}`);
    } finally {
      setIsProcessing(false);
    }
  }, [clipboardText, rule, speech, setHistory, blocklist]);

  const handleTextPaste = useCallback((text) => {
    setClipboardText(text);
    speech.stopSpeech();
    
    const analysis = analyzeStructuredData(text);
    if (analysis.documentType === 'structured-data' || analysis.documentType === 'Bible-dataset') {
      setDatasetInfo(analysis);
      setProcessedText("");
      setDistillerStats("");
      return; // Do not auto-distill datasets
    } else {
      setDatasetInfo(null);
    }

    if (rule === "distill") {
      const layoutFixed = analyzeLayout(text);
      const clean = distillContent(layoutFixed, { customBlockedPhrases: templateState.activeTemplate ? templateState.activeTemplate.blockedPhrases : [], blocklist });
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
      const text = await navigator.clipboard.readText();
      handleTextPaste(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      setManualPasteMode(true);
    }
  };

  const handleClear = () => {
    setClipboardText("");
    setProcessedText("");
    setDistillerStats("");
    setDatasetInfo(null);
    setManualPasteMode(false);
    speech.stopSpeech();
  };

  const handleShareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Listen Better",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.2rem", cursor: "pointer", padding: "4px 8px" }}
                title="Close Settings"
              >
                ▲
              </button>
            </div>
            
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
              manualPasteMode={manualPasteMode}
            />

            {/* Decorative Wavy Line Divider */}
            <div className="section-divider">
              <svg 
                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100vw", height: "150px", zIndex: 0, opacity: 0.15, pointerEvents: "none", color: "var(--text-secondary)" }}
                viewBox="0 300 1440 450" 
                preserveAspectRatio="none"
              >
                <path 
                  d="M0,500 C480,720 960,320 1440,600" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {clipboardText && (
              datasetInfo ? (
                <DatasetControls 
                  datasetInfo={datasetInfo}
                  onCancel={handleClear}
                  onSummarize={() => {
                    setDatasetInfo(null);
                    setProcessedText(`Dataset Summary:\nThis is a ${datasetInfo.documentType} with ${datasetInfo.rowCount} rows and ${datasetInfo.columnCount} columns.\n\n(Feature coming soon!)`);
                  }}
                  onReadColumns={(cols, limit) => {
                    setDatasetInfo(null);
                    setProcessedText(`Reading Columns: ${cols.join(', ')} (Max ${limit} rows)\n\n(Feature coming soon!)`);
                  }}
                  onNarrative={() => {
                    setDatasetInfo(null);
                    setProcessedText(`Converting ${datasetInfo.rowCount} rows to narrative flow...\n\n(Feature coming soon!)`);
                  }}
                  onExtract={() => {
                    setDatasetInfo(null);
                    setProcessedText(`Extracting key insights from ${datasetInfo.rowCount} rows...\n\n(Feature coming soon!)`);
                  }}
                />
              ) : (
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
              )
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
                downloadMP3={speech.downloadMP3}
                isDownloading={speech.isDownloading}
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
                  rate={speech.rate}
                  voices={speech.voices}
                  selectedVoice={speech.selectedVoice}
                  handleRateChange={speech.handleRateChange}
                  handleVoiceChange={speech.handleVoiceChange}
                />
              </div>
            )}

            {clipboardText && (
              <AdvancedTools 
                rule={rule}
                setRule={setRule}
                handleDistill={handleDistill}
                handleProcess={handleProcess}
                isProcessing={isProcessing}
              />
            )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "24px", paddingBottom: "24px", color: "var(--text-secondary)", fontSize: "0.85rem", opacity: 0.8 }}>
        <p style={{ marginBottom: "12px", maxWidth: "400px", margin: "0 auto 12px auto", lineHeight: "1.4" }}>
          Turn any digital text into audio you can actually understand. Just copy, paste, and listen.
        </p>
          {typeof window !== "undefined" && (
            <div style={{ marginBottom: "16px" }}>
              <a 
                href="https://vocalize-it-c0eda.web.app" 
                style={{ color: "inherit", textDecoration: "none" }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
                target="_blank"
                rel="noopener noreferrer"
              >
                https://vocalize-it-c0eda.web.app
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
