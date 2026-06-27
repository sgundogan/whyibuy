"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceOrb } from "./VoiceOrb";
import { StockBadge } from "./StockBadge";
import { Wordmark } from "./Wordmark";
import { SuggestedQuestions, type SuggestedQuestion } from "./SuggestedQuestions";
import { FollowupChips } from "./FollowupChips";
import { SceneOrchestrator } from "./scenes/SceneOrchestrator";
import { useVoiceBrain } from "@/hooks/useVoiceBrain";
import type { ActiveScene, FollowupQuestion, SceneData } from "@/hooks/useVoiceBrain";
import { SCENE_REGISTRY } from "@/lib/scenes-data";
import { useLang, detectLang, type Lang } from "@/lib/useLang";
import { track } from "@/lib/analytics";

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
    isSpeaking,
    currentCaption,
    startConversation,
    endConversation,
    getAmplitude,
    sendUserMessage,
    sendUserActivity,
  } = useVoiceBrain();

  // activeLang tracks the language the conversation is actually happening in.
  // Initialized from browser locale, but updated as the agent speaks: a
  // Turkish reply switches everything to TR followups; an English reply
  // switches to EN. No more mixed-language chip rows mid-conversation.
  const browserLang = useLang();
  const [activeLang, setActiveLang] = useState<Lang>(browserLang);
  useEffect(() => {
    setActiveLang(browserLang);
  }, [browserLang]);
  useEffect(() => {
    if (!currentCaption || currentCaption.source !== "ai") return;
    const detected = detectLang(currentCaption.text);
    if (detected && detected !== activeLang) {
      setActiveLang(detected);
    }
  }, [currentCaption, activeLang]);

  const handleFollowupSelect = (q: FollowupQuestion) => {
    track("question_card_click", { source: "followup", question_text: q.text, lang: q.lang });
    if (isConnected) sendUserMessage(q.text);
  };

  // Queue a chip-selected question and flush once the conversation is
  // connected. The SDK queues internally too, but tracking it explicitly here
  // lets us debounce double-clicks and keeps the flush deterministic across
  // the WebRTC handshake.
  const queuedQuestionRef = useRef<string | null>(null);

  // landingSessionKey is bumped every time a conversation ends. We pass it
  // as the React `key` on <SuggestedQuestions />, which forces the component
  // to remount fresh — new shuffled order, new random starting index — so
  // the user never sees the same chip they just clicked staring back at them.
  const [landingSessionKey, setLandingSessionKey] = useState(0);
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (wasConnectedRef.current && !isConnected) {
      setLandingSessionKey((k) => k + 1);
    }
    if (!wasConnectedRef.current && isConnected) {
      track("voice_connected");
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected]);


  // Stash the SDK methods in refs so the flush effect only re-runs when
  // isConnected actually changes — not on every re-render (which is what was
  // causing the [VoiceScreen] isConnected -> true / no queued question log
  // spam in the console).
  const sendUserActivityRef = useRef(sendUserActivity);
  const sendUserMessageRef = useRef(sendUserMessage);
  useEffect(() => {
    sendUserActivityRef.current = sendUserActivity;
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserActivity, sendUserMessage]);

  useEffect(() => {
    if (!isConnected) return;
    const q = queuedQuestionRef.current;
    if (!q) return;
    // Wake the agent with user_activity FIRST so it leaves the "waiting for
    // audio" state, then send the text via user_message. Without the wake
    // signal, the agent silently drops text input in voice mode.
    //
    // Aggressive timings — tested as the minimum that still works reliably:
    //   t=0    onConnect fires
    //   t=80   send user_activity (data channel is ready by this point)
    //   t=200  send user_message (120ms after wake)
    //
    // Total pre-send latency from connect: 200ms (was 600ms).
    const wakeTimer = setTimeout(() => {
      sendUserActivityRef.current();
    }, 80);
    const sendTimer = setTimeout(() => {
      if (!queuedQuestionRef.current) return;
      const text = queuedQuestionRef.current;
      queuedQuestionRef.current = null;
      sendUserMessageRef.current(text);
    }, 200);
    return () => {
      clearTimeout(wakeTimer);
      clearTimeout(sendTimer);
    };
  }, [isConnected]);

  const handleSuggestedSelect = async (q: SuggestedQuestion) => {
    track("question_card_click", {
      source: "landing",
      question_text: q.text,
      lang: q.lang,
      ticker: q.ticker,
    });
    if (isConnected) {
      sendUserMessage(q.text);
      return;
    }
    // Guard against double-clicks while an earlier start is still in flight.
    // orbState === "thinking" means startConversation hasn't returned yet, so
    // we just update the queued message and let the in-flight call finish.
    if (orbState === "thinking") {
      queuedQuestionRef.current = q.text;
      return;
    }
    // Not connected yet — queue the message and kick off the session. The
    // useEffect above flushes the queued message once isConnected flips true.
    //
    // skipGreeting is gated on NEXT_PUBLIC_SKIP_GREETING because suppressing
    // the agent's first_message requires "Override first message" to be
    // enabled in the ElevenLabs agent's Security settings. Without that
    // toggle, the SDK throws NotSupportedError and the click silently fails.
    // Enable the env var only after flipping the dashboard setting on.
    const skipGreeting =
      process.env.NEXT_PUBLIC_SKIP_GREETING === "true";
    queuedQuestionRef.current = q.text;
    setHasEnded(false);
    await startConversation({ skipGreeting });
  };

  const activeScene = devScene ?? liveScene;
  const sceneActive = activeScene !== null;


  const handleOrbClick = async () => {
    if (isConnected) {
      await endConversation();
      setHasEnded(true);
    } else {
      track("voice_start");
      setHasEnded(false);
      await startConversation();
    }
  };

  // scene_shown: fire once per distinct scene that renders (skip repeats and
  // the null→null no-op). Tracks which charts users actually reach.
  const lastSceneRef = useRef<string | null>(null);
  useEffect(() => {
    const title = activeScene?.title ?? null;
    if (title && title !== lastSceneRef.current) {
      track("scene_shown", { scene: title });
    }
    lastSceneRef.current = title;
  }, [activeScene]);


  // Scene now persists during conversation until the AI calls show_scene with a
  // different topic (or the conversation ends). The orb sits below the chart so
  // the user can still tap it — there's no need to auto-dismiss on user speech.

  const showHint = !isConnected && orbState !== "thinking";

  // Tagline shows only on the true landing state — no scene, no active call.
  // The moment a chart mounts or the conversation connects, it fades out so
  // the screen reads as "in conversation" instead of "on landing".
  const showTagline = !sceneActive && !isConnected;

  // Two completely different layouts so scene mode and landing mode never
  // share positioning logic:
  // - Landing: a centered flex column (wordmark above orb naturally).
  // - Scene: THREE hard zones that physically cannot overlap —
  //     1. Wordmark, fixed at the top (its own component handles position)
  //     2. A bounded, scrollable content window (chart + chips together) that
  //        lives strictly BETWEEN the wordmark and the orb. If the chart is
  //        tall, the window scrolls internally; it never bleeds into either.
  //     3. Orb, absolutely pinned at the bottom.
  //   Because the content window has explicit top/bottom insets, overlap is
  //   mathematically impossible regardless of chart height or viewport size.

  return (
    <div className="flex-1 relative overflow-hidden">
      <Wordmark showTagline={showTagline} />

      {sceneActive ? (
        /* ─── SCENE MODE ─── four stacked zones that cannot overlap ─── */
        <>
          {/* ZONE 2+3: Chart + its follow-up questions as ONE tight group,
              vertically centered in the viewport. They used to be separate
              absolutely-positioned zones (chart pinned high, chip bar pinned
              low), leaving a dead band of negative space between related
              elements. Now the chips render directly beneath the chart in the
              same column, and `my-auto` centers the whole group between the
              locked brand header (top) and the orb (bottom) — metrics and
              query prompts visible together on one screen, no scroll.

              `my-auto` is the scroll-safe way to center: when a scene is tall
              enough to overflow (e.g. the full analyst-target table), the auto
              margins collapse to 0 and the container scrolls from the top,
              carrying the chips with it — nothing clipped, nothing orphaned.
              Universal across all scenes since every scene flows through here. */}
          <div
            className="
              absolute inset-x-0 z-20 overflow-y-auto
              flex flex-col items-center justify-start
              top-[120px] bottom-[120px]
              max-md:top-[104px] max-md:bottom-[118px]
              px-8 max-md:px-5
            "
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene?.title}
                className="w-full max-w-[640px] flex flex-col items-center my-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: SCENE_EXIT_MS / 1000, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <SceneOrchestrator activeScene={activeScene} isMobile={isMobile} />
                {activeScene?.followups && (
                  <div className="w-full mt-4 max-md:mt-2 flex justify-start">
                    <FollowupChips
                      followups={activeScene.followups}
                      activeLang={activeLang}
                      onSelect={handleFollowupSelect}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ZONE 4: Orb, pinned at the very bottom. */}
          <motion.div
            layout
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 max-md:bottom-10"
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <VoiceOrb
              state={orbState}
              onClick={handleOrbClick}
              getAmplitude={isConnected ? getAmplitude : undefined}
              isConnected={isConnected}
              miniMode={true}
            />
          </motion.div>
        </>
      ) : (
        /* ─── LANDING MODE ─── */
        /* The {card, orb, hint} stack centers vertically in the region below
           the wordmark. Mobile top reserve is 180px (was 150): the dynamic
           viewport (dvh) is shorter than 100vh, so on a phone the centered
           stack used to bleed UP and the deck card + its warm halo overlapped
           the "Talk to my investing thesis" tagline. The larger reserve pushes
           the stack down enough to clear the tagline AND its glow; the mobile
           orb is trimmed (see VoiceOrb) so the down-shift doesn't clip the orb
           or hint at the bottom. Desktop is unchanged (top-170, tall enough). */
        <div className="absolute inset-x-0 top-[170px] bottom-0 flex flex-col items-center justify-center px-4 max-md:top-[180px]">
          {activeStock && <StockBadge stock={activeStock} isConnected={isConnected} />}
          <div className="flex flex-col items-center">
            <SuggestedQuestions
              key={landingSessionKey}
              onSelect={handleSuggestedSelect}
              hidden={isConnected}
            />
            <VoiceOrb
              state={orbState}
              onClick={handleOrbClick}
              getAmplitude={isConnected ? getAmplitude : undefined}
              isConnected={isConnected}
              miniMode={false}
            />
            <AnimatePresence>
              {showHint && orbState !== "error" && (
                <motion.p
                  key="hint"
                  className="mt-7 text-[12px] text-[#8a7c68] tracking-[0.2px] font-light text-center"
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
            {errorMessage && !isConnected && (
              <p className="mt-6 text-[12px] text-[#665040] text-center max-w-[260px]">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
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
