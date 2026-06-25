import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import webpush from "web-push";
import { dropMultipleCards } from "@/lib/cardDrop";

// Partial scoring for first goal minute: exact=3, ±5min=2, ±10min=1
function scoreFirstGoalMinute(predicted: string, correct: string): number {
  if (predicted === "no_goal" && correct === "no_goal") return 3;
  if (predicted === "no_goal" || correct === "no_goal") return 0;
  const diff = Math.abs(parseInt(predicted, 10) - parseInt(correct, 10));
  if (diff === 0) return 3;
  if (diff <= 5) return 2;
  if (diff <= 10) return 1;
  return 0;
}

export async function POST(
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

    const body = await request.json();
    const { winner, score, man_of_match, first_goal_minute, first_yellow_team, first_sub_team, extra_time } = body;

    if (winner === undefined || score === undefined) {
      return NextResponse.json(
        { error: "winner and score correct answers are required" },
        { status: 400 }
      );
    }

    // 1. Fetch match info
    const matchInfoRes = await query(
      "SELECT team_home, team_away FROM matches WHERE id = $1",
      [matchId]
    );
    if (matchInfoRes.rowCount === 0) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const { team_home: teamHome, team_away: teamAway } = matchInfoRes.rows[0];

    // 2. Fetch the match questions
    const questionsRes = await query(
      "SELECT id, type, points FROM questions WHERE match_id = $1",
      [matchId]
    );

    if (questionsRes.rowCount === 0) {
      return NextResponse.json({ error: "No questions found for this match" }, { status: 404 });
    }

    const questions = questionsRes.rows;

    // Build correct answers map
    const correctAnswers: Record<string, string> = {
      winner: winner.trim(),
      score: score.trim(),
    };
    if (man_of_match !== undefined && String(man_of_match).trim()) correctAnswers.man_of_match = String(man_of_match).trim();
    if (first_goal_minute !== undefined) correctAnswers.first_goal_minute = String(first_goal_minute).trim();
    if (first_yellow_team !== undefined) correctAnswers.first_yellow_team = String(first_yellow_team).trim();
    if (first_sub_team !== undefined) correctAnswers.first_sub_team = String(first_sub_team).trim();
    if (extra_time !== undefined) correctAnswers.extra_time = String(extra_time).trim();

    // 3. Insert correct answers into results table
    for (const q of questions) {
      const correctAns = correctAnswers[q.type];
      if (correctAns === undefined) continue;

      await query(
        `INSERT INTO results (match_id, question_id, correct_answer)
         VALUES ($1, $2, $3)
         ON CONFLICT (match_id, question_id)
         DO UPDATE SET correct_answer = EXCLUDED.correct_answer`,
        [matchId, q.id, correctAns]
      );
    }

    // 4. Fetch all predictions submitted for this match
    const predictionsRes = await query(
      `SELECT p.user_id, p.contest_id, p.question_id, p.answer, q.type, q.points
       FROM predictions p
       JOIN questions q ON p.question_id = q.id
       WHERE p.match_id = $1`,
      [matchId]
    );

    const resolveWinner = (answer: string) => {
      const a = answer.trim().toLowerCase();
      if (a === "home") return teamHome;
      if (a === "away") return teamAway;
      return answer;
    };

    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, " ");

    // Group predictions by user-contest
    const userContestPredictions: Record<
      string,
      { userId: number; contestId: number; preds: Array<{ type: string; answer: string; points: number }> }
    > = {};

    for (const row of predictionsRes.rows) {
      const key = `${row.user_id}-${row.contest_id}`;
      if (!userContestPredictions[key]) {
        userContestPredictions[key] = { userId: row.user_id, contestId: row.contest_id, preds: [] };
      }
      userContestPredictions[key].preds.push({
        type: row.type,
        answer: row.answer,
        points: parseInt(row.points, 10),
      });
    }

    const userMaxCorrect: Record<number, number> = {};

    // 5. Calculate and save scores
    for (const key of Object.keys(userContestPredictions)) {
      const { userId: uId, contestId: cId, preds } = userContestPredictions[key];
      let totalPoints = 0;
      let answeredCount = 0;
      let correctCount = 0;

      for (const pred of preds) {
        const correctAns = correctAnswers[pred.type];
        if (correctAns === undefined) continue;

        const predAnswer = pred.type === "winner" ? resolveWinner(pred.answer) : pred.answer;
        const isCorrect = normalize(predAnswer) === normalize(correctAns);
        if (isCorrect) {
          totalPoints += pred.points;
          correctCount++;
        }
        answeredCount++;
      }

      // All correct bonus: all 3 standard questions correct → +3 pts
      if (correctCount === 3) totalPoints += 3;

      if (correctCount > (userMaxCorrect[uId] ?? -1)) {
        userMaxCorrect[uId] = correctCount;
      }

      await query(
        `INSERT INTO scores (user_id, contest_id, match_id, points)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, contest_id, match_id)
         DO UPDATE SET points = EXCLUDED.points`,
        [uId, cId, matchId, totalPoints]
      );
    }

    // 6. Trigger card drops
    for (const uIdStr of Object.keys(userMaxCorrect)) {
      const uId = parseInt(uIdStr, 10);
      const maxCorrect = userMaxCorrect[uId];

      if (maxCorrect === 3) {
        await dropMultipleCards(uId, "perfect", 1, matchId);
        await dropMultipleCards(uId, "prediction", 2, matchId);
      } else if (maxCorrect > 0) {
        await dropMultipleCards(uId, "prediction", Math.min(maxCorrect, 3), matchId);
      }

      if (maxCorrect > 0) {
        const streakCheck = await query<any>(
          `SELECT s.points
           FROM scores s
           JOIN matches m ON s.match_id = m.id
           WHERE s.user_id = $1
             AND m.status = 'resulted'
             AND m.match_time < (SELECT match_time FROM matches WHERE id = $2)
           ORDER BY m.match_time DESC
           LIMIT 2`,
          [uId, matchId]
        );

        if (streakCheck.rows.length === 2 && streakCheck.rows.every((r: any) => r.points > 0)) {
          await dropMultipleCards(uId, "streak", 1, matchId);
        }
      }
    }

    // 7. Update match status to 'resulted'
    await query("UPDATE matches SET status = 'resulted' WHERE id = $1", [matchId]);

    // 8. Send notifications
    const notifTitle = "Results Published! 🏆";
    const notifBody = `${teamHome} vs ${teamAway} — ${correctAnswers.score}. Check your points!`;

    const allUsers = await query("SELECT id FROM users WHERE is_active = true");
    for (const u of allUsers.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [u.id, notifTitle, notifBody]
      ).catch(() => {});
    }

    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_EMAIL || "mailto:admin@predikto.app",
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        const subsRes = await query(
          "SELECT endpoint, p256dh, auth FROM push_subscriptions"
        ).catch(() => ({ rows: [] }));
        const pushPayload = JSON.stringify({ title: notifTitle, body: notifBody, url: "/matches" });
        for (const sub of subsRes.rows) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            );
          } catch {}
        }
      } catch (err) {
        console.error("Webpush setup error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Results published and user standings calculated successfully",
    });
  } catch (error) {
    console.error("POST Admin Match Results Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
