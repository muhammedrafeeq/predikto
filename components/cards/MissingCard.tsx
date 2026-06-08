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
  // Dimensions based on size prop
  const sizeClasses = {
    sm: {
      container: "w-full max-w-[11rem] aspect-[11/16] text-[10px] sm:text-xs",
      icon: "text-2xl sm:text-3xl",
      hintText: "text-[9px] sm:text-[10px]",
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
      className={`relative rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-neutral-900/40 to-neutral-950/80 p-4 text-zinc-650 flex flex-col justify-between select-none overflow-hidden transition-all duration-300 ${cSize.container}`}
    >
      {/* Pitch Lines background for styling */}
      <div className="absolute inset-0 bg-pitch opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <span className="text-[9px] font-black tracking-widest text-zinc-700 uppercase">
          LOCKED
        </span>
        <div className="flex flex-col items-end">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-neutral-805 text-zinc-500 uppercase">
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
        <div className={`font-black text-zinc-800/85 tracking-tighter ${cSize.icon}`}>
          ?
        </div>
      </div>

      {/* Footer Info / Static locked label */}
      <div className="text-center z-10 mt-auto">
        <div className="text-[10px] text-zinc-700 font-black tracking-widest uppercase">
          LOCKED
        </div>
      </div>
    </div>
  );
}
