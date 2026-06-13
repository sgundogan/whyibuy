"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceOrb } from "./VoiceOrb";
import { StockBadge } from "./StockBadge";
import { SuggestedQuestions, type SuggestedQuestion } from "./SuggestedQuestions";
import { SceneOrchestrator } from "./scenes/SceneOrchestrator";
import { useVoiceBrain } from "@/hooks/useVoiceBrain";
import type { ActiveScene, SceneData } from "@/hooks/useVoiceBrain";
import { SCENE_REGISTRY } from "@/lib/scenes-data";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// DEV ONLY: dev buttons that fire scenes without a voice call. Toggle by setting
// NEXT_PUBLIC_DEV_SCENE_BUTTONS=true in .env.local. Off by default — the voice
// agent triggers scenes in production.
const DEV_TEST =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_SCENE_BUTTONS === "true";

const SAMPLE_SCENES: { id: string; label: string; scene: SceneData }[] = Object.entries(
  SCENE_REGISTRY,
).map(([id, scene]) => ({ id, label: id, scene }));

// Match the scene exit duration in SceneOrchestrator so the orb's layout shift
// starts only after the scene has finished fading out. Without this delay both
// animations run simultaneously and visually fight each other.
const SCENE_EXIT_MS = 200;

export function VoiceScreen() {
  const [hasEnded, setHasEnded] = useState(false);
  const [devScene, setDevScene] = useState<ActiveScene>(null);
  const [devLabel, setDevLabel] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const {
    orbState,
    activeStock,
    activeScene: liveScene,
    errorMessage,
    isConnected,
    startConversation,
    endConversation,
    getAmplitude,
    sendUserMessage,
  } = useVoiceBrain();

  // Once the user interacts (taps orb or picks a suggested question), hide the
  // suggestion chips for the rest of this session. They're training wheels —
  // not permanent UI.
  const [hasInteracted, setHasInteracted] = useState(false);

  // Queue a chip-selected question and flush once the conversation is
  // connected. The SDK queues internally too, but tracking it explicitly here
  // lets us debounce double-clicks and keeps the flush deterministic across
  // the WebRTC handshake.
  const queuedQuestionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    const q = queuedQuestionRef.current;
    if (!q) return;
    queuedQuestionRef.current = null;
    sendUserMessage(q);
  }, [isConnected, sendUserMessage]);

  const handleSuggestedSelect = async (q: SuggestedQuestion) => {
    setHasInteracted(true);
    if (isConnected) {
      sendUserMessage(q.text);
      return;
    }
    // Not connected yet — queue the message and kick off the session. The
    // useEffect above flushes once isConnected flips true.
    queuedQuestionRef.current = q.text;
    setHasEnded(false);
    await startConversation();
  };

  const activeScene = devScene ?? liveScene;
  const sceneActive = activeScene !== null;

  // The orb's layout state lags behind sceneActive on the way out, so the scene
  // can finish its fade-out before the orb starts moving / resizing. On the way
  // in (scene appearing) we flip immediately so the orb shrinks alongside the
  // chart's entrance.
  const [orbInSceneMode, setOrbInSceneMode] = useState(sceneActive);
  useEffect(() => {
    if (sceneActive) {
      setOrbInSceneMode(true);
      return;
    }
    const t = setTimeout(() => setOrbInSceneMode(false), SCENE_EXIT_MS);
    return () => clearTimeout(t);
  }, [sceneActive]);

  const handleOrbClick = async () => {
    setHasInteracted(true);
    if (isConnected) {
      await endConversation();
      setHasEnded(true);
    } else {
      setHasEnded(false);
      await startConversation();
    }
  };

  // Scene now persists during conversation until the AI calls show_scene with a
  // different topic (or the conversation ends). The orb sits below the chart so
  // the user can still tap it — there's no need to auto-dismiss on user speech.

  const showHint = !isConnected && orbState !== "thinking";

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pt-32 pb-8 max-md:pt-24 max-md:pb-6">
      {/* Stock badge only renders for the *active* stock during a live conversation.
          The landing-state "all stocks" logo row is hidden: it was competing with
          the suggested-question chip for "what is this product about" attention.
          The rotating chip names each company in its sentence ("Bana Tempus AI'yi
          anlat", "Why did you invest in Palantir?") so scope still reads cleanly. */}
      {!sceneActive && activeStock && (
        <StockBadge stock={activeStock} isConnected={isConnected} />
      )}

      {/* Scene appears when active. Smooth crossfade between scenes and to/from idle. */}
      <AnimatePresence mode="wait">
        {sceneActive && (
          <motion.div
            key="scene"
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: SCENE_EXIT_MS / 1000, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <SceneOrchestrator activeScene={activeScene} isMobile={isMobile} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb. orbInSceneMode lags behind sceneActive so the scene can fade out
          first, then the orb smoothly grows + slides to center without competing
          animations. Suggested-question chip lives ABOVE the orb when idle, so
          it reads like a soft headline that frames what the visitor can ask. */}
      <motion.div
        layout
        className={
          orbInSceneMode
            ? "absolute bottom-24 left-1/2 -translate-x-1/2 max-md:bottom-20"
            : "flex flex-col items-center"
        }
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <SuggestedQuestions
          onSelect={handleSuggestedSelect}
          hidden={orbInSceneMode || hasInteracted || isConnected}
        />
        <VoiceOrb
          state={orbState}
          onClick={handleOrbClick}
          getAmplitude={isConnected ? getAmplitude : undefined}
          isConnected={isConnected}
          miniMode={orbInSceneMode}
        />
        <AnimatePresence>
          {!orbInSceneMode && showHint && orbState !== "error" && (
            <motion.p
              key="hint"
              className="mt-7 text-[11px] text-[#8a7c68] tracking-[2.5px] uppercase font-light text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              {hasEnded ? (
                <>
                  <span className="text-[#706860]">conversation ended.</span>
                  <br />
                  tap to talk
                </>
              ) : (
                "tap to talk"
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {errorMessage && !isConnected && (
        <p className="mt-6 text-[12px] text-[#665040] text-center max-w-[260px]">
          {errorMessage}
        </p>
      )}

      {/* DEV: Chart test buttons — only visible in development */}
      {DEV_TEST && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap gap-1.5 z-50 max-w-[90vw] justify-center">
          {SAMPLE_SCENES.map(({ id, label, scene }) => (
            <button
              key={id}
              onClick={() => {
                if (devLabel === id) {
                  setDevScene(null);
                  setDevLabel(null);
                } else {
                  setDevScene(scene);
                  setDevLabel(id);
                }
              }}
              className="px-2 py-1 text-[9px] tracking-[0.5px] rounded-full border cursor-pointer transition-colors"
              style={{
                background: devLabel === id ? "rgba(200, 160, 60, 0.2)" : "rgba(255,255,255,0.05)",
                borderColor: devLabel === id ? "rgba(200, 160, 60, 0.4)" : "rgba(255,255,255,0.1)",
                color: devLabel === id ? "#c8a050" : "#706050",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
