import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get upcoming matches
    const matchesRes = await query(
      `SELECT id, team_home, team_away, match_time, deadline
       FROM matches
       WHERE status = 'upcoming'
       ORDER BY match_time ASC`
    );

    // Get user's existing predictions for these matches
    const matchIds = matchesRes.rows.map((m) => m.id);
    let predictionsMap: Record<number, number> = {};
    let resultsMap: Record<number, { firstGoalMinute: number; points: number }> = {};

    if (matchIds.length > 0) {
      const predsRes = await query(
        `SELECT reference_id, metadata
         FROM game_scores
         WHERE user_id = $1 AND game_type = 'first_goal' AND reference_id = ANY($2::int[])`,
        [user.userId, matchIds]
      );
      for (const row of predsRes.rows) {
        const meta = row.metadata as { predictedMinute: number };
        predictionsMap[row.reference_id as number] = meta.predictedMinute;
      }
    }

    // Get all matches user has predicted on (including resulted ones)
    const allPredsRes = await query(
      `SELECT gs.reference_id, gs.points, gs.metadata, gs.played_at,
              m.team_home, m.team_away, m.match_time, m.status,
              fgr.first_goal_minute
       FROM game_scores gs
       JOIN matches m ON m.id = gs.reference_id
       LEFT JOIN first_goal_results fgr ON fgr.match_id = gs.reference_id
       WHERE gs.user_id = $1 AND gs.game_type = 'first_goal'
       ORDER BY gs.played_at DESC`,
      [user.userId]
    );

    const now = new Date();
    const upcomingMatches = matchesRes.rows.map((m, idx) => {
      const hoursUntilMatch = (new Date(m.match_time as string).getTime() - now.getTime()) / 36e5;
      const locked = idx >= 2 && hoursUntilMatch > 24;
      return {
        id: m.id as number,
        teamHome: m.team_home as string,
        teamAway: m.team_away as string,
        matchTime: m.match_time as string,
        deadline: m.deadline as string,
        userPrediction: (predictionsMap[m.id as number] ?? null) as number | null,
        locked,
      };
    });

    const pastPredictions = allPredsRes.rows.map((row) => ({
      matchId: row.reference_id as number,
      teamHome: row.team_home as string,
      teamAway: row.team_away as string,
      matchTime: row.match_time as string,
      matchStatus: row.status as string,
      predictedMinute: (row.metadata as { predictedMinute: number }).predictedMinute,
      actualMinute: (row.first_goal_minute as number | null) ?? null,
      points: row.points as number,
      playedAt: row.played_at as string,
    }));

    return NextResponse.json({ matches: upcomingMatches, pastPredictions });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json() as { matchId?: unknown; predictedMinute?: unknown };
    const { matchId, predictedMinute } = body;

    if (typeof matchId !== "number" || typeof predictedMinute !== "number") {
      return NextResponse.json({ error: "matchId and predictedMinute are required" }, { status: 400 });
    }

    if (!Number.isInteger(predictedMinute) || predictedMinute < 1 || predictedMinute > 90) {
      return NextResponse.json({ error: "predictedMinute must be an integer between 1 and 90" }, { status: 400 });
    }

    // Verify match exists, is upcoming, and deadline hasn't passed
    const matchRes = await query(
      `SELECT id, deadline, status FROM matches WHERE id = $1`,
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
      `SELECT COUNT(*) AS cnt FROM matches WHERE status = 'upcoming' AND match_time < $1`,
      [match.match_time]
    );
    const rank = parseInt((rankRes.rows[0] as { cnt: string }).cnt, 10);
    if (rank >= 2) {
      const hoursUntil = (new Date(match.match_time as string).getTime() - Date.now()) / 36e5;
      if (hoursUntil > 24) {
        return NextResponse.json({ error: "This match unlocks 24 hours before kick-off" }, { status: 403 });
      }
    }

    const insertRes = await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, 'first_goal', $2, 0, $3, NOW())
       ON CONFLICT (user_id, game_type, reference_id) DO NOTHING
       RETURNING id`,
      [user.userId, matchId, JSON.stringify({ predictedMinute })]
    );

    if (insertRes.rowCount === 0) {
      return NextResponse.json({ error: "You have already predicted for this match" }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
