import { query } from "./db";

export type CardRarity = "common" | "rare" | "epic" | "legendary";

export interface PlayerCardData {
  id: number;
  team_id: number;
  player_name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  jersey_number?: number;
  rarity: CardRarity;
  overall_rating: number;
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    defending: number;
  };
  team_name: string;
  flag_emoji?: string;
  quantity?: number;
}

/**
 * Weighted random selection of rarity based on trigger type.
 */
export function pickRarity(trigger: string, isStreakDay7 = false): CardRarity {
  const rand = Math.random() * 100;

  if (isStreakDay7) {
    // Guaranteed Rare+ on Day 7 streak: Rare (70%), Epic (25%), Legendary (5%)
    if (rand < 70) return "rare";
    if (rand < 95) return "epic";
    return "legendary";
  }

  switch (trigger) {
    case "perfect":
      // Perfect prediction: Epic (70%), Legendary (30%)
      if (rand < 70) return "epic";
      return "legendary";

    case "daily_login":
      // Daily login: Common (70%), Rare (25%), Epic (5%), Legendary (0%)
      if (rand < 70) return "common";
      if (rand < 95) return "rare";
      return "epic";

    case "trivia":
    case "prediction":
    case "streak":
    case "leaderboard":
    default:
      // Normal drop rates: Common (60%), Rare (30%), Epic (9%), Legendary (1%)
      if (rand < 60) return "common";
      if (rand < 90) return "rare";
      if (rand < 99) return "epic";
      return "legendary";
  }
}

/**
 * Drop a single card for a user.
 */
export async function dropCard(
  userId: number,
  trigger: string,
  triggerRefId?: number,
  forceRarity?: CardRarity,
  excludeCardIds: number[] = []
): Promise<PlayerCardData | null> {
  // 1. Pick Rarity
  const rarity = forceRarity || pickRarity(trigger);

  // 2. Fetch Favourite Team of current user
  const favTeamRes = await query<{ team_id: number }>(
    `SELECT team_id FROM user_favourite_teams WHERE user_id = $1 AND slot = 1`,
    [userId]
  );
  const favTeamId = favTeamRes.rows[0]?.team_id;

  // Fetch unique team IDs that are favourited by at least one active user in the system
  const activeFavTeamsRes = await query<{ team_id: number }>(
    `SELECT DISTINCT team_id FROM user_favourite_teams`
  );
  const activeFavTeamIds = activeFavTeamsRes.rows.map((r) => r.team_id);

  let selectedCard: any = null;

  // 3. 30% chance to drop from user's own favourite team (if they have one)
  if (favTeamId && Math.random() < 0.30) {
    const favCardsRes = await query<any>(
      `SELECT pc.*, t.name as team_name, t.flag_emoji 
       FROM player_cards pc
       JOIN teams t ON pc.team_id = t.id
       WHERE pc.rarity = $1 AND pc.team_id = $2 AND pc.is_active = true AND NOT (pc.id = ANY($3::int[]))
       ORDER BY RANDOM() LIMIT 1`,
      [rarity, favTeamId, excludeCardIds]
    );

    if (favCardsRes.rows.length > 0) {
      selectedCard = favCardsRes.rows[0];
    }
  }

  // 4. Normal path: Pick a random card of this rarity from teams favourited by ANY user
  if (!selectedCard && activeFavTeamIds.length > 0) {
    const restrictedCardsRes = await query<any>(
      `SELECT pc.*, t.name as team_name, t.flag_emoji 
       FROM player_cards pc
       JOIN teams t ON pc.team_id = t.id
       WHERE pc.rarity = $1 AND pc.team_id = ANY($2) AND pc.is_active = true AND NOT (pc.id = ANY($3::int[]))
       ORDER BY RANDOM() LIMIT 1`,
      [rarity, activeFavTeamIds, excludeCardIds]
    );

    if (restrictedCardsRes.rows.length > 0) {
      selectedCard = restrictedCardsRes.rows[0];
    }
  }

  // 5. Fallback path: If no cards are found in the restricted pool, or no one has favourited a team yet, drop from all teams
  if (!selectedCard) {
    const allCardsRes = await query<any>(
      `SELECT pc.*, t.name as team_name, t.flag_emoji 
       FROM player_cards pc
       JOIN teams t ON pc.team_id = t.id
       WHERE pc.rarity = $1 AND pc.is_active = true AND NOT (pc.id = ANY($2::int[]))
       ORDER BY RANDOM() LIMIT 1`,
      [rarity, excludeCardIds]
    );

    if (allCardsRes.rows.length > 0) {
      selectedCard = allCardsRes.rows[0];
    }
  }

  // 5. Fallback in case no card of specified rarity is available in the system
  if (!selectedCard) {
    console.warn(`No player cards found in database with rarity: ${rarity}`);
    // Let's get any card as final absolute fallback
    const fallbackRes = await query<any>(
      `SELECT pc.*, t.name as team_name, t.flag_emoji 
       FROM player_cards pc
       JOIN teams t ON pc.team_id = t.id
       WHERE pc.is_active = true AND NOT (pc.id = ANY($1::int[]))
       ORDER BY RANDOM() LIMIT 1`,
      [excludeCardIds]
    );
    if (fallbackRes.rows.length > 0) {
      selectedCard = fallbackRes.rows[0];
    } else {
      return null;
    }
  }

  const cardId = selectedCard.id;

  // 6. Log the drop event in card_drops
  await query(
    `INSERT INTO card_drops (user_id, card_id, trigger, trigger_ref_id)
     VALUES ($1, $2, $3, $4)`,
    [userId, cardId, trigger, triggerRefId || null]
  );

  // 7. Upsert into user_cards
  const upsertRes = await query<{ quantity: number }>(
    `INSERT INTO user_cards (user_id, card_id, quantity, earned_via)
     VALUES ($1, $2, 1, $3)
     ON CONFLICT (user_id, card_id) 
     DO UPDATE SET quantity = user_cards.quantity + 1
     RETURNING quantity`,
    [userId, cardId, trigger]
  );

  const finalCard: PlayerCardData = {
    id: selectedCard.id,
    team_id: selectedCard.team_id,
    player_name: selectedCard.player_name,
    position: selectedCard.position,
    jersey_number: selectedCard.jersey_number,
    rarity: selectedCard.rarity as CardRarity,
    overall_rating: selectedCard.overall_rating,
    stats: selectedCard.stats,
    team_name: selectedCard.team_name,
    flag_emoji: selectedCard.flag_emoji,
    quantity: upsertRes.rows[0].quantity,
  };

  // 8. Check if collection is complete for this team, and award bonus if complete
  await checkCollectionComplete(userId, finalCard.team_id);

  return finalCard;
}

/**
 * Drop multiple cards in a batch.
 */
export async function dropMultipleCards(
  userId: number,
  trigger: string,
  count: number,
  triggerRefId?: number,
  day7Index = -1 // If >= 0, the card at this index will have guaranteed Rare+ rarity
): Promise<PlayerCardData[]> {
  const cards: PlayerCardData[] = [];
  const excludeIds: number[] = [];
  for (let i = 0; i < count; i++) {
    const isStreakDay7 = i === day7Index;
    const forceRarity = isStreakDay7 ? pickRarity(trigger, true) : undefined;
    const card = await dropCard(userId, trigger, triggerRefId, forceRarity, excludeIds);
    if (card) {
      cards.push(card);
      excludeIds.push(card.id);
    }
  }
  return cards;
}

/**
 * Check if the user has collected all 26 cards for a team.
 * If yes, awards +200 bonus points in all contests the user is currently a member of.
 */
export async function checkCollectionComplete(userId: number, teamId: number): Promise<boolean> {
  try {
    // 1. Get total active cards for this team
    const totalCardsRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM player_cards WHERE team_id = $1 AND is_active = true`,
      [teamId]
    );
    const totalCards = parseInt(totalCardsRes.rows[0].count, 10);

    if (totalCards === 0) return false;

    // 2. Get unique owned cards for this team
    const ownedCardsRes = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT uc.card_id) 
       FROM user_cards uc
       JOIN player_cards pc ON uc.card_id = pc.id
       WHERE uc.user_id = $1 AND pc.team_id = $2`,
      [userId, teamId]
    );
    const ownedCards = parseInt(ownedCardsRes.rows[0].count, 10);

    // If they have all cards, check/award points
    if (ownedCards === totalCards) {
      // Find all contests this user belongs to
      const contestsRes = await query<{ contest_id: number }>(
        `SELECT contest_id FROM contest_members WHERE user_id = $1`,
        [userId]
      );

      for (const row of contestsRes.rows) {
        const contestId = row.contest_id;

        // Check if already awarded
        const checkAwarded = await query(
          `SELECT 1 FROM game_scores 
           WHERE user_id = $1 AND contest_id = $2 AND game_type = 'collection_complete' AND reference_id = $3`,
          [userId, contestId, teamId]
        );

        if (checkAwarded.rows.length === 0) {
          // Award +200 pts
          await query(
            `INSERT INTO game_scores (user_id, contest_id, game_type, reference_id, points, metadata)
             VALUES ($1, $2, 'collection_complete', $3, 200, $4)
             ON CONFLICT (user_id, contest_id, game_type, reference_id) DO NOTHING`,
            [
              userId,
              contestId,
              teamId,
              JSON.stringify({
                team_id: teamId,
                awarded_at: new Date().toISOString(),
                message: "Completed squad collection!",
              }),
            ]
          );
        }
      }
      return true;
    }
  } catch (error) {
    console.error("Error in checkCollectionComplete:", error);
  }
  return false;
}
