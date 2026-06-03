import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "predikto-secret-jwt-key-2026-secure";

export async function GET() {
  try {
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

    // Fetch matches with prediction status and points for the current user
    const matchesRes = await query(
      `SELECT 
        m.id, 
        m.team_home as "teamHome", 
        m.team_away as "teamAway", 
        m.match_time as "matchTime", 
        m.deadline, 
        m.status,
        EXISTS(
          SELECT 1 FROM predictions p 
          WHERE p.match_id = m.id AND p.user_id = $1
        ) as "userPredicted",
        (
          SELECT p.answer FROM predictions p
          JOIN questions q ON p.question_id = q.id
          WHERE p.match_id = m.id AND p.user_id = $1 AND q.type = 'score'
          LIMIT 1
        ) as "predictedScore",
        s.points as "pointsEarned"
      FROM matches m
      LEFT JOIN scores s ON m.id = s.match_id AND s.user_id = $1
      ORDER BY m.match_time ASC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      matches: matchesRes.rows,
    });
  } catch (error) {
    console.error("GET Matches User API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
