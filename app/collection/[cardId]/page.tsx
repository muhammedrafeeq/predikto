import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import PlayerCard from "@/components/cards/PlayerCard";
import { PlayerCardData } from "@/lib/cardDrop";

interface PageProps {
  params: Promise<{ cardId: string }>;
}

async function getCardDetails(userId: number, cardId: number) {
  const res = await query<any>(
    `SELECT 
      pc.id, 
      pc.team_id, 
      pc.player_name, 
      pc.position, 
      pc.jersey_number, 
      pc.rarity, 
      pc.overall_rating, 
      pc.stats,
      t.name as team_name,
      t.flag_emoji,
      COALESCE(uc.quantity, 0) as quantity,
      uc.earned_via,
      uc.first_earned_at
     FROM player_cards pc
     JOIN teams t ON pc.team_id = t.id
     LEFT JOIN user_cards uc ON pc.id = uc.card_id AND uc.user_id = $1
     WHERE pc.id = $2 AND pc.is_active = true`,
    [userId, cardId]
  );

  return res.rows[0] || null;
}

export default async function CardDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const cardId = parseInt(resolvedParams.cardId, 10);
  if (isNaN(cardId)) {
    return notFound();
  }

  const user = await requireAuth();
  const card = await getCardDetails(user.userId, cardId);

  if (!card) {
    return notFound();
  }

  const isOwned = card.quantity > 0;

  // Format date
  const dateStr = card.first_earned_at
    ? new Date(card.first_earned_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Map earned via methods
  const earnedSources: Record<string, string> = {
    daily_login: "Daily Login Streak Reward",
    trivia: "Perfect / Correct Trivia Quiz Session",
    prediction: "Correct Match Outcome Prediction",
    perfect: "Perfect Match prediction (11/11 pts)",
    streak: "Hot Streak prediction bonus (3 correct in a row)",
    leaderboard: "End of matchday Leaderboard Rank #1 reward",
  };

  const formattedSource = earnedSources[card.earned_via] || "Card Dropped or Traded";

  const cardData: PlayerCardData = {
    id: card.id,
    team_id: card.team_id,
    player_name: card.player_name,
    position: card.position,
    jersey_number: card.jersey_number,
    rarity: card.rarity,
    overall_rating: card.overall_rating,
    stats: card.stats,
    team_name: card.team_name,
    flag_emoji: card.flag_emoji,
    quantity: card.quantity,
  };

  return (
    <div className="min-h-screen text-white bg-base-bg p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex justify-between items-center w-full">
          <Link
            href="/collection"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center gap-1.5"
          >
            ⬅ Back to Collection
          </Link>
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
            Card Details
          </span>
        </div>

        {/* Card and Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-neutral-950/40 border border-neutral-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
          {/* Card Presentation */}
          <div className="flex justify-center">
            {isOwned ? (
              <PlayerCard card={cardData} size="lg" />
            ) : (
              <div className="relative opacity-40">
                <PlayerCard card={cardData} size="lg" />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                  <div className="text-center p-4">
                    <span className="text-5xl block mb-2">🔒</span>
                    <span className="text-sm font-black uppercase tracking-wider text-neutral-400">
                      Not Owned Yet
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Meta & Stats Breakdown */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase inline-block mb-3">
                {card.rarity}
              </span>
              <h1 className="text-3xl font-black tracking-tight">{card.player_name}</h1>
              <p className="text-sm text-neutral-400 mt-1 flex items-center gap-1.5">
                <span>{card.flag_emoji}</span>
                <span>{card.team_name}</span>
                <span className="text-neutral-600">•</span>
                <span>{card.position}</span>
                {card.jersey_number && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span>#{card.jersey_number}</span>
                  </>
                )}
              </p>
            </div>

            {/* Ownership State Box */}
            <div className="surface-glass-1 rounded-2xl p-5 border border-neutral-800">
              {isOwned ? (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                      Quantity Owned
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 font-black text-sm text-indigo-400">
                      ×{card.quantity}
                    </span>
                  </div>

                  <div className="border-t border-neutral-800/60 pt-3 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-500">First Earned via</span>
                    <span className="text-xs text-neutral-300 font-semibold">{formattedSource}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-500">First Obtained on</span>
                    <span className="text-xs text-neutral-300 font-semibold">{dateStr}</span>
                  </div>

                  {card.quantity >= 2 && card.rarity !== "legendary" && (
                    <div className="mt-2 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-indigo-300 text-[11px] font-medium leading-relaxed">
                      💡 <strong>Duplicate available!</strong> You have spare copies of this card. You can offer this card in trades with other players.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                    Locked Card
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    You do not own this card yet. Earn it by making correct match predictions, completing trivia quizzes, logging in daily, or trading with other players!
                  </p>
                </div>
              )}
            </div>

            {/* Position details / stats hint */}
            <div className="text-xs text-neutral-500 leading-relaxed">
              <p>
                <strong>GK:</strong> Goalkeeper · <strong>DEF:</strong> Defender · <strong>MID:</strong> Midfielder · <strong>FWD:</strong> Forward.
              </p>
              <p className="mt-1">
                Collect all 26 players from a single nation squad to secure a +200 points completion bonus in your active contests!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
