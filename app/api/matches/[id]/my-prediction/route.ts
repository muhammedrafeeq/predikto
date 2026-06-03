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
