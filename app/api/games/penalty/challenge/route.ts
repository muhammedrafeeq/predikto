import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const DIRECTIONS = ["left", "center", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];
const POINTS_MAP: Record<number, number> = { 5: 20, 4: 15, 3: 10, 2: 5, 1: 2, 0: 0 };

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { kicks, goalieKicks, goals, points } = body as {
      kicks: Direction[];
      goalieKicks: Direction[];
      goals: number;
      points: number;
    };

    // Validate kicks
    if (!Array.isArray(kicks) || kicks.length !== 5) {
      return NextResponse.json({ error: "Must provide exactly 5 kicks" }, { status: 400 });
    }
    for (const k of kicks) {
      if (!DIRECTIONS.includes(k)) {
        return NextResponse.json({ error: "Invalid kick direction" }, { status: 400 });
      }
    }

    // Validate goalieKicks
    if (!Array.isArray(goalieKicks) || goalieKicks.length !== 5) {
      return NextResponse.json({ error: "Must provide exactly 5 goalie kicks" }, { status: 400 });
    }
    for (const k of goalieKicks) {
      if (!DIRECTIONS.includes(k)) {
        return NextResponse.json({ error: "Invalid goalie kick direction" }, { status: 400 });
      }
    }

    // Validate goals
    if (typeof goals !== "number" || goals < 0 || goals > 5) {
      return NextResponse.json({ error: "Invalid goals value" }, { status: 400 });
    }

    // Validate points
    const expectedPoints = POINTS_MAP[goals] ?? 0;
    if (points !== expectedPoints) {
      return NextResponse.json({ error: "Invalid points value" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO penalty_challenges
        (creator_id, creator_name, creator_kicks, creator_goalie_kicks, creator_goals, creator_points)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        user.userId,
        user.name,
        JSON.stringify(kicks),
        JSON.stringify(goalieKicks),
        goals,
        points,
      ]
    );

    const challengeId = res.rows[0].id as string;
    return NextResponse.json({ challengeId });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
