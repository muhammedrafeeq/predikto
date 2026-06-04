import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const POINTS_MAP: Record<number, number> = { 5: 20, 4: 15, 3: 10, 2: 5, 1: 2, 0: 0 };
const DIRECTIONS = ["left", "center", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];

function getTodayRef(): number {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`, 10);
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const refId = getTodayRef();

    const res = await query(
      `SELECT points, metadata FROM game_scores
       WHERE user_id = $1 AND game_type = 'penalty' AND reference_id = $2`,
      [user.userId, refId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ played: false });
    }

    const row = res.rows[0];
    const meta = row.metadata as { goals: number; goalieKicks: Direction[] };

    // Fetch total game points for this user
    const totRes = await query(
      `SELECT COALESCE(SUM(points),0)::int AS total FROM game_scores WHERE user_id = $1`,
      [user.userId]
    );

    return NextResponse.json({
      played: true,
      goals: meta.goals,
      points: row.points,
      goalieKicks: meta.goalieKicks,
      totalPoints: totRes.rows[0].total,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const kicks: Direction[] = body.kicks;

    if (!Array.isArray(kicks) || kicks.length !== 5) {
      return NextResponse.json({ error: "Must provide exactly 5 kicks" }, { status: 400 });
    }
    for (const k of kicks) {
      if (!DIRECTIONS.includes(k)) {
        return NextResponse.json({ error: "Invalid kick direction" }, { status: 400 });
      }
    }

    // Server-side goalie logic — never trust client
    const goalieKicks: Direction[] = kicks.map(
      () => DIRECTIONS[Math.floor(Math.random() * 3)]
    );
    const goals = kicks.filter((k, i) => k !== goalieKicks[i]).length;
    const points = POINTS_MAP[goals] ?? 0;
    const refId = getTodayRef();

    const insertRes = await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, 'penalty', $2, $3, $4, NOW())
       ON CONFLICT (user_id, game_type, reference_id) DO NOTHING
       RETURNING id`,
      [user.userId, refId, points, JSON.stringify({ goals, goalieKicks })]
    );

    if (insertRes.rowCount === 0) {
      return NextResponse.json({ alreadyPlayed: true }, { status: 409 });
    }

    return NextResponse.json({ goals, goalieKicks, points, alreadyPlayed: false });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
