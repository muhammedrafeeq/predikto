import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const ALLOWED_FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const contestId = parseInt(id, 10);

    if (isNaN(contestId)) {
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    const body = await req.json() as { matchId?: number; homeFormation?: string; awayFormation?: string };
    const { matchId, homeFormation, awayFormation } = body;

    if (typeof matchId !== "number") {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    if (!homeFormation && !awayFormation) {
      return NextResponse.json({ error: "At least one formation (home or away) must be provided" }, { status: 400 });
    }

    if (homeFormation && !ALLOWED_FORMATIONS.includes(homeFormation)) {
      return NextResponse.json({ error: `Invalid home formation.` }, { status: 400 });
    }

    if (awayFormation && !ALLOWED_FORMATIONS.includes(awayFormation)) {
      return NextResponse.json({ error: `Invalid away formation.` }, { status: 400 });
    }

    // Verify user membership
    const membership = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contestId, user.userId]
    );

    if (membership.rowCount === 0 && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. You are not a member of this contest." }, { status: 403 });
    }

    // Verify match exists, is upcoming, and deadline hasn't passed
    const matchRes = await query(
      `SELECT id, deadline, status, match_time FROM matches WHERE id = $1`,
      [matchId]
    );

    if (matchRes.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matchRes.rows[0];

    if (match.status !== "upcoming") {
      return NextResponse.json({ error: "Match is not open for predictions" }, { status: 400 });
    }

    if (new Date(match.deadline as string) < new Date()) {
      return NextResponse.json({ error: "Prediction deadline has passed" }, { status: 400 });
    }

    // Enforce 24-hour unlock rule for matches beyond the first 2
    const rankRes = await query(
      `SELECT COUNT(*) AS cnt FROM matches WHERE status = 'upcoming' AND match_time < $1 AND tournament_id = (SELECT tournament_id FROM contests WHERE id = $2)`,
      [match.match_time, contestId]
    );
    const rank = parseInt((rankRes.rows[0] as { cnt: string }).cnt, 10);
    if (rank >= 2) {
      const hoursUntil = (new Date(match.match_time as string).getTime() - Date.now()) / 36e5;
      if (hoursUntil > 24) {
        return NextResponse.json({ error: "This match unlocks 24 hours before kick-off" }, { status: 403 });
      }
    }

    const metadata = {
      homeFormation: homeFormation ?? null,
      awayFormation: awayFormation ?? null,
    };

    // Insert/Upsert in game_scores
    await query(
      `INSERT INTO game_scores (user_id, contest_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, $2, 'formation', $3, 0, $4, NOW())
       ON CONFLICT (user_id, contest_id, game_type, reference_id)
       DO UPDATE SET metadata = EXCLUDED.metadata, played_at = NOW()`,
      [user.userId, contestId, matchId, JSON.stringify(metadata)]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
