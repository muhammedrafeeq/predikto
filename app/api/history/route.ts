import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    // 1. Fetch Stats
    // Total Points
    const pointsRes = await query(
      "SELECT COALESCE(SUM(points), 0) as total_points FROM scores WHERE user_id = $1",
      [userId]
    );
    const totalPoints = parseInt(pointsRes.rows[0].total_points, 10);

    // Total prediction matches count
    const countRes = await query(
      "SELECT COUNT(DISTINCT match_id) as matches_count FROM predictions WHERE user_id = $1",
      [userId]
    );
    const predictionsCount = parseInt(countRes.rows[0].matches_count, 10);

    // Graded accuracy
    const accuracyRes = await query(
      `SELECT 
        COUNT(p.id) as total_graded,
        COUNT(CASE WHEN p.answer = r.correct_answer THEN 1 END) as correct_count
       FROM predictions p
       JOIN results r ON p.question_id = r.question_id AND p.match_id = r.match_id
       WHERE p.user_id = $1`,
      [userId]
    );

    const totalGraded = parseInt(accuracyRes.rows[0].total_graded, 10);
    const correctCount = parseInt(accuracyRes.rows[0].correct_count, 10);
    const accuracy = totalGraded > 0 ? Math.round((correctCount / totalGraded) * 100) : 0;

    // 2. Fetch History list (matches and predictions details)
    const historyRes = await query(
      `SELECT 
        m.id as match_id,
        p.contest_id as contest_id,
        m.team_home as team_home,
        m.team_away as team_away,
        m.match_time as match_time,
        m.status as match_status,
        s.points as points_earned,
        q.type as question_type,
        p.answer as user_answer,
        r.correct_answer
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      JOIN questions q ON p.question_id = q.id
      LEFT JOIN results r ON p.question_id = r.question_id AND p.match_id = r.match_id
      LEFT JOIN scores s ON m.id = s.match_id AND s.user_id = $1 AND s.contest_id = p.contest_id
      WHERE p.user_id = $1
      ORDER BY m.match_time DESC`,
      [userId]
    );

    const historyMap = new Map();

    for (const row of historyRes.rows) {
      const key = `${row.match_id}_${row.contest_id}`;
      if (!historyMap.has(key)) {
        historyMap.set(key, {
          matchId: row.match_id,
          contestId: row.contest_id,
          teamHome: row.team_home,
          teamAway: row.team_away,
          matchTime: row.match_time,
          status: row.match_status,
          pointsEarned: row.points_earned !== null ? parseInt(row.points_earned, 10) : null,
          predictions: {},
        });
      }

      const matchEntry = historyMap.get(key);
      matchEntry.predictions[row.question_type] = {
        answer: row.user_answer,
        correctAnswer: row.correct_answer,
        isCorrect: row.correct_answer !== null ? row.user_answer.trim().toLowerCase() === row.correct_answer.trim().toLowerCase() : null,
      };
    }

    const predictionsList = Array.from(historyMap.values());

    return NextResponse.json({
      success: true,
      stats: {
        totalPoints,
        predictionsCount,
        accuracy,
      },
      history: predictionsList,
    });
  } catch (error) {
    console.error("GET User History API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
