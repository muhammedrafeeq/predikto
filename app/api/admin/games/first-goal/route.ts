import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

function calcPoints(predicted: number, actual: number): number {
  const diff = Math.abs(predicted - actual);
  if (diff === 0) return 20; // exact
  if (diff <= 2) return 15;
  if (diff <= 5) return 10;
  if (diff <= 10) return 5;
  return 0;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json() as { matchId?: unknown; firstGoalMinute?: unknown };
    const { matchId, firstGoalMinute } = body;

    if (typeof matchId !== "number" || typeof firstGoalMinute !== "number") {
      return NextResponse.json({ error: "matchId and firstGoalMinute are required" }, { status: 400 });
    }

    if (!Number.isInteger(firstGoalMinute) || firstGoalMinute < 1 || firstGoalMinute > 120) {
      return NextResponse.json({ error: "firstGoalMinute must be between 1 and 120" }, { status: 400 });
    }

    // Upsert first_goal_results
    await query(
      `INSERT INTO first_goal_results (match_id, first_goal_minute, recorded_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (match_id) DO UPDATE
         SET first_goal_minute = EXCLUDED.first_goal_minute,
             recorded_at = NOW()`,
      [matchId, firstGoalMinute]
    );

    // Recalculate points for all predictions on this match
    const predsRes = await query(
      `SELECT id, metadata FROM game_scores
       WHERE game_type = 'first_goal' AND reference_id = $1`,
      [matchId]
    );

    let updated = 0;
    for (const row of predsRes.rows) {
      const meta = row.metadata as { predictedMinute: number };
      const pts = calcPoints(meta.predictedMinute, firstGoalMinute);
      await query(
        `UPDATE game_scores SET points = $1 WHERE id = $2`,
        [pts, row.id]
      );
      updated++;
    }

    return NextResponse.json({
      success: true,
      firstGoalMinute,
      predictionsUpdated: updated,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
