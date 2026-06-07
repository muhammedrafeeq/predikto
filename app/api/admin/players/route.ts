import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET /api/admin/players?q=search
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    let res;
    if (q.length >= 2) {
      res = await query(
        `SELECT DISTINCT name, team_name AS "teamName"
         FROM players
         WHERE name ILIKE $1
         ORDER BY name ASC
         LIMIT 20`,
        [`%${q}%`]
      );
    } else {
      res = await query(
        `SELECT DISTINCT name, team_name AS "teamName"
         FROM players
         ORDER BY name ASC
         LIMIT 50`
      );
    }

    return NextResponse.json({ success: true, players: res.rows });
  } catch (error) {
    console.error("GET admin players error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
