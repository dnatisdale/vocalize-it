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



const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg" style={{ marginRight: "4px" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const UnlockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg" style={{ marginRight: "4px" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg" style={{ marginRight: "4px" }}>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
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

  // Templates state (Max 10)
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("vocalize_newsletter_templates");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all templates have isLocked defined (migration for older saved data)
        return parsed.map(t => ({ isLocked: false, ...t }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vocalize_selected_template_id") || "none";
    }
    return "none";
  });
  const [showScrollTop, setShowScrollTop] = useState(false); // Scroll-to-top floating button visibility
  
  // Layout reordering states for major panels
  const [layoutOrder, setLayoutOrder] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vocalize_layout_order");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 3) return parsed;
        } catch (err) {
          console.warn("Failed to parse layout order:", err);
        }
      }
    }
    return ["distillery", "player", "filters"];
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggableSection, setDraggableSection] = useState(null);
  // Per-template controlled input values for the "add phrase" fields
  const [addPhraseInputs, setAddPhraseInputs] = useState({});
  // Whether the collapsed plain distilled text is visible
  const [showDistilledText, setShowDistilledText] = useState(false);

  // Scroll listener to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Drag and drop sorting handlers for major cards/sections
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
    localStorage.setItem("vocalize_layout_order", JSON.stringify(layoutOrder));
  };

  const handleMoveSection = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= layoutOrder.length) return;
    const updated = [...layoutOrder];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setLayoutOrder(updated);
    localStorage.setItem("vocalize_layout_order", JSON.stringify(updated));
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
          <GripIcon />
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

  // Save templates to localStorage
  useEffect(() => {
    localStorage.setItem("vocalize_newsletter_templates", JSON.stringify(templates));
  }, [templates]);

  // Save selected template selection to localStorage
  useEffect(() => {
    localStorage.setItem("vocalize_selected_template_id", selectedTemplateId);
  }, [selectedTemplateId]);

  // Determine which template is actually active synchronously
  const activeTemplate = (() => {
    if (selectedTemplateId === "none") return null;
    return templates.find(t => t.id === selectedTemplateId) || null;
  })();

  // Template CRUD actions
  const handleCreateTemplate = (name) => {
    const newId = "tpl_" + Date.now().toString();
    const newTpl = {
      id: newId,
      name: name.trim() || "Unnamed Template",
      blockedPhrases: [],
      isLocked: false
    };
    setTemplates(prev => [...prev, newTpl]);
    
    // Automatically select the newly created template
    setSelectedTemplateId(newId);

    // If we have active text, immediately switch to Clean-It-Up mode, open the tuner, and scroll to it
    if (clipboardText) {
      setRule("distill");
      
      const clean = distillContent(clipboardText, { customBlockedPhrases: [] });
      setProcessedText(clean);
      setDistillerStats(getDistillerStats(clipboardText, clean));

      // Smooth scroll back up to the tuner panel inside the output card
      setTimeout(() => {
        const resultCard = document.querySelector(".result-card");
        if (resultCard) {
          resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this newsletter template?")) {
      setTemplates(prev => {
        const updated = prev.filter(t => t.id !== id);
        // If we deleted the active template, reset selection to "none" and clear custom filters
        if (selectedTemplateId === id) {
          setSelectedTemplateId("none");
          if (rule === "distill" && clipboardText) {
            const clean = distillContent(clipboardText, { customBlockedPhrases: [] });
            setProcessedText(clean);
            setDistillerStats(getDistillerStats(clipboardText, clean));
          }
        }
        return updated;
      });
    }
  };

  const handleToggleLockTemplate = (id) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isLocked: !t.isLocked };
      }
      return t;
    }));
  };

  const handleRenameTemplate = (id, currentName) => {
    const newName = window.prompt("Rename Template:", currentName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Template name cannot be empty.");
      return;
    }
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, name: trimmed };
      }
      return t;
    }));
  };

  const handleAddBlockedPhrase = (id, phrase) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl && tpl.isLocked) {
      alert("This template is locked. Please unlock it under 'Custom Newsletter Filters' below to make changes.");
      return;
    }

    const trimmed = phrase.trim();
    if (!trimmed) return;
    
    let updatedTpl = null;
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          if (t.blockedPhrases.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
            updatedTpl = t;
            return t; // duplicate
          }
          updatedTpl = { ...t, blockedPhrases: [...t.blockedPhrases, trimmed] };
          return updatedTpl;
        }
        return t;
      });

      // Synchronously re-distill with the updated template filters
      if (rule === "distill" && clipboardText && updatedTpl) {
        const clean = distillContent(clipboardText, { customBlockedPhrases: updatedTpl.blockedPhrases });
        setProcessedText(clean);
        setDistillerStats(getDistillerStats(clipboardText, clean));
      }
      return updated;
    });
  };

  const handleRemoveBlockedPhrase = (id, phraseToRemove) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl && tpl.isLocked) {
      alert("This template is locked. Please unlock it under 'Custom Newsletter Filters' below to make changes.");
      return;
    }

    let updatedTpl = null;
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          updatedTpl = { ...t, blockedPhrases: t.blockedPhrases.filter(p => p !== phraseToRemove) };
          return updatedTpl;
        }
        return t;
      });

      if (rule === "distill" && clipboardText) {
        const clean = distillContent(clipboardText, { customBlockedPhrases: updatedTpl ? updatedTpl.blockedPhrases : [] });
        setProcessedText(clean);
        setDistillerStats(getDistillerStats(clipboardText, clean));
      }
      return updated;
    });
  };

  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id);
    let targetTemplate = null;
    if (id !== "none") {
      targetTemplate = templates.find(t => t.id === id) || null;
    }
    if (rule === "distill" && clipboardText) {
      const clean = distillContent(clipboardText, { customBlockedPhrases: targetTemplate ? targetTemplate.blockedPhrases : [] });
      setProcessedText(clean);
      setDistillerStats(getDistillerStats(clipboardText, clean));
    }
  };

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
  const [rate, setRate] = useState(() => {
    const saved = parseFloat(localStorage.getItem("vocalize_speech_rate"));
    return isNaN(saved) ? 0.5 : saved;
  });

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

  // Share paste logic for both button and text area paste events
  const handleTextPaste = (text) => {
    setClipboardText(text);
    stopSpeech();

    // If Clean-It-Up mode is selected, automatically run clean up and open the tuner immediately
    if (rule === "distill") {
      const clean = distillContent(text, { customBlockedPhrases: activeTemplate ? activeTemplate.blockedPhrases : [] });
      setProcessedText(clean);
      setDistillerStats(getDistillerStats(text, clean));
    } else {
      setProcessedText("");
      setDistillerStats("");
    }
  };

  // Clipboard Paste Logic
  const handlePaste = async () => {
    try {
      if (window.confirm("Do you want to paste the text from your clipboard?")) {
        const text = await navigator.clipboard.readText();
        handleTextPaste(text);
      }
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
      alert("Please allow clipboard permissions in your browser, or manually paste the text into the textbox.");
    }
  };

  // Content Distiller — runs entirely client-side, no backend call needed
  const handleDistill = (overrideText = null, overrideTemplate = null) => {
    const textToDistill = overrideText !== null ? overrideText : clipboardText;
    if (!textToDistill) return;
    stopSpeech();

    const tpl = overrideTemplate !== null ? overrideTemplate : activeTemplate;
    const blockedPhrases = tpl ? tpl.blockedPhrases : [];

    const clean = distillContent(textToDistill, { customBlockedPhrases: blockedPhrases });
    const stats = getDistillerStats(textToDistill, clean);
    setProcessedText(clean);
    setDistillerStats(stats);
    setRule("distill");

    // Save to history just like an AI result
    const newHistoryItem = {
      id: generateHistoryId(),
      originalText: textToDistill,
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
    const textToSpeak = processedText || clipboardText;
    if (!textToSpeak) return;

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
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

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

  // Change voice and update speech playback immediately if active
  const handleVoiceChange = (voiceName) => {
    setSelectedVoice(voiceName);
    const textToSpeak = processedText || clipboardText;
    if (isPlaying && textToSpeak) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voiceObj = voices.find((v) => v.name === voiceName);
      if (voiceObj) utterance.voice = voiceObj;
      utterance.rate = rate;
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
    }
  };

  // Change rate, persist to localStorage, and update speech playback immediately if active
  const handleRateChange = (newRate) => {
    setRate(newRate);
    localStorage.setItem("vocalize_speech_rate", newRate);
    const textToSpeak = processedText || clipboardText;
    if (isPlaying && textToSpeak) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      if (selectedVoice) {
        const voiceObj = voices.find((v) => v.name === selectedVoice);
        if (voiceObj) utterance.voice = voiceObj;
      }
      utterance.rate = newRate;
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
    }
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
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData("text");
                  if (pastedText) {
                    // Slight delay to let React cycle finish, then run paste handler
                    setTimeout(() => handleTextPaste(pastedText), 50);
                  }
                }}
                className="modern-textarea"
                placeholder="Enter or paste text to process..."
              />
              <span className="char-counter">{clipboardText.length} chars</span>
            </div>

            {/* Active Template Status Badge */}
            {templates.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {activeTemplate ? (
                  <span className="template-badge-applied" title={`Selected Filter: "${activeTemplate.name}"`}>
                    ✓ Active Template: <strong>{activeTemplate.name}</strong> ({activeTemplate.blockedPhrases.length} excluded sections)
                  </span>
                ) : (
                  <span className="template-badge-none">
                    No active template (select one in controls row)
                  </span>
                )}
              </div>
            )}

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

              <button onClick={() => { setClipboardText(""); setProcessedText(""); setDistillerStats(""); stopSpeech(); }} className="btn btn-secondary">
                <ClearIcon /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Rearrangeable Sections Container */}
        {layoutOrder.map((sectionId, index) => {
          if (sectionId === "distillery") {
            if (!clipboardText || (rule !== "distill" && !processedText)) return null;
            return (
              <div 
                key="distillery"
                draggable={draggableSection === "distillery"}
                onDragStart={(e) => handleLayoutDragStart(e, index)}
                onDragOver={(e) => handleLayoutDragOver(e, index)}
                onDragEnd={handleLayoutDragEnd}
                className="result-card" 
                style={{ 
                  marginTop: "20px", 
                  animation: "fadeIn 0.3s",
                  opacity: draggedIndex === index ? 0.4 : 1,
                  transition: "opacity 0.2s ease, transform 0.2s ease"
                }}
              >
                <div className="result-header">
                  <span>{rule === "distill" ? "Distillery Sections" : "AI Output Result"}</span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {renderLayoutGrip("distillery")}
                    <span className="result-badge">{getRuleLabel(rule)}</span>
                  </div>
                </div>

                {/* Show distiller stats when Clean-It-Up was used */}
                {rule === "distill" && distillerStats && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "12px", fontStyle: "italic" }}>
                    {distillerStats}
                  </p>
                )}
                
                {/* Always show section breakout in distill mode when text is pasted */}
                {rule === "distill" ? (
                  <div className="boilerplate-tuner-panel" style={{ animation: "fadeIn 0.2s" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                      <strong>Distillery Sections</strong>: Click <strong>X Exclude</strong> to cross out sections that won't be read, and <strong>+ Include</strong> to restore them.
                      {activeTemplate ? (
                        activeTemplate.isLocked && (
                          <span style={{ marginLeft: "8px", color: "var(--color-danger)", fontWeight: 600, fontSize: "0.8rem" }}>
                            🔒 Template is locked — unlock it in the Filters manager below to make changes.
                          </span>
                        )
                      ) : (
                        <span style={{ marginLeft: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>
                          No template selected — changes here won't be saved until you apply or create a template below.
                        </span>
                      )}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(() => {
                        const baseClean = distillContent(clipboardText);
                        return baseClean.split("\n\n").map((para, idx) => {
                          const trimmedPara = para.trim();
                          if (!trimmedPara) return null;

                          const lowerPara = trimmedPara.toLowerCase();
                          const blockedPhrases = activeTemplate ? activeTemplate.blockedPhrases : [];
                          const matchingPhrase = blockedPhrases.find(phrase =>
                            phrase && lowerPara.includes(phrase.toLowerCase())
                          );
                          const isBlocked = !!matchingPhrase;
                          const isLocked = activeTemplate ? activeTemplate.isLocked : false;

                          return (
                            <div
                              key={idx}
                              className="tuner-row"
                              style={{
                                position: "relative",
                                padding: "10px 44px 10px 12px",
                                background: isBlocked ? "rgba(239, 68, 68, 0.04)" : "var(--bg-app)",
                                border: isBlocked ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--border-color)",
                                borderRadius: "10px",
                                fontSize: "0.9rem",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <span style={{
                                display: "block",
                                whiteSpace: "pre-wrap",
                                textDecoration: isBlocked ? "line-through" : "none",
                                opacity: isBlocked ? 0.4 : 1,
                                color: isBlocked ? "var(--text-secondary)" : "var(--text-primary)",
                                lineHeight: 1.5
                              }}>
                                {trimmedPara}
                              </span>

                              {/* Icon button — top-right corner, inside card */}
                              {activeTemplate ? (
                                <button
                                  onClick={() => {
                                    if (isLocked) {
                                      alert("This template is locked. Unlock it in the Filters manager below to make changes.");
                                      return;
                                    }
                                    if (isBlocked) {
                                      handleRemoveBlockedPhrase(activeTemplate.id, matchingPhrase);
                                    } else {
                                      const filterPhrase = trimmedPara.length > 70 ? trimmedPara.substring(0, 70) : trimmedPara;
                                      handleAddBlockedPhrase(activeTemplate.id, filterPhrase);
                                    }
                                  }}
                                  title={isLocked ? "Unlock template to make changes" : isBlocked ? "Restore: include this section in the reading" : "Exclude this section from reading"}
                                  style={{
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "6px",
                                    border: `1.5px solid ${isBlocked ? "var(--color-success)" : "var(--color-danger)"}`,
                                    background: isBlocked ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                    color: isBlocked ? "var(--color-success)" : "var(--color-danger)",
                                    cursor: isLocked ? "not-allowed" : "pointer",
                                    opacity: isLocked ? 0.4 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    transition: "all 0.2s ease",
                                    padding: 0
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    {isBlocked
                                      ? <path d="M12 5v14M5 12h14"/>   /* + restore */
                                      : <path d="M18 6L6 18M6 6l12 12"/>  /* × exclude */
                                    }
                                  </svg>
                                </button>
                              ) : (
                                <span style={{ position: "absolute", top: "8px", right: "8px", fontSize: "0.65rem", color: "var(--text-secondary)", fontStyle: "italic", whiteSpace: "nowrap" }}>no template</span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Collapsible plain distilled text */}
                    {processedText && (
                      <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <button
                          onClick={() => setShowDistilledText(v => !v)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}
                        >
                          <span style={{ fontSize: "0.7rem" }}>{showDistilledText ? "▼" : "▶"}</span>
                          {showDistilledText ? "Hide" : "Show"} distilled reading text
                        </button>
                        {showDistilledText && (
                          <p className="result-content" style={{ marginTop: "10px", fontSize: "0.9rem" }}>{processedText}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="result-content">{processedText}</p>
                )}
              </div>
            );
          }

          if (sectionId === "player") {
            if (!clipboardText) return null;
            return (
              <div 
                key="player"
                draggable={draggableSection === "player"}
                onDragStart={(e) => handleLayoutDragStart(e, index)}
                onDragOver={(e) => handleLayoutDragOver(e, index)}
                onDragEnd={handleLayoutDragEnd}
                className="result-card tts-player-card" 
                style={{ 
                  marginTop: "20px", 
                  animation: "fadeIn 0.3s",
                  opacity: draggedIndex === index ? 0.4 : 1,
                  transition: "opacity 0.2s ease, transform 0.2s ease"
                }}
              >
                <div className="result-header">
                  <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <SpeakerIcon /> <span>TTS Player</span>
                  </span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {renderLayoutGrip("player")}
                    {rule === "distill" && activeTemplate && (
                      <span className="template-badge-applied">
                        Active Filter: {activeTemplate.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* TTS Settings & Controls */}
                <div className="tts-controls-panel" style={{ marginTop: 0 }}>
                  <div className="tts-controls-grid">
                    {/* Voice Selection */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="slider-label" style={{ fontSize: "0.8rem" }}>Select Voice</label>
                      <div className="select-wrapper" style={{ minWidth: "100%" }}>
                        <select
                          value={selectedVoice}
                          onChange={(e) => handleVoiceChange(e.target.value)}
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
                        onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                        className="modern-slider"
                      />
                    </div>
                  </div>
                </div>

                {/* Play/Pause controls actions */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                  <button onClick={handleSpeakToggle} className="btn btn-accent" style={{ flex: 1, minWidth: "140px" }}>
                    {isPlaying ? (isPaused ? <PlayIcon /> : <PauseIcon />) : <PlayIcon />}
                    <span>{isPlaying ? (isPaused ? " Resume Audio" : " Pause Audio") : " Play Audio"}</span>
                  </button>
                  {isPlaying && (
                    <button onClick={stopSpeech} className="btn btn-secondary">
                      <StopIcon /> Stop
                    </button>
                  )}
                  {processedText && (
                    <button onClick={handleCopyResult} className="btn btn-secondary" style={{ flex: 1, minWidth: "120px" }}>
                      <CopyIcon /> Copy Clean Text
                    </button>
                  )}
                </div>
              </div>
            );
          }

          if (sectionId === "filters") {
            return (
              <div 
                key="filters"
                draggable={draggableSection === "filters"}
                onDragStart={(e) => handleLayoutDragStart(e, index)}
                onDragOver={(e) => handleLayoutDragOver(e, index)}
                onDragEnd={handleLayoutDragEnd}
                className="result-card templates-section" 
                style={{ 
                  marginTop: "20px", 
                  textAlign: "left",
                  opacity: draggedIndex === index ? 0.4 : 1,
                  transition: "opacity 0.2s ease, transform 0.2s ease"
                }}
              >
                <div className="result-header" style={{ marginBottom: "16px" }}>
                  <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <SparklesIcon /> Custom Newsletter Filters ({templates.length})
                  </span>
                  {renderLayoutGrip("filters")}
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                  Create custom templates for newsletters you paste regularly to exclude specific boilerplate and repeating sections from being read.
                </p>

                {/* Form to create a new template */}
                <div className="new-template-form" style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "var(--bg-app)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "20px" }}>
                  <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Template Name</label>
                    <input 
                      type="text" 
                      id="new-tpl-name" 
                      placeholder="e.g. Morning Brew" 
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
                          handleCreateTemplate(name);
                          nameInput.value = "";
                        }
                      }} 
                      className="btn btn-accent" 
                      style={{ padding: "10px 16px", fontSize: "0.85rem", height: "40px" }}
                    >
                      + Add Template
                    </button>
                  </div>
                </div>

                {/* List of existing templates */}
                {templates.length === 0 ? (
                  <div className="history-empty" style={{ padding: "24px", marginBottom: "20px" }}>
                    No custom newsletter templates created yet. Set one up above!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                    {templates.map(tpl => {
                      const isExpanded = selectedTemplateId === tpl.id;
                      return (
                        <div 
                          key={tpl.id} 
                          className="template-card" 
                          style={{ 
                            background: "var(--history-item-bg)", 
                            border: "1px solid var(--border-color)", 
                            borderRadius: "12px", 
                            padding: "16px" 
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{tpl.name}</h4>
                              {/* Lock/unlock icon-only toggle — sits right next to the template name */}
                              <button
                                onClick={() => handleToggleLockTemplate(tpl.id)}
                                title={tpl.isLocked ? "Unlock template to allow editing" : "Lock template to prevent accidental edits"}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "2px 4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  color: tpl.isLocked ? "var(--color-danger)" : "var(--text-secondary)",
                                  opacity: 0.85,
                                  transition: "color 0.2s, opacity 0.2s"
                                }}
                              >
                                {tpl.isLocked ? <LockIcon /> : <UnlockIcon />}
                              </button>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                              {tpl.blockedPhrases.length} section{tpl.blockedPhrases.length !== 1 ? "s" : ""} excluded
                            </p>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                onClick={() => setSelectedTemplateId(selectedTemplateId === tpl.id ? "none" : tpl.id)}
                                className="btn-secondary"
                                style={{ padding: "6px 12px", fontSize: "0.8rem", border: "none", cursor: "pointer" }}
                              >
                                {isExpanded ? "Hide Details" : `Manage Sections (${tpl.blockedPhrases.length})`}
                              </button>
                              <button
                                onClick={() => handleRenameTemplate(tpl.id, tpl.name)}
                                className="btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                                title="Rename Template"
                              >
                                <EditIcon />Rename
                              </button>
                              <button 
                                onClick={() => handleDeleteTemplate(tpl.id)} 
                                className="btn-danger-outline"
                                style={{ padding: "6px 10px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", cursor: "pointer" }}
                              >
                                <TrashIcon /> Delete
                              </button>
                            </div>
                          </div>

                          {/* Expanded details: blocked phrases list */}
                          {isExpanded && (
                            <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "14px", animation: "fadeIn 0.2s" }}>
                              <h5 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                                Excluded Sections ({tpl.blockedPhrases.length})
                              </h5>
                              
                              {tpl.blockedPhrases.length === 0 ? (
                                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontStyle: "italic", marginBottom: "12px" }}>
                                  No sections excluded yet. Use the Distillery above to exclude lines, or add them manually below.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                                  {tpl.blockedPhrases.map((phrase, pIdx) => (
                                    <span 
                                      key={pIdx} 
                                      style={{ 
                                        background: "var(--bg-app)", 
                                        border: "1px solid var(--border-color)", 
                                        borderRadius: "6px", 
                                        padding: "4px 8px", 
                                        fontSize: "0.75rem", 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        gap: "6px",
                                        opacity: tpl.isLocked ? 0.6 : 1
                                      }}
                                    >
                                      <span>{phrase}</span>
                                      {!tpl.isLocked && (
                                        <button 
                                          onClick={() => handleRemoveBlockedPhrase(tpl.id, phrase)}
                                          style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                          title="Remove this excluded section"
                                        >
                                          <ClearIcon />
                                        </button>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Inline form to add blocked phrase — controlled input for reliable mobile keyboard support */}
                              {tpl.isLocked ? (
                                <p style={{ fontSize: "0.8rem", color: "var(--color-danger)", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <LockIcon /> Template is locked. Click Unlock above to make changes.
                                </p>
                              ) : (
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <input 
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    placeholder="Add phrase to block section..." 
                                    value={addPhraseInputs[tpl.id] || ""}
                                    onChange={(e) => setAddPhraseInputs(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = (addPhraseInputs[tpl.id] || "").trim();
                                        if (val) {
                                          handleAddBlockedPhrase(tpl.id, val);
                                          setAddPhraseInputs(prev => ({ ...prev, [tpl.id]: "" }));
                                        }
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      padding: "8px 12px",
                                      fontSize: "0.85rem",
                                      background: "var(--bg-input)",
                                      border: "1px solid var(--border-color)",
                                      borderRadius: "10px",
                                      color: "var(--text-primary)",
                                      outline: "none",
                                      fontFamily: "inherit"
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      const val = (addPhraseInputs[tpl.id] || "").trim();
                                      if (val) {
                                        handleAddBlockedPhrase(tpl.id, val);
                                        setAddPhraseInputs(prev => ({ ...prev, [tpl.id]: "" }));
                                      }
                                    }}
                                    style={{ padding: "8px 16px", fontSize: "0.85rem", flexShrink: 0, whiteSpace: "nowrap", borderRadius: "10px", cursor: "pointer", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "inherit", fontWeight: 600 }}
                                  >
                                    Add
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

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
      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop} 
          className="scroll-to-top-btn" 
          title="Scroll back up to read/process text"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon-svg">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default App;
