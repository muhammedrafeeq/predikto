"use client";

import React from "react";
import PlayerCard from "./PlayerCard";
import MissingCard from "./MissingCard";
import { PlayerCardData } from "@/lib/cardDrop";

interface CollectionGridProps {
  cards: PlayerCardData[];
  onCardClick?: (card: PlayerCardData) => void;
}

export default function CollectionGrid({ cards, onCardClick }: CollectionGridProps) {
  const totalCards = cards.length;
  const ownedCardsList = cards.filter((c) => (c.quantity || 0) > 0);
  const ownedCount = ownedCardsList.length;
  const progressPercent = totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0;
  const isComplete = ownedCount === totalCards && totalCards > 0;

  const [showSquad, setShowSquad] = React.useState(false);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Progress Bar & Header Stats */}
      <div className="surface-glass-1 rounded-2xl p-6 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">Squad Completion</h2>
            <p className="text-xs text-neutral-400 mt-1">Collect all 26 players from this nation</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSquad(!showSquad)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {showSquad ? "Hide Squad" : "Show Squad"}
            </button>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{ownedCount}</span>
              <span className="text-neutral-500 text-sm"> / {totalCards}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 font-bold text-xs text-indigo-400">
              {progressPercent}% Complete
            </div>
          </div>
        </div>

        {/* The Progress Bar */}
        <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden border border-neutral-900">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Complete Bonus Badge */}
        {isComplete && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl animate-bounce">
            <span className="text-xl">🏆</span>
            <div>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Squad Completed!
              </p>
              <p className="text-[10px] text-emerald-300/80">
                +200 bonus points awarded to active contests
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid of all cards (no position categorisation) */}
      {showSquad && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
          {cards.map((card) => {
            const isOwned = (card.quantity || 0) > 0;

            return (
              <div key={card.id} className="relative">
                {isOwned ? (
                  <PlayerCard
                    card={card}
                    size="sm"
                    showStats={false}
                    onClick={() => onCardClick?.(card)}
                  />
                ) : (
                  <MissingCard
                    playerName={card.player_name}
                    position={card.position}
                    jerseyNumber={card.jersey_number}
                    teamName={card.team_name}
                    flagEmoji={card.flag_emoji}
                    size="sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
