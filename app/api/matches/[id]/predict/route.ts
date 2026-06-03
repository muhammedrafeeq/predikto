import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "predikto-secret-jwt-key-2026-secure";

export async function POST(
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

    const body = await request.json();
    const { predictions } = body; // Array of { questionId: number, answer: string }

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json(
        { error: "Predictions array is required" },
        { status: 400 }
      );
    }

    // 1. Fetch and verify match deadline
    const matchRes = await query("SELECT deadline, status FROM matches WHERE id = $1", [
      matchId,
    ]);

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

    // 2. Insert/Upsert predictions
    for (const pred of predictions) {
      const qId = parseInt(pred.questionId, 10);
      const answer = pred.answer.trim();

      if (isNaN(qId) || !answer) {
        return NextResponse.json(
          { error: "Invalid prediction payload" },
          { status: 400 }
        );
      }

      await query(
        `INSERT INTO predictions (user_id, match_id, question_id, answer)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, match_id, question_id)
         DO UPDATE SET answer = EXCLUDED.answer`,
        [userId, matchId, qId, answer]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Predictions submitted successfully",
    });
  } catch (error) {
    console.error("POST Submit Predictions API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
