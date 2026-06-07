"use client";

import React, { useState } from "react";

interface MissingCardProps {
  playerName: string;
  position: string;
  jerseyNumber?: number;
  teamName: string;
  flagEmoji?: string;
  size?: "sm" | "md" | "lg";
}

export default function MissingCard({
  playerName,
  position,
  jerseyNumber,
  teamName,
  flagEmoji,
  size = "md",
}: MissingCardProps) {
  const [showHint, setShowHint] = useState(false);

  // Generate name hint, e.g. "Cristiano Ronaldo" -> "C. R******"
  const getNameHint = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      const first = parts[0][0];
      const last = parts[parts.length - 1];
      const maskedLast = last[0] + "*".repeat(last.length - 1);
      return `${first}. ${maskedLast}`;
    }
    return name[0] + "*".repeat(name.length - 1);
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: {
      container: "w-44 h-64 text-xs",
      icon: "text-3xl",
      hintText: "text-[10px]",
    },
    md: {
      container: "w-64 h-96 text-sm",
      icon: "text-5xl",
      hintText: "text-xs",
    },
    lg: {
      container: "w-72 h-[450px] text-base",
      icon: "text-6xl",
      hintText: "text-sm",
    },
  };

  const cSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      onClick={() => setShowHint(!showHint)}
      className={`relative rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-neutral-900/40 to-neutral-950/80 p-4 text-zinc-600 flex flex-col justify-between select-none cursor-pointer overflow-hidden transition-all duration-300 hover:border-zinc-700/80 ${cSize.container}`}
    >
      {/* Pitch Lines background for styling */}
      <div className="absolute inset-0 bg-pitch opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">
          LOCKED
        </span>
        <div className="flex flex-col items-end">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-zinc-500">
            {position}
          </span>
          {jerseyNumber && (
            <span className="text-xs text-zinc-700 font-semibold mt-1">
              #{jerseyNumber}
            </span>
          )}
        </div>
      </div>

      {/* Center Question Mark */}
      <div className="flex flex-col items-center justify-center my-auto z-10">
        <div className={`font-black text-zinc-800 tracking-tighter ${cSize.icon}`}>
          ?
        </div>
      </div>

      {/* Footer Info / Tap Hint */}
      <div className="text-center z-10 mt-auto">
        {showHint ? (
          <div className="animate-fade-in p-2 bg-neutral-900/90 rounded-lg border border-neutral-800/80">
            <p className={`font-extrabold text-neutral-300 tracking-wide ${cSize.hintText}`}>
              {getNameHint(playerName)}
            </p>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              {flagEmoji} {teamName}
            </p>
          </div>
        ) : (
          <div className="text-[10px] text-zinc-500 font-medium tracking-wider animate-pulse uppercase">
            Tap to reveal hint
          </div>
        )}
      </div>
    </div>
  );
}
