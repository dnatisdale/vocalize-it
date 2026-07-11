import { useState, useEffect, useRef, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";
import { useTTSQuota } from "./useTTSQuota";

// ─── Cloud TTS Audio Pipeline ─────────────────────────────────────────────────
//
// Replaces Web Speech API (SpeechSynthesis) with real audio playback:
//
//  1. Text is split into chunks (~4,000 chars, breaking at sentence boundaries).
//  2. Each chunk is sent to the synthesizeSpeech Cloud Function, which calls
//     Google Cloud TTS and returns base64-encoded MP3.
//  3. The MP3 is decoded and played through an <audio> element.
//  4. The OS treats <audio> playback as real media — it survives screen-off on
//     Android and iOS, unlike SpeechSynthesis which the OS kills on lock.
//  5. The next chunk is pre-fetched while the current one plays (gapless queue).
//
// Voice: Google Cloud TTS Neural2 voices (higher quality than device voices).
// Fallback: If the Cloud Function fails, falls back to Web Speech API.

const CHUNK_SIZE = 4000; // chars — safely under Cloud TTS 5000-byte limit
const SENTENCE_ENDINGS = /(?<=[.!?])\s+/;

// Split text at sentence boundaries, keeping chunks under CHUNK_SIZE
function splitIntoChunks(text) {
  const sentences = text.split(SENTENCE_ENDINGS);
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > CHUNK_SIZE) {
      if (current.trim()) chunks.push(current.trim());
      // If a single sentence is too long, hard-split it
      if (sentence.length > CHUNK_SIZE) {
        for (let i = 0; i < sentence.length; i += CHUNK_SIZE) {
          chunks.push(sentence.slice(i, i + CHUNK_SIZE));
        }
        current = "";
      } else {
        current = sentence;
      }
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Convert base64 MP3 to an object URL for the <audio> element
function base64ToObjectUrl(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

// ─── Screen Wake Lock ─────────────────────────────────────────────────────────
async function requestWakeLock() {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return null;
  try {
    const lock = await navigator.wakeLock.request("screen");
    console.log("[useSpeech] Screen wake lock acquired");
    return lock;
  } catch (e) {
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

// ─── Media Session API ────────────────────────────────────────────────────────
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
  try { navigator.mediaSession.playbackState = "paused"; } catch (_) {}
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpeech(defaultRate = 1.0) {
  // Cloud TTS uses Neural2 voice names; we map a friendly default
  const CLOUD_VOICE_DEFAULT = "en-US-Neural2-J";

  const [selectedVoice, setSelectedVoice] = useState(() =>
    localStorage.getItem("vocalize_selected_voice") || CLOUD_VOICE_DEFAULT
  );
  const [rate, setRate] = useState(() => {
    const saved = parseFloat(localStorage.getItem("vocalize_speech_rate"));
    return isNaN(saved) ? defaultRate : saved;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { addUsage } = useTTSQuota();

  // Playback state refs (safe to read inside async callbacks)
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const wakeLockRef = useRef(null);
  const audioElRef = useRef(null);         // current <audio> element
  const chunksRef = useRef([]);            // full chunk list
  const chunkIndexRef = useRef(0);         // which chunk is playing
  const prefetchedRef = useRef(null);      // { url, index } pre-fetched next chunk
  const stopRequestedRef = useRef(false);  // signals the queue to abort
  const currentTextRef = useRef("");
  const currentVoiceRef = useRef(CLOUD_VOICE_DEFAULT);
  const currentRateRef = useRef(1.0);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Cloud Function reference ───────────────────────────────────────────────
  const getSynthesizeFn = useCallback(() => {
    const functions = getFunctions(app);
    return httpsCallable(functions, "synthesizeSpeech", { timeout: 30000 });
  }, []);

  // ── Fetch one chunk from Cloud TTS → object URL ───────────────────────────
  const fetchChunkAudio = useCallback(async (text, voiceName, speechRate) => {
    const synthesizeSpeech = getSynthesizeFn();
    const result = await synthesizeSpeech({
      text,
      voiceName: voiceName || CLOUD_VOICE_DEFAULT,
      speakingRate: speechRate || 1.0,
    });
    addUsage(text.length); // Track quota usage
    return base64ToObjectUrl(result.data.audioBase64);
  }, [getSynthesizeFn, addUsage]);

  // ── Teardown current audio element ─────────────────────────────────────────
  const destroyAudioEl = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current.onended = null;
      audioElRef.current.onerror = null;
      audioElRef.current = null;
    }
    // Revoke any pre-fetched URL to free memory
    if (prefetchedRef.current?.url) {
      URL.revokeObjectURL(prefetchedRef.current.url);
      prefetchedRef.current = null;
    }
  }, []);

  // ── Full stop ──────────────────────────────────────────────────────────────
  const stopSpeech = useCallback(() => {
    stopRequestedRef.current = true;
    destroyAudioEl();
    releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
    clearMediaSession();
    setIsPlaying(false);
    setIsPaused(false);
  }, [destroyAudioEl]);

  // ── Play a single chunk by index ───────────────────────────────────────────
  const playChunk = useCallback(async (index, voice, speechRate) => {
    if (stopRequestedRef.current) return;

    const chunks = chunksRef.current;
    if (index >= chunks.length) {
      // All chunks done — clean up
      console.log("[useSpeech] All chunks played.");
      destroyAudioEl();
      releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
      clearMediaSession();
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    chunkIndexRef.current = index;
    let objectUrl;

    // Use pre-fetched URL if available for this index
    if (prefetchedRef.current?.index === index && prefetchedRef.current?.url) {
      objectUrl = prefetchedRef.current.url;
      prefetchedRef.current = null;
    } else {
      try {
        objectUrl = await fetchChunkAudio(chunks[index], voice, speechRate);
      } catch (err) {
        console.error("[useSpeech] Cloud TTS fetch failed:", err);
        // Give up on this playback session
        destroyAudioEl();
        releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
        clearMediaSession();
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }
    }

    if (stopRequestedRef.current) {
      URL.revokeObjectURL(objectUrl);
      return;
    }

    // Pre-fetch the next chunk in the background while this one plays
    if (index + 1 < chunks.length) {
      fetchChunkAudio(chunks[index + 1], voice, speechRate)
        .then((url) => {
          if (!stopRequestedRef.current) {
            prefetchedRef.current = { url, index: index + 1 };
          } else {
            URL.revokeObjectURL(url);
          }
        })
        .catch(() => {}); // pre-fetch failure is non-fatal; next chunk fetches fresh
    }

    // Create and play the <audio> element
    destroyAudioEl();
    const audio = new Audio(objectUrl);
    audio.volume = 1.0;
    audioElRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(objectUrl);
      if (!stopRequestedRef.current) {
        playChunk(index + 1, voice, speechRate);
      }
    };

    audio.onerror = (e) => {
      console.error("[useSpeech] Audio element error:", e);
      URL.revokeObjectURL(objectUrl);
      destroyAudioEl();
      releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
      clearMediaSession();
      setIsPlaying(false);
      setIsPaused(false);
    };

    try {
      await audio.play();
    } catch (playErr) {
      console.error("[useSpeech] audio.play() failed:", playErr);
    }
  }, [fetchChunkAudio, destroyAudioEl]);

  // ── Start full speech playback ─────────────────────────────────────────────
  const startSpeech = useCallback(async (textToSpeak, voiceName, speechRate) => {
    stopRequestedRef.current = false;
    destroyAudioEl();

    const chunks = splitIntoChunks(textToSpeak);
    chunksRef.current = chunks;
    currentTextRef.current = textToSpeak;
    currentVoiceRef.current = voiceName;
    currentRateRef.current = speechRate;

    console.log(`[useSpeech] Starting Cloud TTS — ${chunks.length} chunks, voice: ${voiceName}`);

    setIsPlaying(true);
    setIsPaused(false);

    // Request wake lock (belt + suspenders — real <audio> already keeps screen alive)
    requestWakeLock().then((lock) => { wakeLockRef.current = lock; });

    // Register with Android media system
    setMediaSessionPlaying(textToSpeak.slice(0, 60), {
      play: () => {
        if (audioElRef.current && isPausedRef.current) {
          audioElRef.current.play().catch(() => {});
          setIsPaused(false);
          setMediaSessionPlaying(currentTextRef.current.slice(0, 60), null);
        }
      },
      pause: () => {
        if (audioElRef.current) {
          audioElRef.current.pause();
          setIsPaused(true);
          setMediaSessionPaused();
        }
      },
      stop: () => { stopSpeech(); },
    });

    // Start playing from chunk 0
    await playChunk(0, voiceName, speechRate);
  }, [destroyAudioEl, playChunk, stopSpeech]);

  // ── handleSpeakToggle ──────────────────────────────────────────────────────
  const handleSpeakToggle = useCallback((textToSpeak) => {
    if (!textToSpeak) return;

    if (isPlaying && !isPaused) {
      // Pause
      if (audioElRef.current) {
        audioElRef.current.pause();
        setIsPaused(true);
        setMediaSessionPaused();
      }
      return;
    }

    if (isPlaying && isPaused) {
      // Resume
      if (audioElRef.current) {
        audioElRef.current.play().catch(() => {});
        setIsPaused(false);
        setMediaSessionPlaying(currentTextRef.current.slice(0, 60), null);
      }
      return;
    }

    // Start fresh
    startSpeech(textToSpeak, selectedVoice, rate);
  }, [isPlaying, isPaused, selectedVoice, rate, startSpeech]);

  // ── handleVoiceChange ──────────────────────────────────────────────────────
  const handleVoiceChange = useCallback((voiceName, currentText) => {
    setSelectedVoice(voiceName);
    localStorage.setItem("vocalize_selected_voice", voiceName);
    if (isPlaying && currentText) {
      stopSpeech();
      setTimeout(() => startSpeech(currentText, voiceName, rate), 100);
    }
  }, [isPlaying, rate, stopSpeech, startSpeech]);

  // ── handleRateChange ───────────────────────────────────────────────────────
  const handleRateChange = useCallback((newRate, currentText) => {
    setRate(newRate);
    localStorage.setItem("vocalize_speech_rate", newRate.toString());
    if (isPlaying && currentText) {
      stopSpeech();
      setTimeout(() => startSpeech(currentText, selectedVoice, newRate), 100);
    }
  }, [isPlaying, selectedVoice, stopSpeech, startSpeech]);

  // ── Teardown on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      destroyAudioEl();
      releaseWakeLock(wakeLockRef.current).then(() => { wakeLockRef.current = null; });
      clearMediaSession();
    };
  }, [destroyAudioEl]);

  // ── Download MP3 ───────────────────────────────────────────────────────────
  const downloadMP3 = useCallback(async (textToSpeak) => {
    setIsDownloading(true);
    try {
      const chunks = splitIntoChunks(textToSpeak);
      const synthesizeSpeech = getSynthesizeFn();
      
      const base64Chunks = [];
      for (let i = 0; i < chunks.length; i++) {
        const result = await synthesizeSpeech({
          text: chunks[i],
          voiceName: selectedVoice,
          speakingRate: rate,
        });
        base64Chunks.push(result.data.audioBase64);
      }

      const binaryBlobs = base64Chunks.map(b => {
        const binary = atob(b);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: "audio/mpeg" });
      });
      const finalBlob = new Blob(binaryBlobs, { type: "audio/mpeg" });
      
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      
      // Create a formatted date-time string (e.g., 2026-07-10_14-30-45)
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      
      a.download = `ListenBetter_${dateStr}_${timeStr}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[useSpeech] Failed to download MP3:", e);
      alert("Failed to download MP3. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [getSynthesizeFn, selectedVoice, rate]);

  // Cloud TTS provides its own voices — expose a small curated list
  // so the TTSPlayer voice selector works
  const voices = [
    { name: "en-US-Neural2-J", lang: "en-US", label: "Neural2 — Male (US)" },
    { name: "en-US-Neural2-F", lang: "en-US", label: "Neural2 — Female (US)" },
    { name: "en-US-Neural2-D", lang: "en-US", label: "Neural2 — Male 2 (US)" },
    { name: "en-US-Neural2-E", lang: "en-US", label: "Neural2 — Female 2 (US)" },
    { name: "en-GB-Neural2-B", lang: "en-GB", label: "Neural2 — Male (UK)" },
    { name: "en-GB-Neural2-A", lang: "en-GB", label: "Neural2 — Female (UK)" },
    { name: "en-AU-Neural2-B", lang: "en-AU", label: "Neural2 — Male (AU)" },
    { name: "en-AU-Neural2-A", lang: "en-AU", label: "Neural2 — Female (AU)" },
  ];

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
    downloadMP3,
    isDownloading,
  };
}
