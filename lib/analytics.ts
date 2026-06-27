/**
 * Lightweight custom-event tracking for GA4 (wired through GTM-W2D3837P).
 *
 * Pushes a named event onto the GTM dataLayer. To make these show up in GA4,
 * each event needs a one-time setup in GTM: a "Custom Event" trigger matching
 * the event name, fed into a "GA4 Event" tag (or a single generic forwarder
 * tag triggered on all custom events). Until that GTM wiring exists, the pushes
 * are harmless no-ops as far as GA4 reporting goes.
 *
 * Events emitted by the app:
 *   question_card_click  { source: "landing"|"followup", question_text, lang, ticker? }
 *   voice_start          {}                      — user tapped the orb to talk
 *   voice_connected      {}                      — session actually connected
 *   scene_shown          { scene }               — a chart/scene rendered
 *   share_click          { scene }               — user tapped share on a chart
 */

type Primitive = string | number | boolean | undefined;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, Primitive>>;
  }
}

export function track(event: string, params: Record<string, Primitive> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
