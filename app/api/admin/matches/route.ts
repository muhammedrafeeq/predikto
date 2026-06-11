import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET /api/admin/matches
export async function GET() {
  try {
    await requireAdmin();
    const matchesRes = await query(
      `SELECT 
        m.id, 
        m.team_home as "teamHome", 
        m.team_away as "teamAway", 
        m.match_time as "matchTime", 
        m.deadline, 
        m.status, 
        COUNT(DISTINCT p.id) as "predictionsCount"
      FROM matches m
      LEFT JOIN predictions p ON m.id = p.match_id
      GROUP BY m.id, m.team_home, m.team_away, m.match_time, m.deadline, m.status
      ORDER BY m.match_time DESC`
    );

    const matches = matchesRes.rows.map((row) => ({
      id: row.id,
      teamHome: row.teamHome,
      teamAway: row.teamAway,
      matchTime: row.matchTime,
      deadline: row.deadline,
      status: row.status,
      predictionsCount: parseInt(row.predictionsCount, 10),
    }));

    return NextResponse.json({ success: true, matches });
  } catch (error) {
    console.error("GET Admin Matches API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { teamHome, teamAway, teamHomeMl, teamAwayMl, matchTime, deadline } = body;

    if (!teamHome || !teamAway || !matchTime || !deadline) {
      return NextResponse.json(
        { error: "teamHome, teamAway, matchTime, and deadline are required" },
        { status: 400 }
      );
    }

    // Insert match
    const matchRes = await query(
      `INSERT INTO matches (team_home, team_away, team_home_ml, team_away_ml, match_time, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
       RETURNING id, team_home as "teamHome", team_away as "teamAway", match_time as "matchTime", deadline, status`,
      [teamHome, teamAway, teamHomeMl || '', teamAwayMl || '', new Date(matchTime), new Date(deadline)]
    );

    const match = matchRes.rows[0];

    // Automatically create the three default questions for the match
    // 1. Winner
    await query(
      `INSERT INTO questions (match_id, type, label, points)
       VALUES ($1, 'winner', 'Who will win the match?', 2)`,
      [match.id]
    );

    // 2. Scoreline
    await query(
      `INSERT INTO questions (match_id, type, label, points)
       VALUES ($1, 'score', 'What will be the exact scoreline?', 4)`,
      [match.id]
    );

    // 3. Scorer
    await query(
      `INSERT INTO questions (match_id, type, label, points)
       VALUES ($1, 'scorer', 'Who will score first?', 2)`,
      [match.id]
    );

    return NextResponse.json(
      {
        success: true,
        match: {
          ...match,
          predictionsCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Admin Matches API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
