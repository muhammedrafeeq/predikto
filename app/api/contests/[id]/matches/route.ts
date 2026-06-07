import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const ALLOWED_FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const contestId = parseInt(id, 10);

    if (isNaN(contestId)) {
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    // 1. Verify user is in contest
    const membership = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contestId, user.userId]
    );

    if (membership.rowCount === 0 && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. You are not a member of this contest." }, { status: 403 });
    }

    // 2. Fetch contest metadata
    const contestRes = await query(
      `SELECT tournament_id as "tournamentId", game_type as "gameType" 
       FROM contests WHERE id = $1`,
      [contestId]
    );

    if (contestRes.rowCount === 0) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const { tournamentId, gameType } = contestRes.rows[0];

    // 3. Return results formatted by gameType
    if (gameType === "match_prediction") {
      const matchesRes = await query(
        `SELECT 
          m.id, 
          m.team_home as "teamHome", 
          m.team_away as "teamAway", 
          m.match_time as "matchTime", 
          m.deadline, 
          m.status,
          EXISTS(
            SELECT 1 FROM predictions p 
            WHERE p.match_id = m.id AND p.user_id = $1 AND p.contest_id = $2
          ) as "userPredicted",
          (
            SELECT p.answer FROM predictions p
            JOIN questions q ON p.question_id = q.id
            WHERE p.match_id = m.id AND p.user_id = $1 AND p.contest_id = $2 AND q.type = 'score'
            LIMIT 1
          ) as "predictedScore",
          (
            SELECT p.answer FROM predictions p
            JOIN questions q ON p.question_id = q.id
            WHERE p.match_id = m.id AND p.user_id = $1 AND p.contest_id = $2 AND q.type = 'winner'
            LIMIT 1
          ) as "predictedWinner",
          (
            SELECT p.answer FROM predictions p
            JOIN questions q ON p.question_id = q.id
            WHERE p.match_id = m.id AND p.user_id = $1 AND p.contest_id = $2 AND q.type = 'scorer'
            LIMIT 1
          ) as "predictedScorer",
          s.points as "pointsEarned"
        FROM matches m
        LEFT JOIN scores s ON m.id = s.match_id AND s.user_id = $1 AND s.contest_id = $2
        WHERE m.tournament_id = $3
        ORDER BY m.match_time ASC`,
        [user.userId, contestId, tournamentId]
      );

      return NextResponse.json({
        success: true,
        gameType,
        matches: matchesRes.rows,
      });
    } 
    
    if (gameType === "first_goal") {
      // Get upcoming matches for this tournament
      const matchesRes = await query(
        `SELECT id, team_home as "teamHome", team_away as "teamAway", match_time as "matchTime", deadline
         FROM matches
         WHERE status = 'upcoming' AND tournament_id = $1
         ORDER BY match_time ASC`,
        [tournamentId]
      );

      // Fetch user's predictions for this contest
      const matchIds = matchesRes.rows.map((m) => m.id);
      let predictionsMap: Record<number, number> = {};

      if (matchIds.length > 0) {
        const predsRes = await query(
          `SELECT reference_id, metadata
           FROM game_scores
           WHERE user_id = $1 AND contest_id = $2 AND game_type = 'first_goal' AND reference_id = ANY($3::int[])`,
          [user.userId, contestId, matchIds]
        );
        for (const row of predsRes.rows) {
          const meta = row.metadata as { predictedMinute: number };
          predictionsMap[row.reference_id as number] = meta.predictedMinute;
        }
      }

      // Fetch all predictions in this contest (including resulted)
      const allPredsRes = await query(
        `SELECT gs.reference_id, gs.points, gs.metadata, gs.played_at,
                m.team_home, m.team_away, m.match_time, m.status,
                fgr.first_goal_minute
         FROM game_scores gs
         JOIN matches m ON m.id = gs.reference_id
         LEFT JOIN first_goal_results fgr ON fgr.match_id = gs.reference_id
         WHERE gs.user_id = $1 AND gs.contest_id = $2 AND gs.game_type = 'first_goal'
         ORDER BY gs.played_at DESC`,
        [user.userId, contestId]
      );

      const now = new Date();
      const upcomingMatches = matchesRes.rows.map((m, idx) => {
        const hoursUntilMatch = (new Date(m.matchTime as string).getTime() - now.getTime()) / 36e5;
        // Lock rules: first 2 are always open; others lock 24h before
        const locked = idx >= 2 && hoursUntilMatch > 24;
        return {
          id: m.id as number,
          teamHome: m.teamHome as string,
          teamAway: m.teamAway as string,
          matchTime: m.matchTime as string,
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

      return NextResponse.json({
        success: true,
        gameType,
        matches: upcomingMatches,
        pastPredictions,
      });
    }

    if (gameType === "formation") {
      // Get upcoming matches
      const matchesRes = await query(
        `SELECT id, team_home as "teamHome", team_away as "teamAway", match_time as "matchTime", deadline
         FROM matches
         WHERE status = 'upcoming' AND tournament_id = $1
         ORDER BY match_time ASC`,
        [tournamentId]
      );

      const matchIds = matchesRes.rows.map((m) => m.id);
      const predictionsMap: Record<number, { homeFormation?: string; awayFormation?: string }> = {};

      if (matchIds.length > 0) {
        const predsRes = await query(
          `SELECT reference_id, metadata
           FROM game_scores
           WHERE user_id = $1 AND contest_id = $2 AND game_type = 'formation' AND reference_id = ANY($3::int[])`,
          [user.userId, contestId, matchIds]
        );
        for (const row of predsRes.rows) {
          predictionsMap[row.reference_id as number] = row.metadata as { homeFormation?: string; awayFormation?: string };
        }
      }

      // Get past predictions
      const pastRes = await query(
        `SELECT gs.reference_id, gs.points, gs.metadata, gs.played_at,
                m.team_home, m.team_away, m.match_time, m.status,
                fr.home_formation AS actual_home, fr.away_formation AS actual_away
         FROM game_scores gs
         JOIN matches m ON m.id = gs.reference_id
         LEFT JOIN formation_results fr ON fr.match_id = gs.reference_id
         WHERE gs.user_id = $1 AND gs.contest_id = $2 AND gs.game_type = 'formation'
         ORDER BY gs.played_at DESC`,
        [user.userId, contestId]
      );

      const now = new Date();
      const upcomingMatches = matchesRes.rows.map((m, idx) => {
        const hoursUntilMatch = (new Date(m.matchTime as string).getTime() - now.getTime()) / 36e5;
        const locked = idx >= 2 && hoursUntilMatch > 24;
        return {
          id: m.id as number,
          teamHome: m.teamHome as string,
          teamAway: m.teamAway as string,
          matchTime: m.matchTime as string,
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

      return NextResponse.json({
        success: true,
        gameType,
        matches: upcomingMatches,
        pastPredictions,
        formations: ALLOWED_FORMATIONS,
      });
    }

    if (gameType === "bracket") {
      // Bracket is a single entry for the tournament
      const [bracketRes, resultsRes] = await Promise.all([
        query(
          `SELECT points, metadata, played_at FROM game_scores
           WHERE user_id = $1 AND contest_id = $2 AND game_type = 'bracket' AND reference_id = $3`,
          [user.userId, contestId, tournamentId]
        ),
        query(
          `SELECT stage, matchup, winner, recorded_at FROM bracket_results ORDER BY recorded_at ASC`
        ),
      ]);

      const results = resultsRes.rows;

      if (bracketRes.rows.length === 0) {
        return NextResponse.json({ success: true, gameType, submitted: false, results });
      }

      const row = bracketRes.rows[0];
      return NextResponse.json({
        success: true,
        gameType,
        submitted: true,
        points: row.points,
        submittedAt: row.played_at,
        bracket: row.metadata,
        results,
      });
    }

    return NextResponse.json({ error: "Invalid contest game type" }, { status: 400 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
