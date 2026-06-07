import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// POST /api/admin/contests/[id]/predict
// Body: { userId, matchId, predictions: [{ questionId, answer }] }
// Admin bypasses deadline — upserts predictions on behalf of any user.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const contestId = parseInt(id, 10);
    const body = await request.json() as {
      userId: number;
      matchId: number;
      predictions: { questionId: number; answer: string }[];
    };

    const { userId, matchId, predictions } = body;

    if (!userId || !matchId || !Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json({ error: "userId, matchId, and predictions are required" }, { status: 400 });
    }

    // Verify user is a member of this contest
    const memberCheck = await query(
      "SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2",
      [contestId, userId]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: "User is not a member of this contest" }, { status: 403 });
    }

    // Upsert each prediction
    for (const pred of predictions) {
      if (!pred.questionId || pred.answer === undefined) continue;
      await query(
        `INSERT INTO predictions (user_id, contest_id, match_id, question_id, answer)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, contest_id, match_id, question_id)
         DO UPDATE SET answer = EXCLUDED.answer`,
        [userId, contestId, matchId, pred.questionId, pred.answer]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Admin Predict Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
