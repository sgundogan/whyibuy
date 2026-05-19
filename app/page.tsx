"use client";

import { VoiceScreen } from "@/components/VoiceScreen";
import { Wordmark } from "@/components/Wordmark";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#0C0C0C] text-[#E8E0D8]">
      <Wordmark showTagline />
      <VoiceScreen />
    </div>
  );
}
