"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useRef, useState } from "react";
import { getStock, type Stock } from "@/lib/stocks";

export type OrbState = "listening" | "thinking" | "speaking" | "error";

export interface CaptionMessage {
  text: string;
  source: "user" | "ai";
  timestamp: number;
}

export function useVoiceBrain() {
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

    try {
      // Pre-unlock audio on mobile browsers (iOS Safari requires user gesture)
      // This must happen synchronously within the tap handler, before any await
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      // Play a silent buffer to fully unlock audio playback
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);

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

      await conversation.startSession({ signedUrl: data.signedUrl });
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
