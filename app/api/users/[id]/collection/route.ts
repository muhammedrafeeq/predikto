import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = parseInt(resolvedParams.id, 10);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // 1. Fetch user's name
    const userRes = await query<{ name: string }>(
      `SELECT name FROM users WHERE id = $1`,
      [targetUserId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserName = userRes.rows[0].name;

    // 2. Fetch all teams
    const teamsRes = await query<any>(
      `SELECT id, name, code, flag_emoji FROM teams ORDER BY name ASC`
    );
    const teams = teamsRes.rows;

    if (teams.length === 0) {
      return NextResponse.json({ 
        userName: targetUserName, 
        cards: [], 
        activeTeamId: null, 
        teams: [] 
      });
    }

    // 3. Determine active team ID
    const url = new URL(req.url);
    const teamIdParam = url.searchParams.get("teamId");
    let activeTeamId = teamIdParam ? parseInt(teamIdParam, 10) : null;

    if (!activeTeamId || isNaN(activeTeamId)) {
      // Find their favourite team, or first team
      const favTeamRes = await query<{ team_id: number }>(
        `SELECT team_id FROM user_favourite_teams WHERE user_id = $1 AND slot = 1`,
        [targetUserId]
      );
      activeTeamId = favTeamRes.rows[0]?.team_id || teams[0].id;
    }

    // 4. Fetch cards for this team with target user's ownership
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
      [targetUserId, activeTeamId]
    );

    return NextResponse.json({
      userName: targetUserName,
      cards: cardsRes.rows,
      activeTeamId,
      teams,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
