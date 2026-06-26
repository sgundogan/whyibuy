"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FollowupQuestion } from "@/hooks/useVoiceBrain";
import { useLang, type Lang } from "@/lib/useLang";

/**
 * Contextual follow-up chips shown below the chart while a scene is active.
 *
 * Behavior:
 * - Fade in 800ms after the scene mounts (so they don't compete with the
 *   chart's own entrance animation).
 * - Stay visible the whole time the scene is on screen — the agent is usually
 *   talking through scenes, and waiting for total silence means chips rarely
 *   appear at all.
 * - Click sends the question via the same flow as landing chips.
 *
 * Visual rules:
 * - Smaller than the landing chip so they read as "supporting suggestions",
 *   not "primary CTAs".
 * - Horizontal row, wraps on small screens.
 * - Warm-gold palette matches the rest of the system.
 *
 * Positioning is the parent's job (SceneOrchestrator places this below the
 * chart, above the mini-orb).
 */

interface Props {
  followups: FollowupQuestion[] | undefined;
  /**
   * Conversation language override. When provided, followups are filtered to
   * this language regardless of the browser locale — this is how an English
   * speaker on a Turkish browser still sees English follow-up chips once the
   * agent has detected the language and started replying in English.
   */
  activeLang?: Lang;
  onSelect: (q: FollowupQuestion) => void;
}

const REVEAL_DELAY_MS = 250;

export function FollowupChips({ followups, activeLang, onSelect }: Props) {
  const browserLang = useLang();
  const lang = activeLang ?? browserLang;
  // Filter to match the page's detected language. If no follow-ups match
  // (some scenes only have one language defined), fall back to whatever
  // exists so the user still gets continuation options.
  const visible = useMemo(() => {
    if (!followups || followups.length === 0) return [];
    const matching = followups.filter((q) => q.lang === lang);
    return matching.length > 0 ? matching : followups;
  }, [followups, lang]);

  const [revealed, setRevealed] = useState(false);
  // selectedIdx tracks which chip the user just tapped so we can render its
  // active state (yellow border + bright text) IMMEDIATELY on click. The
  // selection PERSISTS until the topic genuinely changes (new scene fires)
  // because that's when we know the agent has moved on. Other chips stay
  // fully clickable in the meantime — the user can switch follow-ups at any
  // moment, and clicking another chip just transfers the selection to it.
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reveal once on mount; re-reveal when the scene changes (visible array
  // reference shifts because the parent passes a new scene's followups).
  // Scene change also clears the previous selection — new topic, new state.
  useEffect(() => {
    setRevealed(false);
    setSelectedIdx(null);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [visible]);

  const handleClick = (q: FollowupQuestion, idx: number) => {
    // Update the selected index in this paint frame (visual feedback <16ms),
    // then fire the parent's onSelect to send the message to the agent. No
    // disabled state, no timeout — clicking another chip just retargets the
    // selection.
    setSelectedIdx(idx);
    onSelect(q);
  };

  if (visible.length === 0) return null;

  return (
    <AnimatePresence>
      {revealed && (
        <motion.div
          key="followups"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="
            flex flex-col md:flex-row md:flex-wrap
            items-start md:items-center justify-start
            gap-2 md:gap-2
          "
          aria-label="Follow-up questions"
        >
          {visible.slice(0, 3).map((q, i) => {
            const isSelected = selectedIdx === i;
            return (
              <motion.button
                key={`${q.text}-${i}`}
                type="button"
                onClick={() => handleClick(q, i)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.08,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{
                  y: -1,
                  color: "#d4c4a0",
                  background: "rgba(200, 160, 80, 0.08)",
                  borderColor: "rgba(200, 160, 80, 0.38)",
                  transition: { duration: 0.18, ease: "easeOut" },
                }}
                whileTap={{ scale: 0.97 }}
                className="
                  px-2.5 py-1 md:px-3 md:py-1.5
                  rounded-full
                  text-[10.5px] md:text-[11px]
                  font-normal
                  cursor-pointer
                  transition-colors duration-200
                "
                style={{
                  // Active = warm gold border + bright text. Stays selected
                  // until the scene changes; other chips remain clickable so
                  // the user can switch follow-ups freely at any moment.
                  color: isSelected ? "#d4c4a0" : "#807260",
                  background: isSelected
                    ? "rgba(200, 160, 80, 0.12)"
                    : "rgba(200, 160, 80, 0.025)",
                  border: isSelected
                    ? "1px solid #c8a050"
                    : "1px solid rgba(200, 160, 80, 0.14)",
                  letterSpacing: "0",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  whiteSpace: "nowrap",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(200, 160, 80, 0.10)"
                    : "none",
                }}
                aria-label={`Follow-up: ${q.text}`}
                aria-pressed={isSelected}
              >
                {q.text}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
