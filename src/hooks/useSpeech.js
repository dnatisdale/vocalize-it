import { useState, useEffect, useRef, useCallback } from "react";
import { optimizeForSpeech } from "../utils/ttsOptimizer";

// ─── AudioContext Keepalive ──────────────────────────────────────────────────
//
// Android Chrome pauses SpeechSynthesis when there is no active audio stream.
// Two-layer defence:
//
//  1. LOOPING AUDIOBUFFER — a short buffer filled with tiny non-zero samples
//     (±0.0001) played on a looping AudioBufferSourceNode. Android's battery
//     optimiser is much better at detecting a near-zero *oscillator* as silence
//     than a genuinely looping buffer with non-zero content.
//
//  2. MEDIASTREAM → <audio> ELEMENT — the AudioContext graph is also routed
//     through a MediaStreamAudioDestinationNode into a hidden <audio> element.
//     This makes Android classify the page as an active media player (same
//     bucket as Spotify / podcast apps), not a generic browser tab, giving it
//     a far stronger signal to keep the page alive.
//
// Must be created inside a user gesture — satisfied by the Play button.

function createAudioKeepAlive() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();

    // ── Layer 1: Looping AudioBuffer with non-zero samples ──────────────────
    // A 1-second mono buffer at the context's sample rate, filled with a tiny
    // alternating signal. Non-zero content is harder for Android to classify
    // as silence than an oscillator through a near-zero gain node.
    const bufferSize = ctx.sampleRate; // 1 second of samples
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Alternate sign so it's not DC-offset; amplitude is well below audible.
      data[i] = (i % 2 === 0 ? 1 : -1) * 0.0001;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1; // gain stays at 1 — the buffer amplitude is tiny
    source.connect(gainNode);

    // ── Layer 2: MediaStream → hidden <audio> element ────────────────────────
    // Route the graph to a MediaStreamDestinationNode and pipe it into a real
    // <audio> element. This registers the page as an active media source with
    // the OS, preventing Android from throttling or suspending the tab.
    let audioEl = null;
    try {
      const streamDest = ctx.createMediaStreamDestination();
      gainNode.connect(streamDest);
      gainNode.connect(ctx.destination); // also keep direct connection

      audioEl = document.createElement("audio");
      audioEl.srcObject = streamDest.stream;
      audioEl.volume = 0;   // silent to the user
      audioEl.muted = false; // NOT muted — muted elements don't count as active media
      audioEl.play().catch(() => {}); // may fail if autoplay policy blocks it; non-fatal
    } catch (streamErr) {
      // MediaStreamDestination not supported — fall back to direct destination only
      gainNode.connect(ctx.destination);
      console.warn("[useSpeech] MediaStream keepalive not available:", streamErr);
    }

    source.start(0);

    console.log("[useSpeech] AudioContext keepalive started (buffer+stream)");
    return { ctx, source, audioEl };
  } catch (e) {
    console.warn("[useSpeech] AudioContext keepalive creation failed:", e);
    return null;
  }
}

// ─── Screen Wake Lock ────────────────────────────────────────────────────────
//
// Prevents the phone screen from auto-locking during playback. When the screen
// stays on, Android does not throttle the page or suspend SpeechSynthesis.
// The lock is released automatically when speech ends or is paused.

async function requestWakeLock() {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return null;
  try {
    const lock = await navigator.wakeLock.request("screen");
    console.log("[useSpeech] Screen wake lock acquired");
    return lock;
  } catch (e) {
    // Low battery or page not visible — non-fatal
    console.warn("[useSpeech] Wake lock request failed:", e.message);
    return null;
  }
}

async function releaseWakeLock(lock) {
  if (!lock) return;
  try {
    await lock.release();
    console.log("[useSpeech] Screen wake lock released");
  } catch (_) {}
}

function destroyAudioKeepAlive(keepAlive) {
  if (!keepAlive) return;
  try {
    keepAlive.source.stop();
    keepAlive.source.disconnect();
    keepAlive.ctx.close();
  } catch (_) {
    // Safe to ignore on teardown
  }
  // Clean up the hidden <audio> element used for the MediaStream keepalive
  try {
    if (keepAlive.audioEl) {
      keepAlive.audioEl.pause();
      keepAlive.audioEl.srcObject = null;
      keepAlive.audioEl = null;
    }
  } catch (_) {}
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
  const wakeLockRef = useRef(null);        // WakeLockSentinel | null
  const isPlayingRef = useRef(false);      // mirrors isPlaying for event handlers
  const isPausedRef = useRef(false);       // mirrors isPaused for event handlers
  const currentTextRef = useRef("");       // text to restart if speech dies on unlock
  const currentVoiceRef = useRef("");      // voice to restart with
  const currentRateRef = useRef(1.0);      // rate to restart with
  const currentVoicesRef = useRef([]);     // voice list to restart with

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

  // ── Periodic resume() heartbeat — keeps Android from killing speech on lock ──
  //
  // Android Chrome can silently pause SpeechSynthesis when the screen locks,
  // even with the AudioContext keepalive. Calling resume() every 5 s is
  // harmless if speech is already running, but wakes it back up if the OS
  // paused it behind the scenes.
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const heartbeat = setInterval(() => {
      if (!window.speechSynthesis) return;
      // Only nudge if not manually paused
      if (!isPausedRef.current && isPlayingRef.current) {
        try { window.speechSynthesis.resume(); } catch (_) {}
        // Also kick the AudioContext if it got suspended
        if (keepAliveRef.current?.ctx?.state === "suspended") {
          keepAliveRef.current.ctx.resume().catch(() => {});
        }
      }
    }, 5000);

    return () => clearInterval(heartbeat);
  }, [isPlaying, isPaused]);

  // ── visibilitychange — resume or restart speech on screen unlock ───────────
  //
  // Screen Wake Lock is released by the OS whenever the page becomes hidden
  // (manual power button press or app switch). We re-acquire it on return.
  //
  // Android can also kill SpeechSynthesis while hidden. On return we check if
  // speechSynthesis.speaking is false despite us thinking we're playing — if
  // so, restart from scratch (we can't resume from position with Web Speech API).
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!window.speechSynthesis) return;

      if (document.hidden) {
        // Going to background — nudge the speech queue; some Android versions
        // pause on hide and this prevents that.
        if (isPlayingRef.current && !isPausedRef.current) {
          try { window.speechSynthesis.resume(); } catch (_) {}
        }
      } else {
        // ── Returning to foreground ──────────────────────────────────────────
        if (isPlayingRef.current && !isPausedRef.current) {
          // Re-acquire wake lock (released automatically when page was hidden)
          requestWakeLock().then((lock) => { wakeLockRef.current = lock; });

          // Resume AudioContext if OS suspended it
          if (keepAliveRef.current?.ctx?.state === "suspended") {
            keepAliveRef.current.ctx.resume().catch(() => {});
          }

          // Check if speech actually survived the screen-off
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            // Speech died while screen was off — restart from the beginning
            console.log("[useSpeech] Speech died on screen lock — restarting");
            const text = currentTextRef.current;
            const voice = currentVoiceRef.current;
            const rate = currentRateRef.current;
            const voiceList = currentVoicesRef.current;
            if (text) {
              // Small delay to let the page fully resume
              setTimeout(() => {
                destroyAudioKeepAlive(keepAliveRef.current);
                keepAliveRef.current = createAudioKeepAlive();
                window.speechSynthesis.cancel();
                const optimizedText = optimizeForSpeech(text);
                const utterance = new SpeechSynthesisUtterance(optimizedText);
                const voiceObj = voice ? voiceList.find((v) => v.name === voice) : null;
                if (voiceObj) utterance.voice = voiceObj;
                utterance.rate = rate;
                utterance.onend = () => {
                  setIsPlaying(false); setIsPaused(false);
                  destroyAudioKeepAlive(keepAliveRef.current);
                  keepAliveRef.current = null;
                  releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
                  clearMediaSession();
                };
                utterance.onerror = (e) => {
                  if (e.error !== "interrupted" && e.error !== "canceled") {
                    console.error("[useSpeech] Restart error:", e);
                  }
                  setIsPlaying(false); setIsPaused(false);
                  destroyAudioKeepAlive(keepAliveRef.current);
                  keepAliveRef.current = null;
                  releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
                  clearMediaSession();
                };
                window.speechSynthesis.speak(utterance);
              }, 300);
            }
          } else {
            // Speech survived — just call resume() to make sure it's running
            try { window.speechSynthesis.resume(); } catch (_) {}
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
    };
  }, []); // intentionally empty — uses refs for current state

  // ── Teardown keepalive and wake lock on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      destroyAudioKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
      releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
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
      destroyAudioKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
      releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
      clearMediaSession();
    };

    utterance.onerror = (e) => {
      // "interrupted" fires when we manually cancel() — not a real error
      if (e.error !== "interrupted" && e.error !== "canceled") {
        console.error("[useSpeech] SpeechSynthesis error:", e);
      }
      setIsPlaying(false);
      setIsPaused(false);
      destroyAudioKeepAlive(keepAliveRef.current);
      keepAliveRef.current = null;
      releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
      clearMediaSession();
    };
  }, []);

  // ── stopSpeech ─────────────────────────────────────────────────────────────
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    destroyAudioKeepAlive(keepAliveRef.current);
    keepAliveRef.current = null;
    releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
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

    // Store context so visibilitychange can restart if speech dies on lock
    currentTextRef.current = textToSpeak;
    currentVoiceRef.current = voiceName;
    currentRateRef.current = speechRate;
    currentVoicesRef.current = voiceList;

    // Android lock fix: call resume() before speak() to unblock the queue
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    // Start oscillator AudioContext BEFORE speak() to claim audio focus first
    destroyAudioKeepAlive(keepAliveRef.current);
    keepAliveRef.current = createAudioKeepAlive();

    // Request screen wake lock — prevents auto-lock during playback
    requestWakeLock().then((lock) => { wakeLockRef.current = lock; });

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
