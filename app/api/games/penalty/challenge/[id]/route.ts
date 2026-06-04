import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const DIRECTIONS = ["left", "center", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];
const POINTS_MAP: Record<number, number> = { 5: 20, 4: 15, 3: 10, 2: 5, 1: 2, 0: 0 };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await query(
      `SELECT
         id,
         creator_name,
         creator_goals,
         creator_points,
         creator_kicks,
         creator_goalie_kicks,
         status,
         challenger_name,
         challenger_goals,
         challenger_points,
         challenger_kicks,
         challenger_goalie_kicks,
         expires_at
       FROM penalty_challenges
       WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const row = res.rows[0];
    const expired = new Date(row.expires_at) < new Date();

    return NextResponse.json({
      id: row.id,
      creatorName: row.creator_name,
      creatorGoals: row.creator_goals,
      creatorPoints: row.creator_points,
      creatorKicks: row.creator_kicks,
      creatorGoalieKicks: row.creator_goalie_kicks,
      status: row.status,
      challengerName: row.challenger_name ?? null,
      challengerGoals: row.challenger_goals ?? null,
      challengerPoints: row.challenger_points ?? null,
      challengerKicks: row.challenger_kicks ?? null,
      challengerGoalieKicks: row.challenger_goalie_kicks ?? null,
      expired,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const kicks: Direction[] = body.kicks;

    // Validate kicks
    if (!Array.isArray(kicks) || kicks.length !== 5) {
      return NextResponse.json({ error: "Must provide exactly 5 kicks" }, { status: 400 });
    }
    for (const k of kicks) {
      if (!DIRECTIONS.includes(k)) {
        return NextResponse.json({ error: "Invalid kick direction" }, { status: 400 });
      }
    }

    // Fetch challenge
    const res = await query(
      `SELECT creator_id, status, expires_at, challenger_id FROM penalty_challenges WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const challenge = res.rows[0];

    if (new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json({ error: "This challenge has expired" }, { status: 410 });
    }

    if (challenge.status !== "pending") {
      return NextResponse.json({ error: "Challenge already completed" }, { status: 409 });
    }

    if (challenge.challenger_id !== null) {
      return NextResponse.json({ error: "Challenge already completed" }, { status: 409 });
    }

    if (challenge.creator_id === user.userId) {
      return NextResponse.json({ error: "You cannot challenge yourself" }, { status: 400 });
    }

    // Server generates goalie kicks — never trust client
    const goalieKicks: Direction[] = kicks.map(
      () => DIRECTIONS[Math.floor(Math.random() * 3)]
    );
    const goals = kicks.filter((k, i) => k !== goalieKicks[i]).length;
    const points = POINTS_MAP[goals] ?? 0;

    await query(
      `UPDATE penalty_challenges
       SET
         challenger_id = $1,
         challenger_name = $2,
         challenger_kicks = $3,
         challenger_goalie_kicks = $4,
         challenger_goals = $5,
         challenger_points = $6,
         status = 'completed'
       WHERE id = $7`,
      [
        user.userId,
        user.name,
        JSON.stringify(kicks),
        JSON.stringify(goalieKicks),
        goals,
        points,
        id,
      ]
    );

    return NextResponse.json({ goals, goalieKicks, points });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
