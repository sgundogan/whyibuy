"use client";

import { Sora, Playfair_Display } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-sora",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-playfair",
});

interface WordmarkProps {
  /**
   * When true, the tagline "Talk to my investing thesis" renders below the
   * wordmark. The parent (VoiceScreen) owns the value and flips it off the
   * moment a scene mounts or a conversation connects, so the tagline only
   * shows on the true landing state.
   */
  showTagline?: boolean;
}

export function Wordmark({ showTagline = false }: WordmarkProps) {
  return (
    <motion.div
      className="fixed top-10 left-1/2 -translate-x-1/2 flex flex-col items-center select-none z-10"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <h1 className="flex items-baseline gap-2 m-0">
        <span
          className={`${sora.className} text-[32px] font-light text-[#8a7c68] tracking-[6px] uppercase max-md:text-[22px] max-md:tracking-[4px]`}
        >
          Investing
        </span>
        <span
          className={`${playfair.className} text-[36px] font-medium text-[#c8a050] tracking-[1px] italic max-md:text-[24px]`}
        >
          Brain
        </span>
      </h1>
      <AnimatePresence>
        {showTagline && (
          <motion.p
            key="tagline"
            className={`${sora.className} mt-3.5 text-[14px] text-[#8a7c68] tracking-[0.2px] font-light whitespace-nowrap max-md:text-[12px]`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            Talk to my investing thesis
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
