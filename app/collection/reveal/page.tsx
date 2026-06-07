import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import RevealPageClient from "./RevealPageClient";
import { PlayerCardData } from "@/lib/cardDrop";

interface PageProps {
  searchParams: Promise<{ cards?: string }>;
}

async function fetchCards(cardIds: number[]) {
  if (cardIds.length === 0) return [];
  
  const res = await query<any>(
    `SELECT pc.*, t.name as team_name, t.flag_emoji 
     FROM player_cards pc
     JOIN teams t ON pc.team_id = t.id
     WHERE pc.id = ANY($1)`,
    [cardIds]
  );
  return res.rows;
}

export default async function CardRevealPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const cardsParam = resolvedSearchParams.cards;

  if (!cardsParam) {
    redirect("/collection");
  }

  // Parse card IDs from query params
  const cardIds = cardsParam
    .split(",")
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id));

  if (cardIds.length === 0) {
    redirect("/collection");
  }

  const user = await requireAuth();
  const rawCards = await fetchCards(cardIds);

  if (rawCards.length === 0) {
    return notFound();
  }

  // Map to PlayerCardData
  const cards: PlayerCardData[] = rawCards.map((c) => ({
    id: c.id,
    team_id: c.team_id,
    player_name: c.player_name,
    position: c.position,
    jersey_number: c.jersey_number,
    rarity: c.rarity,
    overall_rating: c.overall_rating,
    stats: c.stats,
    team_name: c.team_name,
    flag_emoji: c.flag_emoji,
    quantity: 1, // default visual quantity on drop
  }));

  return (
    <div className="min-h-screen text-white bg-base-bg flex items-center justify-center p-6">
      <RevealPageClient cards={cards} />
    </div>
  );
}
