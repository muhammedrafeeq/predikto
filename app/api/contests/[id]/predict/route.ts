import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const contestId = parseInt(id, 10);

    if (isNaN(contestId)) {
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    const body = await req.json() as { matchId?: number; predictions?: { questionId: number; answer: string }[] };
    const { matchId, predictions } = body;

    if (!matchId || !Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json(
        { error: "matchId and predictions array are required" },
        { status: 400 }
      );
    }

    // Verify user is in contest
    const membership = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contestId, user.userId]
    );

    if (membership.rowCount === 0 && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. You are not a member of this contest." }, { status: 403 });
    }

    // Fetch and verify match deadline & status
    const matchRes = await query(
      "SELECT deadline, status, tournament_id FROM matches WHERE id = $1", 
      [matchId]
    );

    if (matchRes.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matchRes.rows[0];

    // Check if match is already resulted or past prediction deadline
    if (match.status === "resulted") {
      return NextResponse.json(
        { error: "Predictions closed. Match is resulted." },
        { status: 400 }
      );
    }

    const deadlineTime = new Date(match.deadline).getTime();
    if (Date.now() > deadlineTime) {
      return NextResponse.json(
        { error: "Prediction deadline has passed for this match." },
        { status: 400 }
      );
    }

    // Insert/Upsert predictions scoped to contest
    for (const pred of predictions) {
      const qId = parseInt(pred.questionId as any, 10);
      const answer = pred.answer.trim();

      if (isNaN(qId) || !answer) {
        return NextResponse.json(
          { error: "Invalid prediction payload" },
          { status: 400 }
        );
      }

      await query(
        `INSERT INTO predictions (user_id, contest_id, match_id, question_id, answer)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, contest_id, match_id, question_id)
         DO UPDATE SET answer = EXCLUDED.answer`,
        [user.userId, contestId, matchId, qId, answer]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Predictions submitted successfully under contest",
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
