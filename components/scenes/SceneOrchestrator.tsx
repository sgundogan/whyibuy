"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { DynamicChart } from "./DynamicChart";
import type { ActiveScene, FollowupQuestion } from "@/hooks/useVoiceBrain";
import { Component, type ReactNode, type ErrorInfo } from "react";

interface SceneOrchestratorProps {
  activeScene: ActiveScene;
  isMobile?: boolean;
  /**
   * Kept on the type even though chips are now rendered by VoiceScreen — the
   * prop's presence acts as a guard against accidentally re-introducing chip
   * rendering here in the future.
   */
  onFollowupSelect?: (q: FollowupQuestion) => void;
}

export function SceneOrchestrator({
  activeScene,
  isMobile = false,
}: SceneOrchestratorProps) {
  const prefersReduced = useReducedMotion();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [activeScene]);

  if (!activeScene || hasError) return null;

  // Asymmetric transition: old exits FAST, new enters at normal speed.
  // mode="wait" ensures the old chart fully clears before the new one starts —
  // no overlapping animations, no visual chaos during the swap.
  const enterTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const };
  const exitTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.4, 0, 1, 1] as const };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="w-full max-w-[640px] z-20 max-md:max-w-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScene.title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: enterTransition }}
          exit={{ opacity: 0, y: -4, transition: exitTransition }}
          className="w-full"
          // Horizontal padding only. The big bottom padding that used to live
          // here (240/210px) was sized to clear a SEPARATE fixed chip bar that
          // no longer exists — chips now render directly under this chart as
          // one unit (see VoiceScreen Zone 2+3), and the parent container owns
          // scrolling + orb clearance. Keeping the old bottom padding created a
          // dead gap between the chart and its questions.
          style={{ padding: isMobile ? "0 20px" : "0 32px" }}
        >
          <h2
            className="text-[15px] font-normal tracking-[0.5px] mb-8 max-md:text-[13px] max-md:mb-6"
            style={{ color: "#b89850", fontFamily: "var(--font-sans)" }}
          >
            {activeScene.title}
          </h2>
          <ErrorBoundary onError={() => setHasError(true)}>
            <DynamicChart scene={activeScene} />
          </ErrorBoundary>
          {/* Follow-up chips are now rendered by VoiceScreen in their own
              absolute-positioned bar above the orb, NOT inside this scrollable
              scene container. That keeps them visually pinned above the orb
              regardless of how tall the chart is. */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
