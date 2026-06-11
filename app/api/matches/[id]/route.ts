import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    // 1. Fetch Match Info
    const matchRes = await query(
      `SELECT id, team_home as "teamHome", team_away as "teamAway",
              match_time as "matchTime", deadline, status
       FROM matches WHERE id = $1`,
      [matchId]
    );

    if (matchRes.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matchRes.rows[0];

    // 2. Fetch Match Questions
    const questionsRes = await query(
      "SELECT id, type, label, points FROM questions WHERE match_id = $1 ORDER BY id ASC",
      [matchId]
    );

    // 3. Fetch Players for both teams
    const playersRes = await query(
      `SELECT name, team_name as "teamName", is_star
       FROM players
       WHERE LOWER(team_name) = LOWER($1) OR LOWER(team_name) = LOWER($2)
       ORDER BY is_star DESC NULLS LAST, name ASC`,
      [match.teamHome, match.teamAway]
    );

    return NextResponse.json({
      success: true,
      match,
      questions: questionsRes.rows,
      players: playersRes.rows,
    });
  } catch (error) {
    console.error("GET Match Detail API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
