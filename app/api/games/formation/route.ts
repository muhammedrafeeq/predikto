import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const ALLOWED_FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"];

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const matchesRes = await query(
      `SELECT id, team_home, team_away, match_time, deadline
       FROM matches
       WHERE status = 'upcoming'
       ORDER BY match_time ASC`
    );

    const matchIds = matchesRes.rows.map((m) => m.id);
    const predictionsMap: Record<number, { homeFormation?: string; awayFormation?: string }> = {};

    if (matchIds.length > 0) {
      const predsRes = await query(
        `SELECT reference_id, metadata
         FROM game_scores
         WHERE user_id = $1 AND game_type = 'formation' AND reference_id = ANY($2::int[])`,
        [user.userId, matchIds]
      );
      for (const row of predsRes.rows) {
        predictionsMap[row.reference_id as number] = row.metadata as { homeFormation?: string; awayFormation?: string };
      }
    }

    // Get past predictions with results
    const pastRes = await query(
      `SELECT gs.reference_id, gs.points, gs.metadata, gs.played_at,
              m.team_home, m.team_away, m.match_time, m.status,
              fr.home_formation AS actual_home, fr.away_formation AS actual_away
       FROM game_scores gs
       JOIN matches m ON m.id = gs.reference_id
       LEFT JOIN formation_results fr ON fr.match_id = gs.reference_id
       WHERE gs.user_id = $1 AND gs.game_type = 'formation'
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
        userPrediction: predictionsMap[m.id as number] ?? null,
        locked,
      };
    });

    const pastPredictions = pastRes.rows.map((row) => {
      const meta = row.metadata as { homeFormation?: string; awayFormation?: string };
      return {
        matchId: row.reference_id as number,
        teamHome: row.team_home as string,
        teamAway: row.team_away as string,
        matchTime: row.match_time as string,
        matchStatus: row.status as string,
        predictedHome: meta.homeFormation ?? null,
        predictedAway: meta.awayFormation ?? null,
        actualHome: (row.actual_home as string | null) ?? null,
        actualAway: (row.actual_away as string | null) ?? null,
        points: row.points as number,
        playedAt: row.played_at as string,
      };
    });

    return NextResponse.json({ matches: upcomingMatches, pastPredictions, formations: ALLOWED_FORMATIONS });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json() as { matchId?: unknown; homeFormation?: unknown; awayFormation?: unknown };
    const { matchId, homeFormation, awayFormation } = body;

    if (typeof matchId !== "number") {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    if (!homeFormation && !awayFormation) {
      return NextResponse.json({ error: "At least one formation (home or away) must be provided" }, { status: 400 });
    }

    if (homeFormation && !ALLOWED_FORMATIONS.includes(homeFormation as string)) {
      return NextResponse.json({ error: `Invalid home formation. Must be one of: ${ALLOWED_FORMATIONS.join(", ")}` }, { status: 400 });
    }

    if (awayFormation && !ALLOWED_FORMATIONS.includes(awayFormation as string)) {
      return NextResponse.json({ error: `Invalid away formation. Must be one of: ${ALLOWED_FORMATIONS.join(", ")}` }, { status: 400 });
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

    const metadata = {
      homeFormation: homeFormation ?? null,
      awayFormation: awayFormation ?? null,
    };

    const insertRes = await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, 'formation', $2, 0, $3, NOW())
       ON CONFLICT (user_id, game_type, reference_id) DO NOTHING
       RETURNING id`,
      [user.userId, matchId, JSON.stringify(metadata)]
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
