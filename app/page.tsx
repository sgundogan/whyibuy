import { VoiceScreen } from "@/components/VoiceScreen";

// Force dynamic rendering so the initial page load goes through Vercel's
// firewall. This lets the browser solve the DDoS challenge and get the
// cookie needed for subsequent API calls (fetch can't solve JS challenges).
export const dynamic = "force-dynamic";

// Wordmark moved inside VoiceScreen so it can react to live conversation
// state (it hides the tagline once a scene mounts or a call connects).
export default function Home() {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#0C0C0C] text-[#E8E0D8]">
      <VoiceScreen />
    </div>
  );
}
