import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const leaderboardRes = await query(
      `SELECT
        u.id,
        u.name,
        COALESCE(SUM(s.points), 0) as "totalPoints"
      FROM users u
      LEFT JOIN scores s ON u.id = s.user_id
      GROUP BY u.id, u.name
      ORDER BY "totalPoints" DESC, u.name ASC`
    );

    const rankings = leaderboardRes.rows.map((row, idx) => ({
      rank: idx + 1,
      id: row.id,
      name: row.name,
      points: parseInt(row.totalPoints, 10),
    }));

    return NextResponse.json({
      success: true,
      rankings,
    });
  } catch (error) {
    console.error("GET Leaderboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
