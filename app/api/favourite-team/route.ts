import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();

    const res = await query<any>(
      `SELECT t.id, t.name, t.code, t.flag_emoji 
       FROM user_favourite_teams uft
       JOIN teams t ON uft.team_id = t.id
       WHERE uft.user_id = $1 AND uft.slot = 1`,
      [user.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ favouriteTeam: null });
    }

    return NextResponse.json({ favouriteTeam: res.rows[0] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    // Verify team exists
    const teamRes = await query(`SELECT name FROM teams WHERE id = $1`, [teamId]);
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "Invalid teamId" }, { status: 400 });
    }

    // Upsert user's favourite team
    await query(
      `INSERT INTO user_favourite_teams (user_id, team_id, slot)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, slot) 
       DO UPDATE SET team_id = EXCLUDED.team_id`,
      [user.userId, teamId]
    );

    return NextResponse.json({ success: true, teamName: teamRes.rows[0].name });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
