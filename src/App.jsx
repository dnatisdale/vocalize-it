import { useState, useRef, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase/firebase";
import { useRegisterSW } from "virtual:pwa-register/react";
import { distillContent, getDistillerStats } from "./utils/contentDistiller";

// Helper to generate unique ID for history items (external to keep component pure for ESLint)
function generateHistoryId() {
  return Date.now().toString();
}

// Outline SVG Icon Components
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

// Two-line grip handle (═) for drag-to-reorder
const GripIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="icon-svg">
    <line x1="4" y1="9"  x2="20" y2="9"/>
    <line x1="4" y1="15" x2="20" y2="15"/>
  </svg>
);

// Default ordered list of processing categories (alphabetical by label)
const DEFAULT_CATEGORIES = [
  {
    value: "categorize",
    label: "Categorize Text",
    description: "Reads the content and assigns 3–5 descriptive topic tags or categories.",
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

function App() {
  // Initialize state directly from URL query parameters (PWA Share Target & Shortcuts)
  const [clipboardText, setClipboardText] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("text") || params.get("title") || params.get("url") || "";
    }
    return "";
  });
  const [processedText, setProcessedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rule, setRule] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sharedAction = params.get("action");
      const validRules = ["summarize", "correct", "bulletpoints", "explain", "categorize", "translate_es", "translate_th", "distill"];
      // URL share-target action takes top priority
      if (sharedAction && validRules.includes(sharedAction)) return sharedAction;
      // Otherwise restore the user's last-chosen category
      const saved = localStorage.getItem("vocalize_default_rule");
      if (saved && validRules.includes(saved)) return saved;
    }
    // Hard default — first category alphabetically
    return "categorize";
  });

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  // Content Distiller: tracks the stats message from last distillation
  const [distillerStats, setDistillerStats] = useState("");

  // Category order — persisted to localStorage so users can reorder once and forget
  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("vocalize_cat_order");
      if (saved) {
        const savedValues = JSON.parse(saved);
        // Merge: keep saved order but add any new categories not yet in localStorage
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

  // Dropdown open/close state & drag tracking
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const dragIndexRef = useRef(null);
  const catDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Persist category order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "vocalize_cat_order",
      JSON.stringify(categoryOrder.map((c) => c.value))
    );
  }, [categoryOrder]);

  // Persist chosen category as default \u2014 restored on next page load
  useEffect(() => {
    localStorage.setItem("vocalize_default_rule", rule);
  }, [rule]);

  // ── Drag-and-drop handlers for reordering categories ─────────────────────
  const handleDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); // required to allow drop
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

  // Select a category from the custom dropdown
  const handleCategorySelect = (cat) => {
    if (cat.value === "distill") {
      setRule("distill");
      handleDistill();
    } else {
      setRule(cat.value);
    }
    setCatDropdownOpen(false);
  };

  // Enhanced Speech Settings
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1);

  // Initialize history directly from localStorage
  const [history, setHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("vocalize_history");
      if (savedHistory) {
        try {
          return JSON.parse(savedHistory);
        } catch (err) {
          console.error("Failed to parse history:", err);
        }
      }
    }
    return [];
  });

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vocalize_theme") || "dark";
  });

  // Custom Install Promotion States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Vite PWA: Service Worker registration & reload trigger
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registered successfully:", r);
    },
    onRegisterError(error) {
      console.error("Service Worker registration failed:", error);
    },
  });

  // Apply Theme on mount & change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vocalize_theme", theme);
  }, [theme]);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Auto-select first English voice if available, otherwise first available
        if (availableVoices.length > 0) {
          const defaultVoice =
            availableVoices.find((v) => v.lang.startsWith("en-")) ||
            availableVoices.find((v) => v.lang.startsWith("en")) ||
            availableVoices[0];
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Handle PWA Install Promotion setup
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Clean up URL query parameters on mount if they were parsed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hasParams = params.get("text") || params.get("title") || params.get("url") || params.get("action");
      if (hasParams) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Install PWA triggered by custom button
  const triggerInstallPrompt = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Installation choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Toggle App Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Clipboard Paste Logic
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      setProcessedText("");
      setDistillerStats("");
      stopSpeech();
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      alert("Please allow clipboard permissions in your browser, or manually paste the text into the textbox.");
    }
  };

  // Content Distiller — runs entirely client-side, no backend call needed
  const handleDistill = () => {
    if (!clipboardText) return;
    stopSpeech();
    const clean = distillContent(clipboardText);
    const stats = getDistillerStats(clipboardText, clean);
    setProcessedText(clean);
    setDistillerStats(stats);
    setRule("distill");

    // Save to history just like an AI result
    const newHistoryItem = {
      id: generateHistoryId(),
      originalText: clipboardText,
      processedText: clean,
      rule: "distill",
      timestamp: new Date().toLocaleString(),
    };
    const updatedHistory = [newHistoryItem, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    localStorage.setItem("vocalize_history", JSON.stringify(updatedHistory));
  };

  // Backend Firebase AI Function Call
  const handleProcess = async () => {
    if (!clipboardText) return;
    setIsProcessing(true);
    stopSpeech();

    try {
      const functions = getFunctions(app);
      const processClip = httpsCallable(functions, "processClip");
      const response = await processClip({ text: clipboardText, rule: rule });
      
      const resultText = response.data.result;
      setProcessedText(resultText);
      
      // Save item to history
      const newHistoryItem = {
        id: generateHistoryId(),
        originalText: clipboardText,
        processedText: resultText,
        rule: rule,
        timestamp: new Date().toLocaleString(),
      };
      
      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      localStorage.setItem("vocalize_history", JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error calling backend:", error);
      setProcessedText(
        "An error occurred while processing. Please ensure your backend is running and you are online."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Play / Pause Speech synthesis
  const handleSpeakToggle = () => {
    if (!processedText) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start completely new speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(processedText);

    // Apply voice if selected
    if (selectedVoice) {
      const voiceObj = voices.find((v) => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    // Apply speech rate
    utterance.rate = rate;

    // Track utterance to prevent garbage collection in Chrome
    utteranceRef.current = utterance;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  // Stop Speech synthesis completely
  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Copy result to clipboard
  const handleCopyResult = () => {
    if (!processedText) return;
    navigator.clipboard.writeText(processedText)
      .then(() => alert("Result copied to clipboard!"))
      .catch((err) => console.error("Failed to copy text:", err));
  };

  // Load a item from history back into active view
  const handleLoadHistoryItem = (item) => {
    setClipboardText(item.originalText);
    setProcessedText(item.processedText);
    setRule(item.rule);
    stopSpeech();
  };

  // Delete item from history
  const handleDeleteHistoryItem = (e, id) => {
    e.stopPropagation(); // prevent loading item
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("vocalize_history", JSON.stringify(updatedHistory));
  };

  // Clear entire history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your clipboard history?")) {
      setHistory([]);
      localStorage.removeItem("vocalize_history");
    }
  };

  // Helpers to get user-friendly name for rule
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
      {/* Background decorations */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Install Promotion Banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-banner-text">
            <h4>Install Vocalize.it</h4>
            <p>Add to your home screen for quick, offline-capable clipboard processing.</p>
          </div>
          <div className="install-banner-actions">
            <button className="btn-white" onClick={triggerInstallPrompt}>
              Install
            </button>
            <button className="btn-secondary" style={{ padding: "8px 12px", border: "none" }} onClick={() => setShowInstallBanner(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Glass card container */}
      <div className="glass-card">
        {/* Header */}
        <header className="app-header">
          <div className="app-title-group">
            <h1 className="app-title">Vocalize.it</h1>
            <p className="app-subtitle">Smart AI Clipboard Processor & TTS Hub</p>
          </div>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Toggle theme"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* Hero paste button (if no clipboard text) */}
        {!clipboardText && (
          <button onClick={handlePaste} className="paste-hero-btn">
            <ClipboardIcon /> Paste from Device Clipboard
            <span>Click here to grab contents from your system clipboard</span>
          </button>
        )}

        {/* Input Text Area Section */}
        {clipboardText && (
          <div className="form-group" style={{ animation: "fadeIn 0.3s" }}>
            <label className="form-label">Active Clip Text</label>
            <div className="textarea-container">
              <textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                className="modern-textarea"
                placeholder="Enter or paste text to process..."
              />
              <span className="char-counter">{clipboardText.length} chars</span>
            </div>

            <div className="controls-row">
              {/* Custom reorderable category dropdown */}
              <div className="select-wrapper cat-dropdown-wrapper" ref={catDropdownRef} style={{ position: "relative" }}>
                {/* Trigger button — shows current selection */}
                <button
                  className="modern-select cat-dropdown-trigger"
                  onClick={() => setCatDropdownOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={catDropdownOpen}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%", cursor: "pointer" }}
                >
                  <span>{categoryOrder.find((c) => c.value === rule)?.label ?? "Summarize"}</span>
                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "transform 0.2s", transform: catDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Dropdown panel */}
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
                      /* Solid background — prevents history panel bleeding through */
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
                          /* Active row: primary color. Inactive: solid input bg so nothing bleeds through */
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
                        {/* ═ Drag handle — grab here to reorder */}
                        <span
                          title="Drag to reorder"
                          style={{ cursor: "grab", opacity: 0.45, flexShrink: 0, lineHeight: 0 }}
                          onMouseDown={(e) => e.stopPropagation()} // prevent trigger button click
                        >
                          <GripIcon />
                        </span>
                        {/* Label + hover tooltip — click to select */}
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

              <button onClick={() => { setClipboardText(""); setProcessedText(""); setDistillerStats(""); stopSpeech(); }} className="btn btn-secondary">
                <ClearIcon /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Output Panel Section */}
        {processedText && (
          <div className="result-card">
            <div className="result-header">
              <span>{rule === "distill" ? "Distilled Content" : "AI Output Result"}</span>
              <span className="result-badge">{getRuleLabel(rule)}</span>
            </div>
            {/* Show distiller reduction stats when Clean-It-Up was used */}
            {rule === "distill" && distillerStats && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px", fontStyle: "italic" }}>
                {distillerStats}
              </p>
            )}
            
            <p className="result-content">{processedText}</p>

            {/* TTS Settings & Controls */}
            <div className="tts-controls-panel">
              <div className="slider-label" style={{ fontWeight: 700, color: "var(--text-primary)", display: "flex", gap: "8px", alignItems: "center" }}>
                <SpeakerIcon /> <span>Text-to-Speech Player</span>
              </div>
              <div className="tts-controls-grid">
                {/* Voice Selection */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="slider-label" style={{ fontSize: "0.8rem" }}>Select Voice</label>
                  <div className="select-wrapper" style={{ minWidth: "100%" }}>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="modern-select"
                      style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                    >
                      {voices.length === 0 ? (
                        <option>Default Voice</option>
                      ) : (
                        voices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Speed adjustment slider */}
                <div className="speed-slider-group">
                  <div className="slider-label">
                    <span>Speed / Rate</span>
                    <span>{rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="modern-slider"
                  />
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={handleSpeakToggle} className="btn btn-accent" style={{ flex: 1, minWidth: "140px" }}>
                {isPlaying ? (isPaused ? <PlayIcon /> : <PauseIcon />) : <PlayIcon />}
                <span>{isPlaying ? (isPaused ? " Resume Audio" : " Pause Audio") : " Play Audio"}</span>
              </button>
              {isPlaying && (
                <button onClick={stopSpeech} className="btn btn-secondary">
                  <StopIcon /> Stop
                </button>
              )}
              <button onClick={handleCopyResult} className="btn btn-secondary" style={{ flex: 1, minWidth: "120px" }}>
                <CopyIcon /> Copy Result
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        <section className="history-section">
          <div className="history-title">
            <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <ClipboardIcon /> Clipboard History
            </span>
            {history.length > 0 && (
              <button onClick={handleClearHistory} className="btn-danger-outline" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <TrashIcon /> Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              No clips processed yet. Items you process will appear here for quick access.
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadHistoryItem(item)}
                  className="history-item"
                  title="Click to load this result"
                >
                  <div className="history-item-content">
                    <div className="history-item-meta">
                      <span className="history-item-rule">{getRuleLabel(item.rule)}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <div className="history-item-text">
                      {item.originalText}
                    </div>
                  </div>
                  <div className="history-item-actions">
                    <button
                      className="btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "0.8rem", border: "none", display: "inline-flex", alignItems: "center" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.processedText);
                        alert("Result copied!");
                      }}
                      title="Copy result"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "0.8rem", border: "none", display: "inline-flex", alignItems: "center" }}
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      title="Delete from history"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* SW Update Reload Prompt Toast */}
      {needRefresh && (
        <div className="sw-toast">
          <button
            className="sw-toast-close-btn"
            onClick={() => setNeedRefresh(false)}
            aria-label="Close update notification"
            title="Dismiss update"
          >
            <ClearIcon />
          </button>
          <div className="sw-toast-message" style={{ paddingRight: "24px" }}>
            A new version of Vocalize.it is available! Refresh to update.
          </div>
          <div className="sw-toast-actions">
            <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: "0.85rem" }} onClick={() => updateServiceWorker(true)}>
              Update
            </button>
            <button className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }} onClick={() => setNeedRefresh(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
