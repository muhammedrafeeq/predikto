import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "predikto-secret-jwt-key-2026-secure";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const contestIdParam = searchParams.get("contestId");
    const contestId = contestIdParam ? parseInt(contestIdParam, 10) : 1;

    const { id } = await params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 1. Fetch Match Info
    const matchRes = await query(
      `SELECT id, team_home as "teamHome", team_away as "teamAway", 
              match_time as "matchTime", status 
       FROM matches WHERE id = $1`,
      [matchId]
    );

    if (matchRes.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matchRes.rows[0];

    // Helper: resolve legacy "home"/"away" winner answers to team name
    const resolveWinner = (answer: string | null) => {
      if (!answer) return answer;
      const a = answer.trim().toLowerCase();
      if (a === "home") return match.teamHome;
      if (a === "away") return match.teamAway;
      return answer;
    };

    // 2. Fetch User predictions and correct answers
    const detailsRes = await query(
      `SELECT 
        q.id as question_id,
        q.type as question_type,
        q.label as question_label,
        q.points as question_points,
        p.answer as user_answer,
        r.correct_answer
      FROM questions q
      LEFT JOIN predictions p ON q.id = p.question_id AND p.user_id = $1 AND p.contest_id = $3
      LEFT JOIN results r ON q.id = r.question_id
      WHERE q.match_id = $2
      ORDER BY q.id ASC`,
      [userId, matchId, contestId]
    );

    const questionsBreakdown: Record<string, any> = {};
    let correctCount = 0;
    let basePoints = 0;

    for (const row of detailsRes.rows) {
      const type = row.question_type;
      const rawUAns = row.user_answer ? row.user_answer.trim() : null;
      const uAns = type === "winner" ? resolveWinner(rawUAns) : rawUAns;
      const cAns = row.correct_answer ? row.correct_answer.trim() : null;

      const normalize = (s: string) => s.toLowerCase().replace(/\s*-\s*/g, "-");
      const isCorrect = uAns !== null && cAns !== null && normalize(uAns) === normalize(cAns);
      const pointsPossible = parseInt(row.question_points, 10);
      const pointsEarned = isCorrect ? pointsPossible : 0;

      if (isCorrect) {
        correctCount++;
        basePoints += pointsPossible;
      }

      questionsBreakdown[type] = {
        label: row.question_label,
        userAnswer: uAns,
        correctAnswer: cAns,
        isCorrect,
        pointsPossible,
        pointsEarned,
      };
    }

    // Check bonus
    const hasBonus = correctCount === 3;
    const bonusPoints = hasBonus ? 3 : 0;
    const totalPoints = basePoints + bonusPoints;

    return NextResponse.json({
      success: true,
      match,
      breakdown: {
        winner: questionsBreakdown.winner || null,
        score: questionsBreakdown.score || null,
        scorer: questionsBreakdown.scorer || null,
        correctCount,
        hasBonus,
        bonusPoints,
        totalPoints,
      },
    });
  } catch (error) {
    console.error("GET Match Result API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
