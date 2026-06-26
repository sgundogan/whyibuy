import { VoiceScreen } from "@/components/VoiceScreen";

// Force dynamic rendering so the initial page load goes through Vercel's
// firewall. This lets the browser solve the DDoS challenge and get the
// cookie needed for subsequent API calls (fetch can't solve JS challenges).
export const dynamic = "force-dynamic";

// Wordmark moved inside VoiceScreen so it can react to live conversation
// state (it hides the tagline once a scene mounts or a call connects).
//
// Root uses h-[100dvh] (dynamic viewport height), NOT h-screen/100vh. On mobile
// browsers 100vh includes the area BEHIND the bottom URL/toolbar, so the
// bottom-anchored orb and the follow-up questions got pushed under the toolbar —
// you had to scroll a hair to reveal them. dvh measures the VISIBLE viewport, so
// everything fits the screen on first open.
export default function Home() {
  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-[#0C0C0C] text-[#E8E0D8]">
      <VoiceScreen />
    </div>
  );
}
