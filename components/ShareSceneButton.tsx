"use client";

import { useState, type RefObject } from "react";

/**
 * Share button for a scene/chart. Renders the referenced DOM node to a PNG and
 * hands it to the OS share sheet (mobile) or downloads it (desktop).
 *
 * Why this exists: the voice answer can't travel, but the CHART can. A user who
 * sees "Palantir Rule of 40 = 145" can fire it into Twitter/WhatsApp as an
 * image, every copy carrying the faint whyibuy.io watermark baked into the
 * capture node. That's the only organic distribution loop a voice product has.
 *
 * The watermark is part of the captured node (see SceneOrchestrator), not added
 * here — so it survives whatever the OS does with the file.
 */

type ShareState = "idle" | "working" | "done" | "error";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "chart";
}

export function ShareSceneButton({
  targetRef,
  title,
}: {
  /** The node to rasterize. Must exclude this button (it lives outside it). */
  targetRef: RefObject<HTMLElement | null>;
  title: string;
}) {
  const [state, setState] = useState<ShareState>("idle");

  async function handleShare() {
    const node = targetRef.current;
    if (!node || state === "working") return;
    setState("working");
    try {
      // Lazy-load so html-to-image (~) never touches the main bundle until the
      // user actually shares.
      const { toBlob } = await import("html-to-image");

      // Capture the LIVE node (reliable — capturing a detached offscreen clone
      // rendered all-black on some engines). To keep the watermark out of the
      // in-app view but present in the export, we reveal it only for the
      // duration of the capture, then hide it again. The brief faint flash is
      // covered by the share sheet that opens immediately after.
      const wm = node.querySelector<HTMLElement>("[data-share-watermark]");
      if (wm) wm.style.opacity = "0.35";
      let blob: Blob | null = null;
      try {
        blob = await toBlob(node, {
          // Solid app-dark background so the PNG is a finished card, not a
          // transparent fragment. pixelRatio 2 = crisp on retina + re-shares.
          backgroundColor: "#0c0c0c",
          pixelRatio: 2,
          cacheBust: true,
          // The share button lives inside the captured node (same row as the
          // title, for alignment) but must not appear in the image — skip it.
          filter: (el) =>
            !(el instanceof HTMLElement && el.dataset.noShareCapture !== undefined),
        });
      } finally {
        if (wm) wm.style.opacity = "0";
      }
      if (!blob) throw new Error("capture-failed");

      const file = new File([blob], `${slugify(title)}-whyibuy.png`, {
        type: "image/png",
      });

      // Mobile: native share sheet with the image file. Desktop Chrome usually
      // can't share files → fall through to download.
      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          files: [file],
          title,
          text: `${title} — whyibuy.io`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      setState("done");
      setTimeout(() => setState("idle"), 1800);
    } catch (err) {
      // The user dismissing the OS share sheet throws AbortError — that's not a
      // failure, just reset quietly.
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
      setTimeout(() => setState("idle"), 2200);
    }
  }

  const label =
    state === "working"
      ? "Preparing image…"
      : state === "done"
        ? "Shared"
        : state === "error"
          ? "Couldn't share — try again"
          : "Share this chart";

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      title={label}
      disabled={state === "working"}
      className="
        inline-flex items-center justify-center
        w-9 h-9 rounded-full cursor-pointer
        transition-colors duration-200
        disabled:cursor-default
      "
      style={{
        color: state === "error" ? "#c86a5a" : "#b89850",
        background: "rgba(200, 160, 80, 0.07)",
        border: "1px solid rgba(200, 160, 80, 0.25)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {state === "working" ? (
        // spinner
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
          </path>
        </svg>
      ) : state === "done" ? (
        // check
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        // share / upload arrow
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 15V4M12 4 8 8M12 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
