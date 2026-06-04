import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const ALLOWED_FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"];

function calcFormationPoints(
  meta: { homeFormation?: string | null; awayFormation?: string | null },
  actualHome: string,
  actualAway: string
): number {
  let pts = 0;
  if (meta.homeFormation && meta.homeFormation === actualHome) pts += 10;
  if (meta.awayFormation && meta.awayFormation === actualAway) pts += 10;
  return pts;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json() as { matchId?: unknown; homeFormation?: unknown; awayFormation?: unknown };
    const { matchId, homeFormation, awayFormation } = body;

    if (typeof matchId !== "number") {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }
    if (typeof homeFormation !== "string" || !ALLOWED_FORMATIONS.includes(homeFormation)) {
      return NextResponse.json({ error: `Invalid homeFormation. Must be one of: ${ALLOWED_FORMATIONS.join(", ")}` }, { status: 400 });
    }
    if (typeof awayFormation !== "string" || !ALLOWED_FORMATIONS.includes(awayFormation)) {
      return NextResponse.json({ error: `Invalid awayFormation. Must be one of: ${ALLOWED_FORMATIONS.join(", ")}` }, { status: 400 });
    }

    // Upsert formation_results
    await query(
      `INSERT INTO formation_results (match_id, home_formation, away_formation, recorded_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (match_id) DO UPDATE
         SET home_formation = EXCLUDED.home_formation,
             away_formation = EXCLUDED.away_formation,
             recorded_at = NOW()`,
      [matchId, homeFormation, awayFormation]
    );

    // Recalculate points for all user predictions on this match
    const predsRes = await query(
      `SELECT id, metadata FROM game_scores
       WHERE game_type = 'formation' AND reference_id = $1`,
      [matchId]
    );

    let updated = 0;
    for (const row of predsRes.rows) {
      const meta = row.metadata as { homeFormation?: string | null; awayFormation?: string | null };
      const pts = calcFormationPoints(meta, homeFormation, awayFormation);
      await query(
        `UPDATE game_scores SET points = $1 WHERE id = $2`,
        [pts, row.id]
      );
      updated++;
    }

    return NextResponse.json({
      success: true,
      homeFormation,
      awayFormation,
      predictionsUpdated: updated,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
