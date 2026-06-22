import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET /api/admin/teams — returns all unique team names from group stage matches
export async function GET() {
  try {
    await requireAdmin();
    const res = await query(
      `SELECT DISTINCT unnest(ARRAY[team_home, team_away]) AS name
       FROM matches
       WHERE round = 'Group Stage' OR round = '' OR round IS NULL
       ORDER BY 1 ASC`
    );
    const teams = res.rows.map((r) => r.name as string).filter(Boolean);
    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error("GET /api/admin/teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
