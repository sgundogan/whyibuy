"use client";

import { useEffect, useState } from "react";

export type Lang = "tr" | "en";

/**
 * Detect the user's preferred language from the browser and return a stable
 * value the UI can render against.
 *
 * Rule: anything starting with "tr" (tr, tr-TR) becomes "tr". Everything else
 * defaults to "en". This matches the audience split (79% Turkish per the
 * flywheel) and avoids the confusing TR/EN mix in chip rotation.
 *
 * SSR-safe: initial render returns "en" (locale-neutral default), then flips
 * to the detected value on mount. The brief flash is fine for chips that
 * already fade in over a few hundred ms.
 */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const browserLang = (navigator.language || "").toLowerCase();
    setLang(browserLang.startsWith("tr") ? "tr" : "en");
  }, []);

  return lang;
}

/**
 * Sniff the language of a chunk of agent or user text. The detection is
 * intentionally simple — we only need to distinguish Turkish from English:
 *
 *  1. Any Turkish-specific character (ş ç ğ ı ö ü İ Ş Ç Ğ Ö Ü) → "tr"
 *  2. Common Turkish question words / suffixes (nedir, ne, kaç, nasıl,
 *     hangi, hisse, portföy, var mı, satar, alır) → "tr"
 *  3. Otherwise → "en"
 *
 * This is conservative on the English side: if a Turkish reply lacks
 * special chars (rare but possible), we still catch it via the word list.
 * The opposite — English text accidentally being flagged Turkish — would
 * only happen if the English text contained Turkish characters, which it
 * shouldn't.
 */
export function detectLang(text: string): Lang | null {
  if (!text) return null;
  // Turkish-specific characters (Unicode)
  if (/[şçğıöüŞÇĞIİÖÜ]/.test(text)) return "tr";
  // Turkish-specific common words as fallback
  const trWords = [
    "nedir",
    " ne ",
    " ne?",
    "kaç",
    "nasıl",
    "hangi",
    "neden",
    "anlat",
    "göster",
    "satarsın",
    "alırsın",
    "portföy",
    "hisse",
    "yatırım",
  ];
  const lowered = " " + text.toLowerCase() + " ";
  for (const w of trWords) {
    if (lowered.includes(w.toLowerCase())) return "tr";
  }
  return "en";
}
