"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStock, type Stock } from "@/lib/stocks";

/**
 * iOS Safari audio unlock strategy:
 *
 * Problem: The ElevenLabs SDK creates its AudioContext AFTER the user's tap
 * gesture expires (after fetch + WebSocket + getUserMedia). The greeting
 * audio arrives immediately but the AudioContext is suspended, so it's silent.
 *
 * Solution (two layers):
 *
 * 1. AUDIO SESSION UNLOCK: On the orb tap, we create an AudioContext, play
 *    a silent buffer, and keep it alive. On iOS, once ANY AudioContext has
 *    successfully played audio during a user gesture, the entire page's
 *    "audio session" is unlocked — new AudioContexts can also play.
 *
 * 2. CONSTRUCTOR PATCH: We patch the global AudioContext constructor to
 *    auto-resume and to track every instance. After the SDK connects, we
 *    poll all tracked contexts to ensure they're running.
 */

// Shared state for audio unlock
const trackedContexts: AudioContext[] = [];
let audioSessionUnlocked = false;
let unlockContext: AudioContext | null = null;

function patchAudioContextForMobile() {
  if (typeof window === "undefined") return;
  if ((window as any).__audioPatchApplied) return;
  (window as any).__audioPatchApplied = true;

  const OrigAudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!OrigAudioContext) return;

  // Store original so we can create real contexts
  (window as any).__OrigAudioContext = OrigAudioContext;

  const PatchedAudioContext = function (
    this: AudioContext,
    ...args: any[]
  ): AudioContext {
    const ctx = new OrigAudioContext(...args);
    trackedContexts.push(ctx);
    // If audio session is unlocked, auto-resume
    if (audioSessionUnlocked && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } as any;

  PatchedAudioContext.prototype = OrigAudioContext.prototype;
  Object.defineProperty(PatchedAudioContext, "name", {
    value: "AudioContext",
  });

  window.AudioContext = PatchedAudioContext;
  if ((window as any).webkitAudioContext) {
    (window as any).webkitAudioContext = PatchedAudioContext;
  }
}

/**
 * Call this during a user tap to unlock the iOS audio session.
 * Creates an AudioContext, plays silent audio, and keeps it alive.
 * Must be called synchronously from the tap handler (before any await).
 */
function unlockAudioSession() {
  if (audioSessionUnlocked) return;

  const Ctx =
    (window as any).__OrigAudioContext ||
    window.AudioContext ||
    (window as any).webkitAudioContext;
  if (!Ctx) return;

  try {
    const ctx = new Ctx() as AudioContext;
    unlockContext = ctx;
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    ctx.resume().then(() => {
      audioSessionUnlocked = true;
      // Resume any contexts the SDK already created
      resumeAllTrackedContexts();
    }).catch(() => {});
    audioSessionUnlocked = true;
  } catch {
    // Ignore — desktop browsers don't need this
  }
}

/**
 * Resume all tracked AudioContexts. Called after audio session unlock
 * and periodically after connection to catch late-created contexts.
 */
function resumeAllTrackedContexts() {
  for (const ctx of trackedContexts) {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }
}

export type OrbState = "listening" | "thinking" | "speaking" | "error";

export interface CaptionMessage {
  text: string;
  source: "user" | "ai";
  timestamp: number;
}

export function useVoiceBrain() {
  // Apply mobile audio patch once on mount
  useEffect(() => {
    patchAudioContextForMobile();
  }, []);

  const [orbState, setOrbState] = useState<OrbState>("listening");
  const [activeStock, setActiveStock] = useState<Stock | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCaption, setCurrentCaption] = useState<CaptionMessage | null>(null);
  const captionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const conversation = useConversation({
    clientTools: {
      show_stock: (parameters: Record<string, string>) => {
        const ticker = parameters.ticker || parameters.Ticker || "";
        const stock = getStock(ticker);
        if (stock) {
          setActiveStock(stock);
        }
        return "displayed";
      },
    },
    onConnect: () => {
      setOrbState("listening");
      setErrorMessage(null);
    },
    onDisconnect: () => {
      setOrbState("listening");
      setActiveStock(null);
      clearTimeout(captionTimeoutRef.current);
      setCurrentCaption(null);
    },
    onError: (message: string) => {
      console.error("ElevenLabs error:", message);
      setOrbState("error");
      setErrorMessage(message);
    },
    onMessage: ({ message, source }) => {
      if (source === "ai") {
        setOrbState("speaking");
      }

      // Update caption with latest message
      setCurrentCaption({
        text: message,
        source: source === "ai" ? "ai" : "user",
        timestamp: Date.now(),
      });

      // Clear caption after a delay (longer for AI, shorter for user)
      clearTimeout(captionTimeoutRef.current);
      captionTimeoutRef.current = setTimeout(() => {
        setCurrentCaption(null);
      }, source === "ai" ? 8000 : 4000);
    },
  });

  // Map ElevenLabs status to orb state
  const status = conversation.status;
  if (status === "connected" && orbState !== "speaking" && orbState !== "error") {
    if (conversation.isSpeaking) {
      setOrbState("speaking");
    }
  }

  const startConversation = useCallback(async () => {
    setErrorMessage(null);
    setOrbState("thinking");

    // Unlock iOS audio session DURING the tap gesture (before any await)
    unlockAudioSession();

    try {
      const res = await fetch("/api/conversation", { method: "POST" });

      if (res.status === 503) {
        setOrbState("error");
        setErrorMessage("Investing Brain is busy. Try again shortly.");
        return;
      }

      if (res.status === 429) {
        setOrbState("error");
        setErrorMessage("Too many requests. Please wait a moment.");
        return;
      }

      if (!res.ok) {
        setOrbState("error");
        setErrorMessage("Failed to connect. Please try again.");
        return;
      }

      const data = await res.json();
      setSessionId(data.sessionId ?? null);

      // Use WebRTC mode — it uses <audio> HTML elements instead of
      // AudioContext + AudioWorklets. iOS Safari handles <audio autoplay>
      // much better after a user gesture, so the greeting plays reliably.
      await conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: "webrtc" as any,
      });
    } catch (err) {
      console.error("Failed to start:", err);
      setOrbState("error");
      setErrorMessage("Connection failed. Please try again.");
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    setActiveStock(null);

    if (sessionId) {
      fetch("/api/conversation", {
        method: "DELETE",
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
      setSessionId(null);
    }
  }, [conversation, sessionId]);

  const getAmplitude = useCallback(() => {
    return conversation.getInputVolume();
  }, [conversation]);

  return {
    orbState,
    activeStock,
    errorMessage,
    currentCaption,
    isConnected: status === "connected",
    isSpeaking: conversation.isSpeaking,
    startConversation,
    endConversation,
    getAmplitude,
  };
}
