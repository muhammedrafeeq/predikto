import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const matchId = parseInt(params.id, 10);
    if (isNaN(matchId)) return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });

    const body = await request.json();
    const { teamHome, teamAway } = body;

    if (!teamHome?.trim() || !teamAway?.trim()) {
      return NextResponse.json({ error: "teamHome and teamAway are required" }, { status: 400 });
    }

    await query(
      `UPDATE matches SET team_home = $1, team_away = $2 WHERE id = $3`,
      [teamHome.trim(), teamAway.trim(), matchId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Match API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
