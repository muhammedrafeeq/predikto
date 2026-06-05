import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const contestId = parseInt(id, 10);

    if (isNaN(contestId)) {
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    // 1. Fetch contest and game type details
    const contestRes = await query(
      `SELECT c.id, c.name, c.game_type AS "gameType", c.tournament_id AS "tournamentId"
       FROM contests c
       WHERE c.id = $1`,
      [contestId]
    );

    if (contestRes.rowCount === 0) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const contest = contestRes.rows[0];
    const gameType = contest.gameType;

    // 2. Fetch members
    const membersRes = await query(
      `SELECT u.id, u.name, u.phone
       FROM contest_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.contest_id = $1
       ORDER BY u.name ASC`,
      [contestId]
    );
    const members = membersRes.rows;

    // 3. Fetch entries based on gameType
    if (gameType === "match_prediction") {
      // Fetch all matches in tournament
      const matchesRes = await query(
        `SELECT m.id, m.team_home AS "teamHome", m.team_away AS "teamAway", m.match_time AS "matchTime"
         FROM matches m
         WHERE m.tournament_id = $1
         ORDER BY m.match_time ASC`,
        [contest.tournamentId]
      );
      const matches = matchesRes.rows;

      // Fetch all predictions in this contest
      const predictionsRes = await query(
        `SELECT 
          p.user_id AS "userId",
          p.match_id AS "matchId",
          q.type AS "questionType",
          p.answer,
          r.correct_answer AS "correctAnswer",
          s.points AS "pointsEarned"
         FROM predictions p
         JOIN questions q ON p.question_id = q.id
         LEFT JOIN results r ON p.question_id = r.question_id AND p.match_id = r.match_id
         LEFT JOIN scores s ON p.user_id = s.user_id AND p.match_id = s.match_id AND s.contest_id = p.contest_id
         WHERE p.contest_id = $1`,
        [contestId]
      );

      // Structure predictions by user and match
      const userPredictionsMap: Record<number, Record<number, any>> = {};
      for (const pred of predictionsRes.rows) {
        const uId = pred.userId;
        const mId = pred.matchId;
        if (!userPredictionsMap[uId]) {
          userPredictionsMap[uId] = {};
        }
        if (!userPredictionsMap[uId][mId]) {
          userPredictionsMap[uId][mId] = {
            predictions: {},
            pointsEarned: pred.pointsEarned,
          };
        }
        userPredictionsMap[uId][mId].predictions[pred.questionType] = {
          answer: pred.answer,
          correctAnswer: pred.correctAnswer,
          isCorrect: pred.correctAnswer !== null ? pred.answer === pred.correctAnswer : null,
        };
      }

      return NextResponse.json({
        success: true,
        gameType,
        contestName: contest.name,
        members,
        matches,
        userEntries: userPredictionsMap,
      });

    } else if (gameType === "first_goal") {
      // Fetch all matches in tournament
      const matchesRes = await query(
        `SELECT m.id, m.team_home AS "teamHome", m.team_away AS "teamAway", m.match_time AS "matchTime"
         FROM matches m
         WHERE m.tournament_id = $1
         ORDER BY m.match_time ASC`,
        [contest.tournamentId]
      );
      const matches = matchesRes.rows;

      // Fetch first goal results
      const resultsRes = await query(
        `SELECT match_id AS "matchId", first_goal_minute AS "minute" FROM first_goal_results`
      );
      const correctMinutes: Record<number, number> = {};
      for (const r of resultsRes.rows) {
        correctMinutes[r.matchId] = r.minute;
      }

      // Fetch game scores for first_goal
      const scoresRes = await query(
        `SELECT user_id AS "userId", reference_id AS "matchId", points, metadata
         FROM game_scores
         WHERE contest_id = $1 AND game_type = 'first_goal'`,
        [contestId]
      );

      const userEntriesMap: Record<number, Record<number, any>> = {};
      for (const score of scoresRes.rows) {
        const uId = score.userId;
        const mId = score.matchId;
        if (!userEntriesMap[uId]) {
          userEntriesMap[uId] = {};
        }
        let predictedMinute = null;
        try {
          const meta = typeof score.metadata === "string" ? JSON.parse(score.metadata) : score.metadata;
          predictedMinute = meta?.predictedMinute ?? null;
        } catch {}

        userEntriesMap[uId][mId] = {
          predictedMinute,
          pointsEarned: score.points,
          correctMinute: correctMinutes[mId] ?? null,
        };
      }

      return NextResponse.json({
        success: true,
        gameType,
        contestName: contest.name,
        members,
        matches,
        userEntries: userEntriesMap,
      });

    } else if (gameType === "formation") {
      // Fetch all matches in tournament
      const matchesRes = await query(
        `SELECT m.id, m.team_home AS "teamHome", m.team_away AS "teamAway", m.match_time AS "matchTime"
         FROM matches m
         WHERE m.tournament_id = $1
         ORDER BY m.match_time ASC`,
        [contest.tournamentId]
      );
      const matches = matchesRes.rows;

      // Fetch formation results
      const resultsRes = await query(
        `SELECT match_id AS "matchId", home_formation AS "home", away_formation AS "away" FROM formation_results`
      );
      const correctFormations: Record<number, any> = {};
      for (const r of resultsRes.rows) {
        correctFormations[r.matchId] = { home: r.home, away: r.away };
      }

      // Fetch game scores for formation
      const scoresRes = await query(
        `SELECT user_id AS "userId", reference_id AS "matchId", points, metadata
         FROM game_scores
         WHERE contest_id = $1 AND game_type = 'formation'`,
        [contestId]
      );

      const userEntriesMap: Record<number, Record<number, any>> = {};
      for (const score of scoresRes.rows) {
        const uId = score.userId;
        const mId = score.matchId;
        if (!userEntriesMap[uId]) {
          userEntriesMap[uId] = {};
        }
        let homeFormation = null;
        let awayFormation = null;
        try {
          const meta = typeof score.metadata === "string" ? JSON.parse(score.metadata) : score.metadata;
          homeFormation = meta?.homeFormation ?? null;
          awayFormation = meta?.awayFormation ?? null;
        } catch {}

        userEntriesMap[uId][mId] = {
          homeFormation,
          awayFormation,
          pointsEarned: score.points,
          correct: correctFormations[mId] ?? null,
        };
      }

      return NextResponse.json({
        success: true,
        gameType,
        contestName: contest.name,
        members,
        matches,
        userEntries: userEntriesMap,
      });

    } else if (gameType === "bracket") {
      // Fetch game scores for bracket
      const scoresRes = await query(
        `SELECT user_id AS "userId", points, metadata
         FROM game_scores
         WHERE contest_id = $1 AND game_type = 'bracket'`,
        [contestId]
      );

      const userEntriesMap: Record<number, any> = {};
      for (const score of scoresRes.rows) {
        const uId = score.userId;
        let predictions = {};
        try {
          const meta = typeof score.metadata === "string" ? JSON.parse(score.metadata) : score.metadata;
          predictions = meta?.predictions ?? meta ?? {};
        } catch {}

        userEntriesMap[uId] = {
          predictions,
          pointsEarned: score.points,
        };
      }

      return NextResponse.json({
        success: true,
        gameType,
        contestName: contest.name,
        members,
        userEntries: userEntriesMap,
      });
    }

    return NextResponse.json({ error: "Unsupported game type" }, { status: 400 });

  } catch (error) {
    console.error("GET Contest Entries Admin API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
