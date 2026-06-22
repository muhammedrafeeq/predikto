import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    // Fetch matches with prediction status and points for the current user
    const matchesRes = await query(
      `SELECT 
        m.id,
        m.team_home as "teamHome",
        m.team_away as "teamAway",
        m.match_time as "matchTime",
        m.deadline,
        m.status,
        COALESCE(m.round, '') as round,
        EXISTS(
          SELECT 1 FROM predictions p 
          WHERE p.match_id = m.id AND p.user_id = $1
        ) as "userPredicted",
        (
          SELECT p.answer FROM predictions p
          JOIN questions q ON p.question_id = q.id
          WHERE p.match_id = m.id AND p.user_id = $1 AND q.type = 'score'
          LIMIT 1
        ) as "predictedScore",
        s.points as "pointsEarned"
      FROM matches m
      LEFT JOIN scores s ON m.id = s.match_id AND s.user_id = $1
      ORDER BY m.match_time ASC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      matches: matchesRes.rows,
    });
  } catch (error) {
    console.error("GET Matches User API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
