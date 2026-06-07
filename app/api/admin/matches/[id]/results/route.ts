import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import webpush from "web-push";
import { dropMultipleCards } from "@/lib/cardDrop";

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
    const { winner, score, scorer } = body;

    if (winner === undefined || score === undefined || scorer === undefined) {
      return NextResponse.json(
        { error: "winner, score, and scorer correct answers are required" },
        { status: 400 }
      );
    }

    // 1. Fetch the match questions to map correct answers to question IDs
    const questionsRes = await query(
      "SELECT id, type, points FROM questions WHERE match_id = $1",
      [matchId]
    );

    if (questionsRes.rowCount === 0) {
      return NextResponse.json(
        { error: "No questions found for this match" },
        { status: 404 }
      );
    }

    const questions = questionsRes.rows;

    const correctAnswers: Record<string, string> = {
      winner: winner.trim(),
      score: score.trim(),
      scorer: scorer.trim(),
    };

    // 2. Insert correct answers into results table
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

    // 3. Fetch all predictions submitted by users for this match
    const predictionsRes = await query(
      `SELECT p.user_id, p.question_id, p.answer, q.type, q.points
       FROM predictions p
       JOIN questions q ON p.question_id = q.id
       WHERE p.match_id = $1`,
      [matchId]
    );

    // Fetch match teams for legacy answer resolution
    const matchRow2 = await query(
      "SELECT team_home, team_away FROM matches WHERE id = $1",
      [matchId]
    );
    const teamHome = matchRow2.rows[0]?.team_home ?? "";
    const teamAway = matchRow2.rows[0]?.team_away ?? "";

    const resolveWinner = (answer: string) => {
      const a = answer.trim().toLowerCase();
      if (a === "home") return teamHome;
      if (a === "away") return teamAway;
      return answer;
    };

    // Group predictions by user ID
    const userPredictions: Record<
      number,
      Array<{ type: string; answer: string; points: number }>
    > = {};

    for (const row of predictionsRes.rows) {
      const uId = row.user_id;
      if (!userPredictions[uId]) {
        userPredictions[uId] = [];
      }
      userPredictions[uId].push({
        type: row.type,
        answer: row.answer,
        points: parseInt(row.points, 10),
      });
    }

    // 4. Calculate points for each user and update the scores table
    for (const uIdStr of Object.keys(userPredictions)) {
      const uId = parseInt(uIdStr, 10);
      const preds = userPredictions[uId];
      let totalPoints = 0;
      let correctCount = 0;

      for (const pred of preds) {
        const correctAns = correctAnswers[pred.type];
        // Case insensitive and trim comparison
        const normalize = (s: string) => s.trim().toLowerCase().replace(/\s*-\s*/g, "-");
        const predAnswer = pred.type === "winner" ? resolveWinner(pred.answer) : pred.answer;
        if (
          correctAns !== undefined &&
          normalize(predAnswer) === normalize(correctAns)
        ) {
          totalPoints += pred.points;
          correctCount++;
        }
      }

      // Add 3 points bonus if all three questions were correct
      if (correctCount === 3) {
        totalPoints += 3;
      }

      // Write user score
      await query(
        `INSERT INTO scores (user_id, match_id, points)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, match_id)
         DO UPDATE SET points = EXCLUDED.points`,
        [uId, matchId, totalPoints]
      );

      // Card Collection drops integration
      if (correctCount === 3) {
        await dropMultipleCards(uId, "perfect", 1, matchId);
        await dropMultipleCards(uId, "prediction", 2, matchId);
      } else if (correctCount > 0) {
        await dropMultipleCards(uId, "prediction", correctCount, matchId);
      }

      // Check Hot Streak (3 correct predictions in a row)
      if (correctCount > 0) {
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
        if (streakCheck.rows.length === 2 && streakCheck.rows.every(r => r.points > 0)) {
          // Trigger hot streak bonus drop!
          await dropMultipleCards(uId, "streak", 1, matchId);
        }
      }
    }

    // 5. Update match status to 'resulted'
    await query(
      "UPDATE matches SET status = 'resulted' WHERE id = $1",
      [matchId]
    );

    // 6. Get match details for notification text
    const matchRes = await query(
      "SELECT team_home, team_away FROM matches WHERE id = $1",
      [matchId]
    );
    const matchRow = matchRes.rows[0];
    const notifTitle = "Results Published! 🏆";
    const notifBody = `${matchRow.team_home} vs ${matchRow.team_away} — ${correctAnswers.score}. Check your points!`;

    // 7. Fetch all users to create in-app notifications
    const allUsers = await query("SELECT id FROM users WHERE is_active = true");
    for (const u of allUsers.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [u.id, notifTitle, notifBody]
      ).catch(() => {}); // ignore if table doesn't exist yet
    }

    // 8. Send push to subscribed users
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL || "mailto:admin@predikto.app",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
    const subsRes = await query(
      "SELECT user_id, endpoint, p256dh, auth FROM push_subscriptions"
    ).catch(() => ({ rows: [] }));

    const pushPayload = JSON.stringify({ title: notifTitle, body: notifBody, url: "/matches" });
    for (const sub of subsRes.rows) {
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload
      ).catch(() => {}); // ignore failed pushes
    }

    return NextResponse.json({
      success: true,
      message: "Results published and user standings calculated successfully",
    });
  } catch (error) {
    console.error("POST Admin Match Results Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
