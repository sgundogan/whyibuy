"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { OrbState } from "@/hooks/useVoiceBrain";

interface VoiceOrbProps {
  state: OrbState;
  onClick: () => void;
  getAmplitude?: () => number;
  isConnected?: boolean;
  miniMode?: boolean;
}

export function VoiceOrb({ state, onClick, getAmplitude, isConnected = false, miniMode = false }: VoiceOrbProps) {
  const [amplitude, setAmplitude] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (state !== "listening" || !getAmplitude) {
      setAmplitude(0);
      return;
    }

    function tick() {
      const val = getAmplitude!();
      setAmplitude(val);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [state, getAmplitude]);

  const orbScale = state === "listening" ? 1 + amplitude * (miniMode ? 0.08 : 0.15) : 1;

  return (
    <motion.div
      layout
      className={
        miniMode
          ? "relative z-30 w-[88px] h-[88px] flex items-center justify-center cursor-pointer max-md:w-[88px] max-md:h-[88px]"
          : "relative w-[300px] h-[300px] flex items-center justify-center cursor-pointer max-md:w-[264px] max-md:h-[264px]"
      }
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
    >
      {/* Pulsing rings — hidden in mini mode */}
      <AnimatePresence>
        {!miniMode && (state === "listening" || state === "speaking") && (
          <>
            <Ring delay={0} size={290} state={state} />
            <Ring delay={0.3} size={340} state={state} />
            {state === "listening" && (
              <Ring delay={0.6} size={390} state={state} />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Rotating arc for thinking */}
      <AnimatePresence>
        {state === "thinking" && (
          <motion.div
            className={
              miniMode
                ? "absolute w-[76px] h-[76px] rounded-full max-md:w-[76px] max-md:h-[76px]"
                : "absolute w-[200px] h-[200px] rounded-full"
            }
            style={{
              border: "1.5px solid transparent",
              borderTopColor: "rgba(220, 180, 70, 0.25)",
            }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{
              rotate: { duration: 2.5, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.3 },
            }}
          />
        )}
      </AnimatePresence>

      {/* The orb */}
      <motion.div
        className={
          miniMode
            ? "w-[64px] h-[64px] rounded-full relative z-10 max-md:w-[64px] max-md:h-[64px]"
            : "w-[180px] h-[180px] rounded-full relative z-10"
        }
        style={{
          background: `radial-gradient(circle at 45% 40%,
            rgba(220, 170, 60, 0.15) 0%,
            rgba(180, 120, 30, 0.08) 25%,
            rgba(100, 60, 10, 0.04) 50%,
            #100e0a 75%
          )`,
          border: state === "error"
            ? "1px solid rgba(200, 60, 60, 0.3)"
            : "1px solid rgba(200, 160, 60, 0.15)",
        }}
        animate={{
          scale: orbScale,
          boxShadow: getBoxShadow(state),
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Inner core glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full"
          style={{
            background: state === "error"
              ? "radial-gradient(circle, rgba(200, 60, 60, 0.12) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(230, 180, 70, 0.12) 0%, transparent 70%)",
          }}
          animate={getCoreAnimation(state, amplitude)}
          transition={{
            duration: state === "listening" ? 0.15 : state === "thinking" ? 2 : 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        {/* Mic icon — always visible on the orb */}
        <AnimatePresence>
          {state !== "thinking" && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: state === "speaking" ? 0.15 : state === "listening" ? 0.35 : 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <svg
                width={miniMode ? "20" : "28"}
                height={miniMode ? "20" : "28"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(220, 180, 70, 1)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="1" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <line x1="8" y1="21" x2="16" y2="21" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function Ring({
  delay,
  size,
  state,
}: {
  delay: number;
  size: number;
  state: OrbState;
}) {
  const mobileSize = Math.round(size * 0.62);
  return (
    <motion.div
      className="absolute rounded-full max-md:!w-[var(--ms)] max-md:!h-[var(--ms)]"
      style={{
        width: size,
        height: size,
        "--ms": `${mobileSize}px`,
        border: `1px solid rgba(200, 160, 60, 0.06)`,
      } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: [0.4, 0], scale: [0.85, 1.2] }}
      exit={{ opacity: 0 }}
      transition={{
        duration: state === "speaking" ? 2 : 1.2,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

function getBoxShadow(state: OrbState): string {
  switch (state) {
    case "listening":
      return `0 0 60px rgba(200, 150, 40, 0.12),
              0 0 120px rgba(200, 150, 40, 0.06),
              inset 0 0 50px rgba(220, 170, 60, 0.10)`;
    case "thinking":
      return `0 0 40px rgba(200, 150, 40, 0.06),
              0 0 80px rgba(200, 150, 40, 0.03),
              inset 0 0 30px rgba(220, 170, 60, 0.05)`;
    case "speaking":
      return `0 0 70px rgba(220, 170, 50, 0.16),
              0 0 140px rgba(200, 150, 40, 0.08),
              inset 0 0 60px rgba(230, 180, 70, 0.14)`;
    case "error":
      return `0 0 40px rgba(200, 60, 60, 0.08),
              0 0 80px rgba(200, 60, 60, 0.04),
              inset 0 0 30px rgba(200, 60, 60, 0.06)`;
  }
}

function getCoreAnimation(state: OrbState, amplitude: number) {
  switch (state) {
    case "listening":
      return {
        scale: 0.8 + amplitude * 0.5,
        opacity: 0.7 + amplitude * 0.3,
      };
    case "thinking":
      return { scale: [0.9, 1.05, 0.9], opacity: [0.4, 0.7, 0.4] };
    case "speaking":
      return {
        scale: [0.9, 1.15, 0.95, 1.1, 0.9],
        opacity: [0.8, 1, 0.85, 0.95, 0.8],
      };
    case "error":
      return { scale: 0.8, opacity: 0.4 };
  }
}
