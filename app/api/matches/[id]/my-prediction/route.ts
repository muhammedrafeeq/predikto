import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    // Query user's predictions for this match
    const predictionsRes = await query(
      `SELECT p.question_id as "questionId", p.answer, q.type
       FROM predictions p
       JOIN questions q ON p.question_id = q.id
       WHERE p.user_id = $1 AND p.match_id = $2`,
      [userId, matchId]
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
      predictions,
    });
  } catch (error) {
    console.error("GET My Predictions API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
