import { useState, useEffect, useRef, useCallback } from "react";
import { optimizeForSpeech } from "../utils/ttsOptimizer";

// ─── Silent AudioContext Keepalive ──────────────────────────────────────────
//
// Android Chrome pauses SpeechSynthesis whenever there is no active audio
// stream (screen lock, app switch). Holding an AudioContext open with a
// looping silent buffer convinces the OS that media is actively playing,
// keeping audio focus and allowing SpeechSynthesis to continue uninterrupted.
//
// This must be created from a user gesture (button click) — which is already
// satisfied because playback only starts from the Play button.

function createSilentKeepAlive() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();

    // 0.5 s of silence (all zeros), looped forever
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.5), ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(ctx.destination);
    source.start(0);

    return { ctx, source };
  } catch (e) {
    console.warn("[useSpeech] AudioContext keepalive creation failed:", e);
    return null;
  }
}

function destroySilentKeepAlive(keepAlive) {
  if (!keepAlive) return;
  try {
    keepAlive.source.stop();
    keepAlive.source.disconnect();
    keepAlive.ctx.close();
  } catch (_) {
    // Safe to ignore on teardown
  }
}

// ─── Media Session API ───────────────────────────────────────────────────────
//
// Registers with Android's media system. This makes the lock screen and
// notification shade show play/pause/stop controls for Listen Better,
// and tells the OS this page owns audio focus.

function setMediaSessionPlaying(title, handlers) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Listen Better",
      artist: "Listen Better",
      artwork: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    });
    navigator.mediaSession.playbackState = "playing";

    if (handlers) {
      navigator.mediaSession.setActionHandler("play", handlers.play);
      navigator.mediaSession.setActionHandler("pause", handlers.pause);
      navigator.mediaSession.setActionHandler("stop", handlers.stop);
    }
  } catch (e) {
    console.warn("[useSpeech] MediaSession setPlaying failed:", e);
  }
}

function setMediaSessionPaused() {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = "paused";
  } catch (_) {}
}

function clearMediaSession() {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = "none";
    navigator.mediaSession.metadata = null;
    ["play", "pause", "stop"].forEach((action) => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch (_) {}
    });
  } catch (_) {}
}

// ─── Hook ────────────────────────────────────────────────────────────────────

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
  const keepAliveRef = useRef(null);       // { ctx, source } | null
  const isPlayingRef = useRef(false);      // mirrors isPlaying for event handlers
  const isPausedRef = useRef(false);       // mirrors isPaused for event handlers
  const currentTextRef = useRef("");       // for visibilitychange resume

  // Keep refs in sync with state so event listeners always see current values
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Load voices ────────────────────────────────────────────────────────────
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
          const hasCurrent = availableVoices.find((v) => v.name === selectedVoice);
          if (!hasCurrent) {
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

  // ── visibilitychange — resume speech on return from background ─────────────
  //
  // Android Chrome can pause SpeechSynthesis when the screen locks, even with
  // the AudioContext keepalive. When the user unlocks/returns, we call resume()
  // to restart it from where it left off.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!window.speechSynthesis) return;

      if (document.hidden) {
        // Going to background — resume() nudge keeps the speech queue active
        // in some Android Chrome versions that pause on hide
        if (isPlayingRef.current && !isPausedRef.current) {
          try { window.speechSynthesis.resume(); } catch (_) {}
        }
      } else {
        // Returning to foreground — if we were playing, try to resume
        if (isPlayingRef.current && !isPausedRef.current) {
          try {
            window.speechSynthesis.resume();
          } catch (_) {}
          // Also resume AudioContext if it was suspended by the OS
          if (keepAliveRef.current?.ctx?.state === "suspended") {
            keepAliveRef.current.ctx.resume().catch(() => {});
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    // pagehide fires on some Android WebViews when the page is backgrounded
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, []); // intentionally empty — uses refs for current state

  // ── Teardown keepalive on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      destroySilentKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
      clearMediaSession();
    };
  }, []);

  // ── Internal: attach events to an utterance ────────────────────────────────
  const attachUtteranceEvents = useCallback((utterance, voiceObj, speechRate) => {
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = speechRate;
    utteranceRef.current = utterance;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      destroySilentKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
      clearMediaSession();
    };

    utterance.onerror = (e) => {
      // "interrupted" fires when we manually cancel() — not a real error
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.error("[useSpeech] SpeechSynthesis error:", e);
      }
      setIsPlaying(false);
      setIsPaused(false);
      destroySilentKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
      clearMediaSession();
    };
  }, []);

  // ── stopSpeech ─────────────────────────────────────────────────────────────
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    destroySilentKeepAlive(keepAliveRef.current);
    keepAliveRef.current = null;
    clearMediaSession();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // ── Internal: start fresh speech (used by multiple handlers) ──────────────
  const startSpeech = useCallback((textToSpeak, voiceName, speechRate, voiceList) => {
    const optimizedText = optimizeForSpeech(textToSpeak);
    const utterance = new SpeechSynthesisUtterance(optimizedText);
    const voiceObj = voiceName ? voiceList.find((v) => v.name === voiceName) : null;

    attachUtteranceEvents(utterance, voiceObj, speechRate);
    currentTextRef.current = textToSpeak;

    // Android lock fix: call resume() before speak() to unblock the queue
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    // Start silent AudioContext BEFORE speak() so audio focus is claimed first
    destroySilentKeepAlive(keepAliveRef.current);
    keepAliveRef.current = createSilentKeepAlive();

    window.speechSynthesis.speak(utterance);

    // Register with Android media system (lock screen controls)
    setMediaSessionPlaying(optimizedText.slice(0, 60), {
      play: () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
          setMediaSessionPlaying(optimizedText.slice(0, 60), null);
        }
      },
      pause: () => {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setMediaSessionPaused();
      },
      stop: () => {
        stopSpeech();
      },
    });

    setIsPlaying(true);
    setIsPaused(false);
  }, [attachUtteranceEvents, stopSpeech]);

  // ── handleSpeakToggle ──────────────────────────────────────────────────────
  const handleSpeakToggle = useCallback((textToSpeak) => {
    if (!textToSpeak) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setMediaSessionPaused();
      return;
    }

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      // Also resume AudioContext if OS suspended it
      if (keepAliveRef.current?.ctx?.state === "suspended") {
        keepAliveRef.current.ctx.resume().catch(() => {});
      }
      setIsPaused(false);
      setMediaSessionPlaying(currentTextRef.current.slice(0, 60), null);
      return;
    }

    // Start completely new speech
    startSpeech(textToSpeak, selectedVoice, rate, voices);
  }, [isPlaying, isPaused, rate, selectedVoice, voices, startSpeech]);

  // ── handleVoiceChange ──────────────────────────────────────────────────────
  const handleVoiceChange = useCallback((voiceName, currentText) => {
    setSelectedVoice(voiceName);
    localStorage.setItem("vocalize_selected_voice", voiceName);
    if (isPlaying && currentText) {
      stopSpeech();
      setTimeout(() => {
        startSpeech(currentText, voiceName, rate, voices);
      }, 50);
    }
  }, [isPlaying, stopSpeech, rate, voices, startSpeech]);

  // ── handleRateChange ───────────────────────────────────────────────────────
  const handleRateChange = useCallback((newRate, currentText) => {
    setRate(newRate);
    localStorage.setItem("vocalize_speech_rate", newRate.toString());
    if (isPlaying && currentText) {
      stopSpeech();
      setTimeout(() => {
        startSpeech(currentText, selectedVoice, newRate, voices);
      }, 50);
    }
  }, [isPlaying, stopSpeech, selectedVoice, voices, startSpeech]);

  return {
    voices,
    selectedVoice,
    rate,
    isPlaying,
    isPaused,
    handleSpeakToggle,
    stopSpeech,
    handleVoiceChange,
    handleRateChange,
  };
}
