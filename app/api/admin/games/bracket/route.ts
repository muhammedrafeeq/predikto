import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────────────────────
type Stage = "group_winner" | "r16" | "qf" | "sf" | "final";

interface BracketData {
  groups: { [groupLetter: string]: { first: string; second: string } };
  r16: string[];
  qf: string[];
  sf: string[];
  final: string[];
  winner: string;
}

// ── Points per stage ─────────────────────────────────────────────────────────
function pointsForStage(stage: Stage): number {
  switch (stage) {
    case "group_winner": return 2;
    case "r16":          return 3;
    case "qf":           return 5;
    case "sf":           return 8;
    case "final":        return 8;
    default:             return 0;
  }
}

// ── Derive user points from their full bracket given ALL known results ────────
function calcTotalPoints(
  bracket: BracketData,
  allResults: { stage: string; matchup: string; winner: string }[]
): number {
  let pts = 0;

  for (const r of allResults) {
    const stage = r.stage as Stage;
    const matchup = r.matchup;
    const winner = r.winner;

    if (stage === "group_winner") {
      // matchup format: "A1" (group A, 1st place) or "A2" (group A, 2nd place)
      const group = matchup[0];
      const slot = matchup[1]; // "1" or "2"
      const g = bracket.groups[group];
      if (g) {
        if (slot === "1" && g.first === winner) pts += pointsForStage(stage);
        if (slot === "2" && g.second === winner) pts += pointsForStage(stage);
      }
    } else if (stage === "r16") {
      // matchup format: "R16_0" to "R16_15"
      const idx = parseInt(matchup.split("_")[1], 10);
      if (!isNaN(idx) && bracket.r16[idx] === winner) pts += pointsForStage(stage);
    } else if (stage === "qf") {
      const idx = parseInt(matchup.split("_")[1], 10);
      if (!isNaN(idx) && bracket.qf[idx] === winner) pts += pointsForStage(stage);
    } else if (stage === "sf") {
      const idx = parseInt(matchup.split("_")[1], 10);
      if (!isNaN(idx) && bracket.sf[idx] === winner) pts += pointsForStage(stage);
    } else if (stage === "final") {
      // matchup: "FINAL_0" / "FINAL_1" = finalist, "FINAL_WINNER" = champion
      if (matchup === "FINAL_WINNER") {
        if (bracket.winner === winner) pts += 15;
      } else {
        const idx = parseInt(matchup.split("_")[1], 10);
        if (!isNaN(idx) && bracket.final[idx] === winner) pts += pointsForStage(stage);
      }
    }
  }

  return pts;
}

// ── GET — return all recorded results ────────────────────────────────────────
export async function GET() {
  try {
    await requireAdmin();

    const res = await query(
      `SELECT id, stage, matchup, winner, recorded_at FROM bracket_results ORDER BY recorded_at ASC`
    );

    return NextResponse.json({ success: true, results: res.rows });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

// ── POST — record a result and recalculate user points ───────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json() as { stage?: unknown; matchup?: unknown; winner?: unknown };
    const { stage, matchup, winner } = body;

    const validStages: Stage[] = ["group_winner", "r16", "qf", "sf", "final"];
    if (typeof stage !== "string" || !validStages.includes(stage as Stage)) {
      return NextResponse.json(
        { error: "stage must be one of: group_winner, r16, qf, sf, final" },
        { status: 400 }
      );
    }
    if (typeof matchup !== "string" || matchup.trim() === "") {
      return NextResponse.json({ error: "matchup is required" }, { status: 400 });
    }
    if (typeof winner !== "string" || winner.trim() === "") {
      return NextResponse.json({ error: "winner is required" }, { status: 400 });
    }

    // Upsert the result
    await query(
      `INSERT INTO bracket_results (stage, matchup, winner, recorded_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (matchup) DO UPDATE
         SET stage       = EXCLUDED.stage,
             winner      = EXCLUDED.winner,
             recorded_at = NOW()`,
      [stage, matchup.trim(), winner.trim()]
    );

    // Fetch ALL results (including the one we just upserted) to recalculate from scratch
    const allResultsRes = await query(
      `SELECT stage, matchup, winner FROM bracket_results`
    );
    const allResults = allResultsRes.rows as { stage: string; matchup: string; winner: string }[];

    // Fetch all user bracket submissions
    const predsRes = await query(
      `SELECT id, metadata FROM game_scores WHERE game_type = 'bracket'`
    );

    let updated = 0;
    for (const row of predsRes.rows) {
      const bracket = row.metadata as BracketData;
      const pts = calcTotalPoints(bracket, allResults);
      await query(`UPDATE game_scores SET points = $1 WHERE id = $2`, [pts, row.id]);
      updated++;
    }

    return NextResponse.json({
      success: true,
      stage,
      matchup,
      winner,
      predictionsUpdated: updated,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
