import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    // 1. Fetch Match Details
    const matchRes = await query(
      `SELECT id, team_home as "teamHome", team_away as "teamAway",
              match_time as "matchTime", deadline, status,
              COALESCE(is_knockout, false) as "isKnockout",
              knockout_round as "knockoutRound"
       FROM matches WHERE id = $1`,
      [matchId]
    );

    if (matchRes.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matchRes.rows[0];

    // 2. Fetch User Predictions
    const entriesRes = await query(
      `SELECT 
        p.user_id,
        u.name as user_name,
        u.phone as user_phone,
        q.type as question_type,
        p.answer as predicted_answer,
        r.correct_answer,
        s.points as match_score
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN questions q ON p.question_id = q.id
      LEFT JOIN results r ON p.question_id = r.question_id AND p.match_id = r.match_id
      LEFT JOIN scores s ON p.user_id = s.user_id AND p.match_id = s.match_id AND s.contest_id = p.contest_id
      WHERE p.match_id = $1
      ORDER BY u.name ASC`,
      [matchId]
    );

    const entriesMap = new Map();
    const teamHome = match.teamHome || "";
    const teamAway = match.teamAway || "";

    const resolveWinner = (answer: string) => {
      const a = answer.trim().toLowerCase();
      if (a === "home") return teamHome;
      if (a === "away") return teamAway;
      return answer;
    };

    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, " ");

    for (const row of entriesRes.rows) {
      const uId = row.user_id;
      if (!entriesMap.has(uId)) {
        entriesMap.set(uId, {
          userId: uId,
          userName: row.user_name,
          userPhone: row.user_phone,
          predictions: {},
          pointsEarned: row.match_score !== null ? parseInt(row.match_score, 10) : null,
        });
      }

      const userEntry = entriesMap.get(uId);
      const isWinnerQ = row.question_type === "winner";
      const predAnswer = isWinnerQ ? resolveWinner(row.predicted_answer) : row.predicted_answer;

      let isCorrect: boolean | null = null;
      if (row.correct_answer !== null) {
        if (row.question_type === "first_goal_minute") {
          const p = predAnswer?.trim() ?? "";
          const c = row.correct_answer?.trim() ?? "";
          if (p === "no_goal" && c === "no_goal") isCorrect = true;
          else if (p === "no_goal" || c === "no_goal") isCorrect = false;
          else isCorrect = Math.abs(parseInt(p, 10) - parseInt(c, 10)) <= 10;
        } else {
          isCorrect = normalize(predAnswer) === normalize(row.correct_answer);
        }
      }

      userEntry.predictions[row.question_type] = {
        answer: row.predicted_answer,
        correctAnswer: row.correct_answer,
        isCorrect,
      };
    }

    const entries = Array.from(entriesMap.values());

    // 3. Fetch Players for both teams
    const playersRes = await query(
      `SELECT name, team_name as "teamName"
       FROM players
       WHERE LOWER(team_name) = LOWER($1) OR LOWER(team_name) = LOWER($2)
       ORDER BY name ASC`,
      [match.teamHome, match.teamAway]
    );

    // 4. Fetch existing game results (first goal minute, formations)
    const firstGoalRes = await query(
      "SELECT first_goal_minute FROM first_goal_results WHERE match_id = $1",
      [matchId]
    );
    const formationRes = await query(
      "SELECT home_formation, away_formation FROM formation_results WHERE match_id = $1",
      [matchId]
    );

    // 5. Fetch all published correct answers for prefilling
    const publishedRes = await query(
      `SELECT q.type, r.correct_answer
       FROM results r
       JOIN questions q ON r.question_id = q.id
       WHERE r.match_id = $1`,
      [matchId]
    );
    const publishedResults: Record<string, string> = {};
    for (const row of publishedRes.rows) {
      publishedResults[row.type] = row.correct_answer;
    }

    return NextResponse.json({
      success: true,
      match,
      entries,
      players: playersRes.rows,
      firstGoalMinute: firstGoalRes.rows[0]?.first_goal_minute ?? null,
      homeFormation: formationRes.rows[0]?.home_formation ?? null,
      awayFormation: formationRes.rows[0]?.away_formation ?? null,
      publishedResults,
    });
  } catch (error) {
    console.error("GET Admin Match Entries Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
