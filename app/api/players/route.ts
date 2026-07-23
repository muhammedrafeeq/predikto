import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ success: true, players: [] });
    }

    const res = await query(
      `SELECT id, name, team_name as "teamName"
       FROM players
       WHERE name ILIKE $1
       ORDER BY name ASC
       LIMIT 10`,
      [`%${q}%`]
    );

    return NextResponse.json({ success: true, players: res.rows });
  } catch (error) {
    console.error("GET Players API Error:", error);
    return NextResponse.json({ success: false, players: [] });
  }
}
