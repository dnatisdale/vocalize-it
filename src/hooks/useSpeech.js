import { useState, useEffect, useRef, useCallback } from "react";
import { optimizeForSpeech } from "../utils/ttsOptimizer";

export function useSpeech(defaultRate = 1.0) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
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
        setVoices(availableVoices);

        if (availableVoices.length > 0) {
          // Keep current selection if valid, otherwise pick default
          const hasCurrent = availableVoices.find(v => v.name === selectedVoice);
          if (!hasCurrent) {
            const defaultVoice =
              availableVoices.find((v) => v.lang.startsWith("en-")) ||
              availableVoices.find((v) => v.lang.startsWith("en")) ||
              availableVoices[0];
            setSelectedVoice(defaultVoice.name);
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
