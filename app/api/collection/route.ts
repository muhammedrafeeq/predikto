import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const duplicatesParam = url.searchParams.get("duplicates");
    const isDuplicatesOnly = duplicatesParam === "true";

    // If requesting duplicates only (for trading screen counter proposals)
    if (isDuplicatesOnly) {
      const dupsRes = await query<any>(
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
          uc.quantity
         FROM user_cards uc
         JOIN player_cards pc ON uc.card_id = pc.id
         JOIN teams t ON pc.team_id = t.id
         WHERE uc.user_id = $1 AND uc.quantity >= 2 AND pc.rarity != 'legendary' AND pc.is_active = true
         ORDER BY pc.overall_rating DESC, pc.player_name ASC`,
        [user.userId]
      );
      return NextResponse.json({ userId: user.userId, cards: dupsRes.rows });
    }

    // 1. Fetch all teams to populate filters in UI
    const teamsRes = await query<any>(
      `SELECT id, name, code, flag_emoji FROM teams ORDER BY name ASC`
    );
    const teams = teamsRes.rows;

    if (teams.length === 0) {
      return NextResponse.json({ userId: user.userId, cards: [], activeTeamId: null, teams: [] });
    }

    // 2. Determine active team ID (from query param, fav team, or first team)
    const teamIdParam = url.searchParams.get("teamId");
    let activeTeamId = teamIdParam ? parseInt(teamIdParam, 10) : null;

    if (!activeTeamId || isNaN(activeTeamId)) {
      const favTeamRes = await query<{ team_id: number }>(
        `SELECT team_id FROM user_favourite_teams WHERE user_id = $1 AND slot = 1`,
        [user.userId]
      );
      activeTeamId = favTeamRes.rows[0]?.team_id || teams[0].id;
    }

    // 3. Fetch cards for this team with owned quantities
    const cardsRes = await query<any>(
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
        COALESCE(uc.quantity, 0) as quantity
       FROM player_cards pc
       JOIN teams t ON pc.team_id = t.id
       LEFT JOIN user_cards uc ON pc.id = uc.card_id AND uc.user_id = $1
       WHERE pc.team_id = $2 AND pc.is_active = true
       ORDER BY 
         CASE pc.position 
           WHEN 'GK' THEN 1 
           WHEN 'DEF' THEN 2 
           WHEN 'MID' THEN 3 
           WHEN 'FWD' THEN 4 
           ELSE 5 
         END ASC, 
         pc.overall_rating DESC,
         pc.player_name ASC`,
      [user.userId, activeTeamId]
    );

    return NextResponse.json({
      userId: user.userId,
      cards: cardsRes.rows,
      activeTeamId,
      teams,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
