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

    // 1. Fetch Match Details
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

    // 2. Fetch User Predictions
    const entriesRes = await query(
      `SELECT 
        p.user_id,
        u.name as user_name,
        u.phone as user_phone,
        q.type as question_type,
        p.answer as predicted_answer,
        r.correct_answer,
        s.points as match_score
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN questions q ON p.question_id = q.id
      LEFT JOIN results r ON p.question_id = r.question_id AND p.match_id = r.match_id
      LEFT JOIN scores s ON p.user_id = s.user_id AND p.match_id = s.match_id
      WHERE p.match_id = $1
      ORDER BY u.name ASC`,
      [matchId]
    );

    const entriesMap = new Map();

    for (const row of entriesRes.rows) {
      const uId = row.user_id;
      if (!entriesMap.has(uId)) {
        entriesMap.set(uId, {
          userId: uId,
          userName: row.user_name,
          userPhone: row.user_phone,
          predictions: {},
          pointsEarned: row.match_score !== null ? parseInt(row.match_score, 10) : null,
        });
      }

      const userEntry = entriesMap.get(uId);
      userEntry.predictions[row.question_type] = {
        answer: row.predicted_answer,
        correctAnswer: row.correct_answer,
        isCorrect: row.correct_answer !== null ? row.predicted_answer === row.correct_answer : null,
      };
    }

    const entries = Array.from(entriesMap.values());

    // 3. Fetch Players for both teams
    const playersRes = await query(
      `SELECT name, team_name as "teamName"
       FROM players
       WHERE LOWER(team_name) = LOWER($1) OR LOWER(team_name) = LOWER($2)
       ORDER BY name ASC`,
      [match.teamHome, match.teamAway]
    );

    return NextResponse.json({
      success: true,
      match,
      entries,
      players: playersRes.rows,
    });
  } catch (error) {
    console.error("GET Admin Match Entries Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
