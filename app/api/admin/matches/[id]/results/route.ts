import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        if (
          correctAns !== undefined &&
          pred.answer.trim().toLowerCase() === correctAns.trim().toLowerCase()
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
    }

    // 5. Update match status to 'resulted'
    await query(
      "UPDATE matches SET status = 'resulted' WHERE id = $1",
      [matchId]
    );

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
