"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import stocks, { type Stock } from "@/lib/stocks";
import { useLang } from "@/lib/useLang";

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
  /**
   * Optional portfolio-stock anchor. When set, the chip renders that company's
   * monochrome logo to the left of the question text — recognition beats
   * reading at a glance, and creates visual continuity with the StockBadge
   * that appears when the agent starts talking about the same company.
   *
   * Qualitative questions ("when do you sell?", "portfolio allocation") leave
   * this undefined so the rotation has a natural mix of with-logo and
   * text-only chips. This keeps the chip from feeling like a uniform menu
   * of company buttons.
   */
  ticker?: "PLTR" | "HOOD" | "TEM" | "NBIS" | "AUR";
}

// Each pool is ordered by REAL user demand from the conversation flywheel
// (wiki/flywheel/*.md). The chip rotation surfaces the questions users
// actually ask, plus seeds of new feature demand (target prices, cost basis).
// "Ne zaman satarsın?" / "When do you sell?" got cut — zero hits in 4 weeks
// of flywheel data — and replaced with cost-basis and target-price chips
// that map to real organic queries the agent kept refusing.
const QUESTIONS_TR: SuggestedQuestion[] = [
  // Top demand (7 hits in week 14)
  { text: "Palantir'e neden yatırım yaptın?", lang: "tr", ticker: "PLTR" },
  // Tied for #2 (4 hits each)
  { text: "Robinhood Gold üyelikleri kaça ulaştı?", lang: "tr", ticker: "HOOD" },
  { text: "Bana Tempus AI'yi anlat.", lang: "tr", ticker: "TEM" },
  // #4 (3 hits)
  { text: "Aurora'nın rekabet avantajı nedir?", lang: "tr", ticker: "AUR" },
  // #5 (2 hits) — also seeds the NBIS scene
  { text: "Nebius'un büyüme hikayesi nedir?", lang: "tr", ticker: "NBIS" },
  // Portfolio overview — common organic ask ("Portföyde neler var?")
  { text: "Portföy dağılımını göster.", lang: "tr" },
  // NEW: surfaces the cost-basis demand pattern from week 21
  // ("Maliyetler ne?", "Tempus'u kaçtan aldı?")
  { text: "Hisseleri kaçtan aldın?", lang: "tr" },
  // NEW: drives discovery of the target-price tables we just shipped
  { text: "Palantir'in hedef fiyatı nedir?", lang: "tr", ticker: "PLTR" },
];

const QUESTIONS_EN: SuggestedQuestion[] = [
  { text: "Why did you invest in Palantir?", lang: "en", ticker: "PLTR" },
  { text: "How many Robinhood Gold subscribers?", lang: "en", ticker: "HOOD" },
  { text: "Tell me about Tempus AI", lang: "en", ticker: "TEM" },
  { text: "What's Aurora's competitive edge?", lang: "en", ticker: "AUR" },
  { text: "Show me Nebius revenue", lang: "en", ticker: "NBIS" },
  { text: "Show me your portfolio", lang: "en" },
  { text: "What's your cost basis on each stock?", lang: "en" },
  { text: "What's Palantir's analyst price target?", lang: "en", ticker: "PLTR" },
];

const ROTATION_MS = 5000;

interface Props {
  onSelect: (question: SuggestedQuestion) => void;
  /** Hide entirely when true. Parent controls this. */
  hidden?: boolean;
}

/**
 * Fisher-Yates shuffle of the language-matched pool. Runs once per mount, so
 * the rotation order is fresh after each session reset.
 */
function buildRotation(pool: SuggestedQuestion[]): SuggestedQuestion[] {
  const out = [...pool];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function SuggestedQuestions({ onSelect, hidden }: Props) {
  const lang = useLang();
  // IMPORTANT: rotation and the starting index must be DETERMINISTIC on the
  // first render so server-rendered HTML matches the client (no hydration
  // mismatch). We start with the un-shuffled pool at index 0, then shuffle +
  // pick a random start in a mount effect (client-only). The parent forces a
  // fresh mount via `key` after each conversation, which re-runs this.
  const [rotation, setRotation] = useState<SuggestedQuestion[]>(() =>
    lang === "tr" ? QUESTIONS_TR : QUESTIONS_EN,
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  // Re-shuffle whenever the language changes (or on first client mount). Runs
  // only on the client, so the random shuffle never causes a hydration diff.
  useEffect(() => {
    const pool = lang === "tr" ? QUESTIONS_TR : QUESTIONS_EN;
    setRotation(buildRotation(pool));
    setIndex(Math.floor(Math.random() * pool.length));
  }, [lang]);

  // Mirror paused into a ref so the interval callback can read the latest
  // value without re-creating the interval (which would reset the 5s clock
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
  const stock: Stock | undefined = current.ticker ? stocks[current.ticker] : undefined;

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
          <span className="inline-flex items-center justify-center gap-2.5 md:gap-3">
            {stock && (
              <span
                className="inline-flex items-center justify-center w-[18px] h-[18px] md:w-[20px] md:h-[20px] shrink-0"
                aria-hidden
              >
                <Image
                  src={stock.logo}
                  alt=""
                  width={18}
                  height={18}
                  className="brightness-0 invert opacity-50"
                  style={{ width: "auto", height: "auto", maxWidth: 18, maxHeight: 18 }}
                />
              </span>
            )}
            <span>{current.text}</span>
          </span>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
