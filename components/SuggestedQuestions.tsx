"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import stocks, { type Stock } from "@/lib/stocks";
import { useLang } from "@/lib/useLang";

/**
 * Portrait coverflow question deck (landing screen only).
 *
 * Purpose: solve the cold-start problem. Visitors land, see an animated orb,
 * and freeze because they don't know what to ask. The deck surfaces ONE focused
 * starter question as a tall, gold-bordered card with a warm halo, while the
 * prev/next questions peek in from the sides as ghost text — angled away, no
 * border, dimmed. It hints "this is a deck, browse it" without a tutorial.
 *
 * Behavior:
 * - Center card: gold border, soft halo glow, large multi-line question text,
 *   ticker subtitle at the bottom-left when relevant.
 * - Side cards (prev/next): no border, just dim text, rotated back in 3D.
 * - Auto-advances with a long eased slide (short dwell, long glide).
 * - Hover pauses rotation. Click center → ask. Click a side → slide to center.
 * - Hidden once a scene activates or the conversation starts.
 * - Respects prefers-reduced-motion: single calm card, no auto-rotate.
 *
 * Design intent: the deck is an invitation, not a menu. Once the user engages
 * once, the parent unmounts it for the rest of the session.
 */

export interface SuggestedQuestion {
  text: string;
  lang: "tr" | "en";
  /**
   * Optional portfolio-stock anchor. When set, the center card renders a small
   * ticker subtitle so the question reads like a contextual prompt instead of a
   * disembodied chip. Qualitative questions ("cost basis", "portfolio") leave
   * this undefined so the deck has a natural mix of with-ticker and plain
   * cards rather than feeling like a uniform menu of company buttons.
   */
  ticker?: "PLTR" | "HOOD" | "TEM" | "NBIS" | "AUR";
}

// Each pool is ordered by REAL user demand from the conversation flywheel
// (wiki/flywheel/*.md). The rotation surfaces the questions users actually
// ask, plus seeds of new feature demand (target prices, cost basis).
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
  // surfaces the cost-basis demand pattern from week 21
  { text: "Hisseleri kaçtan aldın?", lang: "tr" },
  // drives discovery of the target-price tables
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

// Short dwell, long glide — reads as continuous motion, not a hard 5s swap.
const DWELL_MS = 3800;
const SLIDE_MS = 0.78; // seconds (framer transition)

// Portrait-card geometry. Center card is tall (height > width). Side cards
// peek with a big rotateY so they read as "the rest of the deck" not "two
// more buttons." Numeric values feed framer transforms — Tailwind's `md:`
// can't express these.
//
// Desktop height is intentionally close to mobile's: the parent landing
// container vertically centers {card, orb, hint} in a fixed region below the
// wordmark. The orb is ~420px, so a tall card overflows that region upward
// on typical laptop viewports (~800px tall) and collides with the wordmark.
// 280px keeps the stack under ~780px and preserves clearance.
const DIMS = {
  desktop: { w: 216, h: 280, gap: 176, rotate: 50, sideScale: 0.86, sideOpacity: 0.5 },
  mobile: { w: 188, h: 268, gap: 130, rotate: 52, sideScale: 0.84, sideOpacity: 0.45 },
} as const;

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

/**
 * Shortest signed distance from `i` to the centered `index`, wrapping around
 * the ring. 0 = center, -1 = one to the left, +1 = one to the right.
 */
function signedOffset(i: number, center: number, n: number): number {
  let o = i - center;
  if (o > n / 2) o -= n;
  if (o < -n / 2) o += n;
  return o;
}

/**
 * Center card content: small logo + ticker tag at the top-left, big multi-line
 * question filling the body, ticker name at the bottom-left as a subtitle.
 */
function CenterCard({ q, isDesktop }: { q: SuggestedQuestion; isDesktop: boolean }) {
  const stock: Stock | undefined = q.ticker ? stocks[q.ticker] : undefined;
  const titleSize = isDesktop ? "text-[22px] leading-[1.18]" : "text-[18px] leading-[1.2]";
  return (
    <div className="relative h-full w-full flex flex-col items-stretch justify-between px-5 py-5 md:px-6 md:py-6 text-left">
      {/* top-left affordance: logo tucked into the corner. Plain text questions
          ("portfolio") leave the slot empty so the layout stays balanced. */}
      <div className="flex items-center gap-2 h-5">
        {stock && (
          <Image
            src={stock.logo}
            alt=""
            width={18}
            height={18}
            className="brightness-0 invert"
            style={{ width: "auto", height: "auto", maxWidth: 18, maxHeight: 18, opacity: 0.7 }}
            aria-hidden
          />
        )}
        {stock && (
          <span
            className="text-[10px] tracking-[0.14em] uppercase font-medium"
            style={{ color: "rgba(212, 196, 160, 0.65)" }}
          >
            {stock.ticker}
          </span>
        )}
      </div>

      <div
        className={`${titleSize} font-normal tracking-[-0.015em]`}
        style={{ color: "#e6d4a8" }}
      >
        {q.text}
      </div>

      <div className="h-4 flex items-end">
        {stock && (
          <span className="text-[11px] font-light" style={{ color: "rgba(212, 196, 160, 0.5)" }}>
            {stock.name}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Side card content: just dim, naturally-wrapped text. No logo, no border —
 * matches the reference mockup where peek cards read as ghost text fragments.
 * Side text is positioned toward the inner edge (closest to center card) so
 * the eye reads "next →" not "another button."
 */
function SideCard({ q, side }: { q: SuggestedQuestion; side: "left" | "right" }) {
  return (
    <div
      className={`h-full w-full flex flex-col justify-center text-left ${
        side === "left" ? "items-end pr-3 pl-4" : "items-start pl-3 pr-4"
      }`}
    >
      <div
        className="text-[15px] leading-[1.32] font-light tracking-[-0.01em] max-w-[140px]"
        style={{ color: "#a89a82" }}
      >
        {q.text}
      </div>
    </div>
  );
}

export function SuggestedQuestions({ onSelect, hidden }: Props) {
  const lang = useLang();
  const reduceMotion = useReducedMotion();

  // Deterministic first render so SSR HTML matches the client (no hydration
  // mismatch): start un-shuffled at index 0, then shuffle + pick a random
  // start in a mount effect. `mounted` gates the 3D deck so the first paint
  // is a single plain card — clean progressive enhancement.
  const [rotation, setRotation] = useState<SuggestedQuestion[]>(() =>
    lang === "tr" ? QUESTIONS_TR : QUESTIONS_EN,
  );
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    const pool = lang === "tr" ? QUESTIONS_TR : QUESTIONS_EN;
    setRotation(buildRotation(pool));
    setIndex(Math.floor(Math.random() * pool.length));
    setMounted(true);
  }, [lang]);

  // Track the breakpoint for coverflow geometry (transforms are numeric, so
  // we can't lean on Tailwind's md: here).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Mirror paused into a ref so the interval callback reads the latest value
  // without re-creating the interval (which would reset the dwell clock on
  // every mouse enter/leave).
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (hidden || reduceMotion) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % rotation.length);
    }, DWELL_MS);
    return () => clearInterval(id);
  }, [hidden, reduceMotion, rotation.length]);

  if (hidden) return null;

  const dims = isDesktop ? DIMS.desktop : DIMS.mobile;
  const N = rotation.length;

  // Center card chrome: gold border + warm halo glow. The double box-shadow
  // (outer halo + inner soft fill) is what gives the card its "lit from the
  // edges" quality in the reference mockup — a single glow flattens it.
  const centerStyle: React.CSSProperties = {
    background: "rgba(28, 22, 14, 0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1.5px solid rgba(214, 178, 102, 0.7)",
    boxShadow:
      "0 0 80px -10px rgba(214, 178, 102, 0.45), 0 0 28px -6px rgba(214, 178, 102, 0.35), inset 0 0 40px -16px rgba(214, 178, 102, 0.3)",
  };

  // Side card chrome: NO border, NO background — just dim text floating at
  // angle. Matches the reference where the peek cards are pure typography.
  const sideStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };

  // ─── Reduced motion OR pre-mount: a single calm card, no deck, no rotate.
  if (reduceMotion || !mounted) {
    const current = rotation[index];
    return (
      <div
        className="relative z-20 mb-4 md:mb-6 flex items-center justify-center"
        style={{ height: dims.h }}
      >
        <button
          type="button"
          onClick={() => onSelect(current)}
          className="rounded-[22px] overflow-hidden cursor-pointer"
          style={{ width: dims.w, height: dims.h, ...centerStyle }}
          aria-label={`Ask: ${current.text}`}
        >
          <CenterCard q={current} isDesktop={isDesktop} />
        </button>
      </div>
    );
  }

  // ─── Coverflow deck ───────────────────────────────────────────────────────
  return (
    <div
      className="relative z-20 mb-4 md:mb-6 w-full flex items-center justify-center"
      style={{ height: dims.h, perspective: 1400 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {rotation.map((q, i) => {
        const offset = signedOffset(i, index, N);
        const isCenter = offset === 0;
        const visible = Math.abs(offset) <= 1;
        const side: "left" | "right" = offset < 0 ? "left" : "right";

        return (
          <motion.button
            key={`${q.lang}-${q.text}`}
            type="button"
            onClick={() => (isCenter ? onSelect(q) : setIndex(i))}
            tabIndex={visible ? 0 : -1}
            aria-hidden={!visible}
            aria-label={isCenter ? `Ask: ${q.text}` : `Show: ${q.text}`}
            initial={false}
            animate={{
              x: offset * dims.gap,
              rotateY: offset * -dims.rotate,
              z: isCenter ? 0 : -140,
              scale: isCenter ? 1 : dims.sideScale,
              opacity: visible ? (isCenter ? 1 : dims.sideOpacity) : 0,
            }}
            transition={{ duration: SLIDE_MS, ease: [0.22, 1, 0.36, 1] }}
            whileHover={
              isCenter
                ? { scale: 1.015 }
                : { opacity: Math.min(0.85, dims.sideOpacity + 0.25) }
            }
            whileTap={{ scale: isCenter ? 0.985 : dims.sideScale }}
            className={`absolute left-1/2 top-1/2 rounded-[22px] cursor-pointer will-change-transform overflow-hidden ${
              isCenter ? "" : "outline-none"
            }`}
            style={{
              width: dims.w,
              height: dims.h,
              marginLeft: -dims.w / 2,
              marginTop: -dims.h / 2,
              zIndex: isCenter ? 30 : 20 - Math.abs(offset),
              pointerEvents: visible ? "auto" : "none",
              transformStyle: "preserve-3d",
              ...(isCenter ? centerStyle : sideStyle),
            }}
          >
            {isCenter ? (
              <CenterCard q={q} isDesktop={isDesktop} />
            ) : (
              <SideCard q={q} side={side} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
