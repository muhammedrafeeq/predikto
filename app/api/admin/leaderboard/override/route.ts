import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, matchId, points } = body;

    const uId = parseInt(userId, 10);
    const mId = parseInt(matchId, 10);
    const pts = parseInt(points, 10);

    if (isNaN(uId) || isNaN(mId) || isNaN(pts)) {
      return NextResponse.json(
        { error: "userId, matchId, and points must be valid numbers" },
        { status: 400 }
      );
    }

    // Check if the user exists
    const userCheck = await query("SELECT id FROM users WHERE id = $1", [uId]);
    if (userCheck.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the match exists
    const matchCheck = await query("SELECT id FROM matches WHERE id = $1", [mId]);
    if (matchCheck.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Insert or update the score record
    const scoreRes = await query(
      `INSERT INTO scores (user_id, match_id, points)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, match_id)
       DO UPDATE SET points = EXCLUDED.points
       RETURNING id, user_id as "userId", match_id as "matchId", points`,
      [uId, mId, pts]
    );

    return NextResponse.json({
      success: true,
      score: scoreRes.rows[0],
    });
  } catch (error) {
    console.error("POST Admin Leaderboard Override Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
