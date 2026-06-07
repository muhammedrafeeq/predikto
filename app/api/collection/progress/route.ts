import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();

    // 1. Total active cards in system
    const systemTotalRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM player_cards WHERE is_active = true`
    );
    const systemTotal = parseInt(systemTotalRes.rows[0].count, 10);

    // 2. Unique cards owned by user
    const userUniqueRes = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT card_id) FROM user_cards WHERE user_id = $1`,
      [user.userId]
    );
    const userUnique = parseInt(userUniqueRes.rows[0].count, 10);

    // 3. Breakdown by team
    const teamProgressRes = await query<any>(
      `SELECT 
        t.id, 
        t.name, 
        t.flag_emoji, 
        COUNT(pc.id) as total_cards, 
        COUNT(DISTINCT uc.card_id) as owned_cards
       FROM teams t
       JOIN player_cards pc ON t.id = pc.team_id AND pc.is_active = true
       LEFT JOIN user_cards uc ON pc.id = uc.card_id AND uc.user_id = $1
       GROUP BY t.id, t.name, t.flag_emoji
       ORDER BY t.name ASC`
    );

    const teamProgress = teamProgressRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      flag_emoji: row.flag_emoji,
      totalCards: parseInt(row.total_cards, 10),
      ownedCards: parseInt(row.owned_cards, 10),
      percentage: row.total_cards > 0 
        ? Math.round((parseInt(row.owned_cards, 10) / parseInt(row.total_cards, 10)) * 100)
        : 0,
    }));

    return NextResponse.json({
      systemTotal,
      userUnique,
      percentage: systemTotal > 0 ? Math.round((userUnique / systemTotal) * 100) : 0,
      teamProgress,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
