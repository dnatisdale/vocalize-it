import { useState, useEffect } from "react";

/**
 * A hook to manage state synchronized with localStorage.
 * Handles parsing, serialization, and fallback values.
 *
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The fallback value if none exists
 * @returns {[any, Function]} - State and setter
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      // Fallback: If it was stored as raw string previously
      const raw = window.localStorage.getItem(key);
      if (raw) return raw;
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
