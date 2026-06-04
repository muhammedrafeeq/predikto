import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, matchId: mid } = await params;
    const contestId = parseInt(id, 10);
    const matchId = parseInt(mid, 10);

    if (isNaN(contestId) || isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid contest ID or match ID" }, { status: 400 });
    }

    // 1. Verify user is in contest
    const membership = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contestId, user.userId]
    );

    if (membership.rowCount === 0 && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. You are not a member of this contest." }, { status: 403 });
    }

    // 2. Fetch Match Info
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

    // 3. Fetch Match Questions
    const questionsRes = await query(
      "SELECT id, type, label, points FROM questions WHERE match_id = $1 ORDER BY id ASC",
      [matchId]
    );

    // 4. Fetch Players for both teams (for first scorer option list)
    const playersRes = await query(
      `SELECT name, team_name as "teamName"
       FROM players
       WHERE LOWER(team_name) = LOWER($1) OR LOWER(team_name) = LOWER($2)
       ORDER BY name ASC`,
      [match.teamHome, match.teamAway]
    );

    // 5. Query user's predictions for this match scoped to the contest
    const predictionsRes = await query(
      `SELECT p.question_id as "questionId", p.answer, q.type
       FROM predictions p
       JOIN questions q ON p.question_id = q.id
       WHERE p.user_id = $1 AND p.contest_id = $2 AND p.match_id = $3`,
      [user.userId, contestId, matchId]
    );

    const predictions: Record<string, { questionId: number; answer: string }> = {};

    for (const row of predictionsRes.rows) {
      predictions[row.type] = {
        questionId: row.questionId,
        answer: row.answer,
      };
    }

    return NextResponse.json({
      success: true,
      match,
      questions: questionsRes.rows,
      players: playersRes.rows,
      predictions,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
