"use client";

import React from "react";
import { PlayerCardData } from "@/lib/cardDrop";

interface PlayerCardProps {
  card: PlayerCardData;
  showStats?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export default function PlayerCard({
  card,
  showStats = true,
  size = "md",
  onClick,
}: PlayerCardProps) {
  const {
    player_name,
    position,
    jersey_number,
    rarity,
    overall_rating,
    stats,
    team_name,
    flag_emoji,
    quantity,
  } = card;

  // Rarity style configuration
  const rarityConfig = {
    common: {
      color: "#9ca3af", // gray-400
      bgClass: "from-zinc-800 to-zinc-950 border-zinc-700",
      glowClass: "shadow-[0_0_15px_rgba(156,163,175,0.15)]",
      badgeBg: "bg-zinc-700 text-zinc-200",
      barBg: "bg-zinc-600",
      textClass: "text-zinc-400",
    },
    rare: {
      color: "#3b82f6", // blue-500
      bgClass: "from-blue-950 via-slate-950 to-blue-950 border-blue-600/60",
      glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      badgeBg: "bg-blue-600 text-white",
      barBg: "bg-blue-500",
      textClass: "text-blue-400",
    },
    epic: {
      color: "#a855f7", // purple-500
      bgClass: "from-purple-950 via-neutral-950 to-purple-950 border-purple-500",
      glowClass: "shadow-[0_0_25px_rgba(168,85,247,0.45)]",
      badgeBg: "bg-purple-600 text-white",
      barBg: "bg-purple-500",
      textClass: "text-purple-400",
    },
    legendary: {
      color: "#fbbf24", // amber-400
      bgClass: "from-amber-950 via-stone-950 to-amber-900 border-2 border-amber-400",
      glowClass: "shadow-[0_0_35px_rgba(251,191,36,0.6)] animate-pulse",
      badgeBg: "bg-amber-500 text-stone-950 font-extrabold",
      barBg: "bg-amber-400",
      textClass: "text-amber-400",
    },
  };

  const currentRarity = rarityConfig[rarity] || rarityConfig.common;

  // Initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: {
      container: "w-full max-w-[11rem] aspect-[11/16] text-[10px] sm:text-xs",
      avatar: "w-12 h-12 sm:w-14 sm:h-14 text-[10px] sm:text-sm",
      rating: "text-base sm:text-xl",
      name: "text-xs sm:text-sm",
      header: "mb-0.5 sm:mb-1",
      statsGap: "gap-0.5 sm:gap-1",
    },
    md: {
      container: "w-64 h-96 text-sm",
      avatar: "w-24 h-24 text-xl",
      rating: "text-3xl",
      name: "text-lg",
      header: "mb-3",
      statsGap: "gap-2",
    },
    lg: {
      container: "w-72 h-[450px] text-base",
      avatar: "w-28 h-28 text-2xl",
      rating: "text-4xl",
      name: "text-xl",
      header: "mb-4",
      statsGap: "gap-3",
    },
  };

  const cSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border bg-gradient-to-b p-4 text-white flex flex-col justify-between select-none cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${currentRarity.bgClass} ${currentRarity.glowClass} ${cSize.container}`}
    >
      {/* Metallic diagonal shine for Legendary and Epic cards */}
      {(rarity === "legendary" || rarity === "epic") && (
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(45deg,transparent_45%,rgba(255,255,255,0.6)_50%,transparent_55%)] bg-[size:250%_250%] animate-[shine_4s_infinite]" />
      )}

      {/* Card Header: Rating, Jersey, Position */}
      <div className={`flex justify-between items-start ${cSize.header}`}>
        <div className="flex flex-col items-center">
          <span className={`font-black tracking-tight ${cSize.rating}`}>
            {overall_rating}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">
            OVR
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentRarity.badgeBg}`}>
            {position}
          </span>
          {jersey_number && (
            <span className="text-xs text-neutral-400 font-semibold mt-1">
              #{jersey_number}
            </span>
          )}
        </div>
      </div>

      {/* Card Center: Player Avatar/Initials */}
      <div className="flex flex-col items-center my-auto">
        <div
          className={`rounded-full flex items-center justify-center font-bold tracking-widest border-2 bg-neutral-900/60 ${cSize.avatar}`}
          style={{ borderColor: currentRarity.color }}
        >
          {getInitials(player_name)}
        </div>
        <div className="text-center mt-3 w-full px-1">
          <h3 className={`font-extrabold truncate uppercase ${cSize.name}`}>
            {player_name}
          </h3>
          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-neutral-300">
            <span>{flag_emoji}</span>
            <span className="truncate max-w-[120px]">{team_name}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Stats & Rarity */}
      <div className="mt-2">
        {showStats && stats && (
          <div className={`grid grid-cols-2 gap-x-4 gap-y-2 mb-3 border-t border-neutral-800 pt-2 ${cSize.statsGap}`}>
            {/* PAC */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>PAC</span>
                <span className="font-bold text-white">{stats.pace || 50}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full ${currentRarity.barBg}`}
                  style={{ width: `${stats.pace || 50}%` }}
                />
              </div>
            </div>

            {/* SHO */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>SHO</span>
                <span className="font-bold text-white">{stats.shooting || 50}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full ${currentRarity.barBg}`}
                  style={{ width: `${stats.shooting || 50}%` }}
                />
              </div>
            </div>

            {/* PAS */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>PAS</span>
                <span className="font-bold text-white">{stats.passing || 50}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full ${currentRarity.barBg}`}
                  style={{ width: `${stats.passing || 50}%` }}
                />
              </div>
            </div>

            {/* DEF */}
            <div className="flex flex-col">
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>DEF</span>
                <span className="font-bold text-white">{stats.defending || 50}</span>
              </div>
              <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full ${currentRarity.barBg}`}
                  style={{ width: `${stats.defending || 50}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-[10px] tracking-widest uppercase text-neutral-400">
          <span className={`font-bold ${currentRarity.textClass}`}>{rarity}</span>
          {quantity && quantity > 1 && (
            <span className="bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded-md font-bold normal-case text-xs">
              ×{quantity}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
