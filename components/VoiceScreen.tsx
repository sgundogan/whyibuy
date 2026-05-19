"use client";

import { useState } from "react";
import { VoiceOrb } from "./VoiceOrb";
import { StockBadge } from "./StockBadge";
import { useVoiceBrain } from "@/hooks/useVoiceBrain";

export function VoiceScreen() {
  const [hasEnded, setHasEnded] = useState(false);
  const {
    orbState,
    activeStock,
    errorMessage,
    isConnected,
    startConversation,
    endConversation,
    getAmplitude,
  } = useVoiceBrain();

  const handleOrbClick = async () => {
    if (isConnected) {
      await endConversation();
      setHasEnded(true);
    } else {
      setHasEnded(false);
      await startConversation();
    }
  };

  const showHint = !isConnected && orbState !== "thinking";

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <StockBadge stock={activeStock} isConnected={isConnected} />
      <VoiceOrb
        state={orbState}
        onClick={handleOrbClick}
        getAmplitude={isConnected ? getAmplitude : undefined}
        isConnected={isConnected}
      />
      {errorMessage && !isConnected && (
        <p className="mt-6 text-[12px] text-[#665040] text-center max-w-[260px]">
          {errorMessage}
        </p>
      )}
      {showHint && orbState !== "error" && (
        <p className="mt-6 text-[12px] text-[#504838] tracking-[1px] text-center">
          {hasEnded ? (
            <>
              <span className="text-[#706860]">conversation ended.</span>
              <br />
              tap to talk
            </>
          ) : (
            "tap to talk"
          )}
        </p>
      )}
    </div>
  );
}
