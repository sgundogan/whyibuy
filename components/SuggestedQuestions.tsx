"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Rotating bilingual question chips above the orb.
 *
 * Purpose: solve the cold-start problem. Visitors land, see an animated orb,
 * and freeze because they don't know what to ask. A single chip rotates through
 * a curated list of starter questions (Turkish and English mixed 60/40) so
 * users see the product's surface area without a tutorial.
 *
 * Behavior:
 * - One chip visible at a time, 7s on screen, ~500ms cross-fade between.
 * - Pauses rotation on hover so the user can read without it disappearing.
 * - Clicking a chip sends that question as a user_message (caller wires this).
 * - Hidden entirely while a scene is active or once the conversation starts.
 * - Each chip click also fires onInteract so the parent can mark
 *   conversationStarted and hide chips for the rest of the session.
 *
 * Design intent: chips are an invitation, not a menu. Once the user engages
 * once, they're never shown again this session.
 */

export interface SuggestedQuestion {
  text: string;
  lang: "tr" | "en";
}

// 6 TR + 4 EN. Each question is designed to trigger a scene (wow moment) on
// the first interaction. Keep total ≤ 12 — beyond that, rotation feels random
// instead of curated.
const QUESTIONS: SuggestedQuestion[] = [
  // Turkish
  { text: "Bana Tempus AI'yi anlat", lang: "tr" },
  { text: "Palantir'e neden yatırım yaptın?", lang: "tr" },
  { text: "Robinhood Gold üyelikleri kaça ulaştı?", lang: "tr" },
  { text: "Portföyünü göster", lang: "tr" },
  { text: "Aurora'nın rekabet avantajı ne?", lang: "tr" },
  { text: "Ne zaman satarsın?", lang: "tr" },
  // English
  { text: "Show me Nebius revenue", lang: "en" },
  { text: "Why did you invest in Palantir?", lang: "en" },
  { text: "How does Robinhood make money?", lang: "en" },
  { text: "What's your portfolio allocation?", lang: "en" },
];

const ROTATION_MS = 5000;

interface Props {
  onSelect: (question: SuggestedQuestion) => void;
  /** Hide entirely when true. Parent controls this. */
  hidden?: boolean;
}

/**
 * Shuffle and ensure no two consecutive items share the same language so the
 * Turkish/English mix feels random rather than batched. Deterministic per
 * mount (no SSR hydration mismatch — runs in useMemo on client only).
 */
function buildRotation(): SuggestedQuestion[] {
  const pool = [...QUESTIONS];
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Best-effort de-clustering: if two in a row share language, swap forward.
  for (let i = 1; i < pool.length; i++) {
    if (pool[i].lang === pool[i - 1].lang) {
      for (let k = i + 1; k < pool.length; k++) {
        if (pool[k].lang !== pool[i - 1].lang) {
          [pool[i], pool[k]] = [pool[k], pool[i]];
          break;
        }
      }
    }
  }
  return pool;
}

export function SuggestedQuestions({ onSelect, hidden }: Props) {
  const rotation = useMemo(() => buildRotation(), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  // Mirror paused into a ref so the interval callback can read the latest
  // value without re-creating the interval (which would reset the 7s clock
  // every time the user mouses in or out).
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (hidden) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % rotation.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [hidden, rotation.length]);

  if (hidden) return null;

  const current = rotation[index];

  return (
    <div
      className="flex items-center justify-center min-h-[36px] -mb-2 md:-mb-1 px-4 relative z-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.button
          key={`${index}-${current.text}`}
          type="button"
          onClick={() => onSelect(current)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="
            group relative
            px-8 py-3.5 md:px-12 md:py-4
            min-w-[260px] md:min-w-[360px]
            max-w-[88vw]
            rounded-full
            text-[12px] md:text-[13px]
            font-normal
            leading-[1.5]
            whitespace-nowrap
            cursor-pointer
            transition-colors duration-300
          "
          style={{
            // Warm-palette glass — ties into the gold accent system used by
            // StockBadge so the chip feels like part of the same world, not a
            // bolted-on web button.
            color: "#9a8a72",
            background: "rgba(200, 160, 80, 0.06)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1.5px solid rgba(200, 160, 80, 0.28)",
            letterSpacing: "-0.015em",
          }}
          whileHover={{
            y: -1,
            color: "#d4c4a0",
            background: "rgba(200, 160, 80, 0.10)",
            borderColor: "rgba(200, 160, 80, 0.45)",
            transition: { duration: 0.2, ease: "easeOut" },
          }}
          whileTap={{ scale: 0.97 }}
          aria-label={`Ask: ${current.text}`}
        >
          {current.text}
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
