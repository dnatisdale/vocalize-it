import { useState, useEffect, useCallback } from "react";

const QUOTA_LIMIT = 1000000;
const STORAGE_KEY_USAGE = "vocalize_tts_usage";
const STORAGE_KEY_MONTH = "vocalize_tts_month";

export function useTTSQuota() {
  const [usedChars, setUsedChars] = useState(0);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const savedMonth = localStorage.getItem(STORAGE_KEY_MONTH);
    
    if (savedMonth !== currentMonth) {
      // New month, reset!
      localStorage.setItem(STORAGE_KEY_MONTH, currentMonth);
      localStorage.setItem(STORAGE_KEY_USAGE, "0");
      setUsedChars(0);
    } else {
      setUsedChars(parseInt(localStorage.getItem(STORAGE_KEY_USAGE) || "0", 10));
    }

    // Listen for custom event from other parts of the app
    const handleUpdate = (e) => {
      setUsedChars(e.detail.total);
    };
    window.addEventListener("tts-quota-updated", handleUpdate);
    return () => window.removeEventListener("tts-quota-updated", handleUpdate);
  }, []);

  const addUsage = useCallback((chars) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const savedMonth = localStorage.getItem(STORAGE_KEY_MONTH);
    
    let current = parseInt(localStorage.getItem(STORAGE_KEY_USAGE) || "0", 10);
    
    if (savedMonth !== currentMonth) {
      current = 0;
      localStorage.setItem(STORAGE_KEY_MONTH, currentMonth);
    }

    const newTotal = current + chars;
    localStorage.setItem(STORAGE_KEY_USAGE, newTotal.toString());
    setUsedChars(newTotal);
    
    // Dispatch event so other components (like the footer) update immediately
    window.dispatchEvent(new CustomEvent("tts-quota-updated", { detail: { total: newTotal } }));
  }, []);

  return {
    usedChars,
    remainingChars: Math.max(0, QUOTA_LIMIT - usedChars),
    quotaLimit: QUOTA_LIMIT,
    addUsage
  };
}
