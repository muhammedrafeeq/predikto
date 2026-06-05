import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const POINTS_MAP: Record<number, number> = { 5: 20, 4: 15, 3: 10, 2: 5, 1: 2, 0: 0 };
const DIRECTIONS = ["left", "center", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    // Total all-time points
    const totRes = await query(
      `SELECT COALESCE(SUM(points),0)::int AS total FROM game_scores WHERE user_id = $1 AND game_type = 'penalty'`,
      [user.userId]
    );

    // Last 7 days stats: one row per calendar day with best score, total goals, games
    const careerRes = await query(
      `SELECT
         DATE(played_at) AS day,
         MAX(points)::int AS best_pts,
         SUM((metadata->>'goals')::int)::int AS total_goals,
         COUNT(*)::int AS games
       FROM game_scores
       WHERE user_id = $1
         AND game_type = 'penalty'
         AND played_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(played_at)
       ORDER BY day DESC`,
      [user.userId]
    );

    const sevenDayBest = careerRes.rows.length > 0
      ? Math.max(...careerRes.rows.map((r: { best_pts: number }) => r.best_pts))
      : 0;

    const totalGames = careerRes.rows.reduce((s: number, r: { games: number }) => s + r.games, 0);
    const totalGoals = careerRes.rows.reduce((s: number, r: { total_goals: number }) => s + (r.total_goals ?? 0), 0);

    return NextResponse.json({
      played: false,
      totalPoints: totRes.rows[0].total,
      career: {
        sevenDayBest,
        totalGames,
        totalGoals,
        days: careerRes.rows,
      },
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

    const goalieKicks: Direction[] = kicks.map(() => DIRECTIONS[Math.floor(Math.random() * 3)]);
    const goals = kicks.filter((k, i) => k !== goalieKicks[i]).length;
    const points = POINTS_MAP[goals] ?? 0;
    const refId = Date.now();

    await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, 'penalty', $2, $3, $4, NOW())`,
      [user.userId, refId, points, JSON.stringify({ goals, goalieKicks })]
    );

    return NextResponse.json({ goals, goalieKicks, points, alreadyPlayed: false });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
