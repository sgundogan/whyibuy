"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStock, type Stock } from "@/lib/stocks";
import { SCENE_REGISTRY } from "@/lib/scenes-data";

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

export type ChartType = "bar" | "line" | "metric" | "donut" | "targets";

export interface DataPoint {
  label: string;
  value: number;
  /**
   * Optional display unit. The chart formatter bakes the unit into the rendered
   * value so labels can stay clean.
   *
   * Examples:
   * - "$M" + 1067 → "$1.07B" (auto-compacts >=1000)
   * - "$M" + 399 → "$399M"
   * - "$B" + 9.3 → "$9.3B"
   * - "$" + 1695 → "$1,695"
   * - "%" + 50 → "50%"
   * - "%" + 0.5 → "50%" (auto-detects ratio form)
   * - "M" + 27.4 → "27.4M"
   * - "K" + 370 → "370K"
   * - "GW" + 3.5 → "3.5 GW"
   * - "PB" + 500 → "500 PB"
   */
  unit?: string;
  highlight?: boolean;
}

export interface FollowupQuestion {
  text: string;
  lang: "tr" | "en";
}

/**
 * One analyst price-target row, rendered by the "targets" scene type.
 * These are ANALYST views (banks / research firms), never Serkan's own target.
 * The agent cites them with attribution, then redirects to the thesis.
 */
export interface TargetRow {
  /** Issuing firm, e.g. "Morgan Stanley", "Goldman Sachs", "Wedbush". */
  firm: string;
  /** Target price in USD. */
  price: number;
  /** Optional rating: "Overweight", "Buy", "Hold", etc. */
  rating?: string;
  /** Optional date the target was issued, e.g. "May 2026". */
  date?: string;
  /** Highlight the street-high or most notable target. */
  highlight?: boolean;
}

export interface SceneData {
  chart_type: ChartType;
  title: string;
  /**
   * Numeric data points for bar/line/metric/donut charts. Optional because the
   * "targets" scene type uses `targets` instead.
   */
  data?: DataPoint[];
  /**
   * Analyst price-target rows for the "targets" scene type. The TargetTable
   * component computes the consensus + range from these rows automatically.
   */
  targets?: TargetRow[];
  annotation?: string;
  source?: string;
  /**
   * Optional follow-up question chips shown below the chart, above the mini-orb.
   * Fade in ~1.5s after the agent stops speaking; hide instantly if the user
   * starts speaking. Clicking sends the text as a user_message (same flow as
   * landing chips). Keep 2-3 per scene — more crowds the chart.
   */
  followups?: FollowupQuestion[];
}

export type ActiveScene = SceneData | null;

// Backwards-compat alias for legacy ElevenLabs scene_ids.
// New scene_ids follow TICKER_TOPIC convention (see lib/scenes-data.ts).
const LEGACY_SCENE_ALIASES: Record<string, string> = {
  RevenueGrowth: "PLTR_revenue",
  ValuationCase: "PLTR_metrics",
  StockPrice: "PLTR_stock",
  MoatDiagram: "PLTR_moat",
};

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
  const [activeScene, setActiveScene] = useState<ActiveScene>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCaption, setCurrentCaption] = useState<CaptionMessage | null>(null);
  const captionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sceneDismissRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isConnectedRef = useRef(false);
  // Promise that resolves once the previous session has fully torn down at
  // the SDK level. Held while endSession() is in flight so a quick "tap
  // chip after ending" can wait for the WebRTC/LiveKit room to close before
  // opening a new one. Without this gate, the new session inherits stale
  // state from the old one and the agent's first_message can replay.
  const endingRef = useRef<Promise<unknown> | null>(null);

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
      show_scene: (parameters: Record<string, string>) => {
        if (!isConnectedRef.current) return "not connected";
        try {
          const rawSceneId = parameters.scene_id || parameters.sceneId || "";
          const sceneId = LEGACY_SCENE_ALIASES[rawSceneId] ?? rawSceneId;
          const registeredScene = SCENE_REGISTRY[sceneId];

          let scene: SceneData;

          if (registeredScene) {
            scene = registeredScene;
          } else {
            const chartType = parameters.chart_type || parameters.chartType || "bar";
            const title = parameters.title || "Data";
            const annotation = parameters.annotation || "";
            const source = parameters.source || "";

            let data: DataPoint[] = [];
            const rawData = parameters.data || "[]";
            try {
              data = JSON.parse(rawData);
            } catch {
              return "invalid data format";
            }

            if (!data.length) return "no data";

            scene = { chart_type: chartType as ChartType, title, data, annotation, source };
          }

          setActiveScene(scene);
          // No auto-dismiss timer. Scene persists until:
          //   (a) the AI calls show_scene again with a new topic, or
          //   (b) the conversation ends.
          // This matches the "topic, not time" model — the chart stays visible
          // for follow-up questions on the same topic.
          clearTimeout(sceneDismissRef.current);
          return "displayed";
        } catch {
          return "error displaying scene";
        }
      },
    },
    onConnect: () => {
      isConnectedRef.current = true;
      setOrbState("listening");
      setErrorMessage(null);
    },
    onDisconnect: () => {
      isConnectedRef.current = false;
      setOrbState("listening");
      setActiveStock(null);
      setActiveScene(null);
      clearTimeout(captionTimeoutRef.current);
      clearTimeout(sceneDismissRef.current);
      setCurrentCaption(null);
    },
    onError: (message: string) => {
      console.error("[ElevenLabs] error:", message);
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

  const startConversation = useCallback(
    async (options?: { skipGreeting?: boolean }) => {
      setErrorMessage(null);
      setOrbState("thinking");

      // Unlock iOS audio session DURING the tap gesture (before any await)
      unlockAudioSession();

      // If the previous session is still tearing down, wait for it. Without
      // this gate the new session can pick up stale audio buffers from the
      // old one — symptom: agent says "Mer…" (the previous first_message)
      // before answering the user's new question. Cap the wait at 1.2s so
      // a stuck teardown doesn't block forever.
      if (endingRef.current) {
        await Promise.race([
          endingRef.current,
          new Promise((r) => setTimeout(r, 1200)),
        ]);
      }

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

        // skipGreeting is honored ONLY when the ElevenLabs agent has
        // "Override first message" enabled in its Security settings. Without
        // that toggle, the SDK throws NotSupportedError, and once it fails
        // the SDK won't accept a retry in the same tick. So we treat the
        // option as a permission the agent has either granted or not — there
        // is no fallback path that works reliably.
        const sessionConfig: Parameters<typeof conversation.startSession>[0] = {
          agentId: data.agentId,
          connectionType: "webrtc" as any,
          ...(options?.skipGreeting
            ? { overrides: { agent: { firstMessage: "" } } }
            : {}),
        };

        // Use WebRTC mode — it uses <audio> HTML elements instead of
        // AudioContext + AudioWorklets. iOS Safari handles <audio autoplay>
        // much better after a user gesture, so the greeting plays reliably.
        // WebRTC requires agentId (not signedUrl) to fetch a conversation token.
        await conversation.startSession(sessionConfig);
      } catch (err) {
        console.error("[VoiceBrain] startConversation failed:", err);
        setOrbState("error");
        setErrorMessage("Connection failed. Please try again.");
      }
    },
    [conversation],
  );

  const endConversation = useCallback(async () => {
    // OPTIMISTIC UI RESET — snap the user back to home immediately. The SDK
    // teardown takes ~500-1000ms (WebRTC close + LiveKit room leave). If we
    // await it first the user stares at the scene while the orb does nothing.
    // Instead: clear UI state synchronously, fire the SDK cleanup in the
    // background, and trust onDisconnect to flip isConnected when ready.
    setActiveStock(null);
    setActiveScene(null);
    setOrbState("listening");
    setErrorMessage(null);
    setCurrentCaption(null);
    clearTimeout(sceneDismissRef.current);
    clearTimeout(captionTimeoutRef.current);
    isConnectedRef.current = false;

    // Track the teardown so startConversation can wait if the user immediately
    // tries to start a new session. Without this gate, the new startSession
    // fires while the old WebRTC/LiveKit room is still leaving, which lets
    // the old session's first_message audio buffer ("Merhaba…") bleed into
    // the new connection before the queued user_message overrides it.
    endingRef.current = conversation
      .endSession()
      .catch((err) => {
        console.warn("[VoiceBrain] endSession error (already cleaned up):", err);
      })
      .finally(() => {
        endingRef.current = null;
      });

    if (sessionId) {
      fetch("/api/conversation", {
        method: "DELETE",
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
      setSessionId(null);
    }
  }, [conversation, sessionId]);

  const dismissScene = useCallback(() => {
    setActiveScene(null);
    clearTimeout(sceneDismissRef.current);
  }, []);

  const getAmplitude = useCallback(() => {
    return conversation.getInputVolume();
  }, [conversation]);

  /**
   * Send a text user message into the live conversation. Used by suggested
   * question chips so a tap behaves identically to the user speaking the
   * phrase out loud. Safe to call before the session is fully connected —
   * the ElevenLabs SDK queues the message until the WebRTC channel is ready.
   */
  const sendUserMessage = useCallback(
    (text: string) => {
      conversation.sendUserMessage(text);
    },
    [conversation],
  );

  /**
   * Signal that the user is actively interacting. Required in voice-mode
   * conversations to wake the agent before it accepts text input — without
   * this, the agent stays in "waiting for audio" state and silently drops
   * user_message text events.
   */
  const sendUserActivity = useCallback(() => {
    // The SDK method may exist depending on version; cast through unknown to
    // avoid hard-coupling to a specific @11labs/react version.
    const fn = (conversation as unknown as { sendUserActivity?: () => void })
      .sendUserActivity;
    if (typeof fn === "function") {
      fn.call(conversation);
    } else {
      console.warn("[VoiceBrain] sendUserActivity not available on SDK");
    }
  }, [conversation]);

  return {
    orbState,
    activeStock,
    activeScene,
    errorMessage,
    currentCaption,
    isConnected: status === "connected",
    isSpeaking: conversation.isSpeaking,
    startConversation,
    endConversation,
    dismissScene,
    getAmplitude,
    sendUserMessage,
    sendUserActivity,
  };
}
