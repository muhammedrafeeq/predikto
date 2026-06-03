import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { query } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "predikto-secret-jwt-key-2026-secure";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        name: string;
        phone: string;
        role: string;
      };

      // Query total points for the user
      const pointsRes = await query(
        "SELECT COALESCE(SUM(points), 0) as total_points FROM scores WHERE user_id = $1",
        [decoded.userId]
      );
      const totalPoints = parseInt(pointsRes.rows[0].total_points, 10);

      return NextResponse.json({
        user: {
          id: decoded.userId,
          name: decoded.name,
          phone: decoded.phone,
          role: decoded.role,
          points: totalPoints,
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
