import { useState, useEffect, useRef, useCallback } from "react";
import { optimizeForSpeech } from "../utils/ttsOptimizer";

export function useSpeech(defaultRate = 1.0) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vocalize_selected_voice") || "";
    }
    return "";
  });
  const [rate, setRate] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = parseFloat(localStorage.getItem("vocalize_speech_rate"));
      return isNaN(saved) ? defaultRate : saved;
    }
    return defaultRate;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();

        if (availableVoices.length > 0) {
          // Sort voices: Local English first, then Local, then Cloud English, then rest
          availableVoices.sort((a, b) => {
            if (a.localService && !b.localService) return -1;
            if (!a.localService && b.localService) return 1;
            if (a.lang.startsWith("en") && !b.lang.startsWith("en")) return -1;
            if (!a.lang.startsWith("en") && b.lang.startsWith("en")) return 1;
            return a.name.localeCompare(b.name);
          });
          setVoices(availableVoices);

          // Keep current selection if valid, otherwise pick default
          const hasCurrent = availableVoices.find(v => v.name === selectedVoice);
          if (!hasCurrent) {
            // Prioritize: 1. Local English, 2. Any Local, 3. Any English, 4. First available
            const defaultVoice =
              availableVoices.find((v) => v.lang.startsWith("en") && v.localService) ||
              availableVoices.find((v) => v.localService) ||
              availableVoices.find((v) => v.lang.startsWith("en")) ||
              availableVoices[0];
            setSelectedVoice(defaultVoice.name);
            localStorage.setItem("vocalize_selected_voice", defaultVoice.name);
          }
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
  }, [selectedVoice]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const handleSpeakToggle = useCallback((textToSpeak) => {
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
    window.speechSynthesis.resume(); // Fixes Android lock
    window.speechSynthesis.cancel();
    const optimizedText = optimizeForSpeech(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(optimizedText);

    if (selectedVoice) {
      const voiceObj = voices.find((v) => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

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
  }, [isPlaying, isPaused, rate, selectedVoice, voices]);

  const handleVoiceChange = useCallback((voiceName, currentText) => {
    setSelectedVoice(voiceName);
    localStorage.setItem("vocalize_selected_voice", voiceName);
    if (isPlaying && currentText) {
      // Restart speech with new voice
      stopSpeech();
      // Need a slight timeout to let cancel finish in some browsers
      setTimeout(() => {
        const optimizedText = optimizeForSpeech(currentText);
        const utterance = new SpeechSynthesisUtterance(optimizedText);
        const voiceObj = voices.find((v) => v.name === voiceName);
        if (voiceObj) utterance.voice = voiceObj;
        utterance.rate = rate;
        utteranceRef.current = utterance;
        
        utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
        utterance.onerror = (e) => { setIsPlaying(false); setIsPaused(false); };
        
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
      }, 50);
    }
  }, [isPlaying, stopSpeech, rate, voices]);

  const handleRateChange = useCallback((newRate, currentText) => {
    setRate(newRate);
    localStorage.setItem("vocalize_speech_rate", newRate.toString());
    if (isPlaying && currentText) {
      stopSpeech();
      setTimeout(() => {
        const optimizedText = optimizeForSpeech(currentText);
        const utterance = new SpeechSynthesisUtterance(optimizedText);
        if (selectedVoice) {
          const voiceObj = voices.find((v) => v.name === selectedVoice);
          if (voiceObj) utterance.voice = voiceObj;
        }
        utterance.rate = newRate;
        utteranceRef.current = utterance;
        
        utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
        utterance.onerror = (e) => { setIsPlaying(false); setIsPaused(false); };
        
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
      }, 50);
    }
  }, [isPlaying, stopSpeech, selectedVoice, voices]);

  return {
    voices,
    selectedVoice,
    rate,
    isPlaying,
    isPaused,
    handleSpeakToggle,
    stopSpeech,
    handleVoiceChange,
    handleRateChange
  };
}
