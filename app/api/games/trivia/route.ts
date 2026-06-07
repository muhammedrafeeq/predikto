import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

type Difficulty = "easy" | "medium" | "hard";

function calcStreakBonus(results: { correct: boolean }[]): number {
  let bonus = 0;
  let streak = 0;
  for (const r of results) {
    if (r.correct) {
      streak++;
      if (streak >= 3) bonus += 1;
    } else {
      streak = 0;
    }
  }
  return bonus;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const url = new URL(req.url);
    const diff = (url.searchParams.get("difficulty") as Difficulty) || "medium";
    const validDiffs: Difficulty[] = ["easy", "medium", "hard"];
    const difficulty = validDiffs.includes(diff) ? diff : "medium";

    const res = await query(
      `SELECT id, question, question_ml, options, options_ml, correct_index
       FROM trivia_questions
       WHERE difficulty = $1 AND active = true
       ORDER BY RANDOM()
       LIMIT 10`,
      [difficulty]
    );

    const questions = res.rows.map((r) => ({
      id: r.id,
      question: r.question,
      question_ml: r.question_ml,
      options: r.options,
      correct_index: r.correct_index,
      options_ml: r.options_ml,
    }));

    return NextResponse.json({ played: false, questions, difficulty });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

interface AnswerInput {
  questionId: number;
  answerIndex: number;
  timeSpent: number;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const answers: AnswerInput[] = body.answers;
    const difficulty: Difficulty = body.difficulty ?? "medium";

    if (!Array.isArray(answers) || answers.length !== 10) {
      return NextResponse.json({ error: "Must provide exactly 10 answers" }, { status: 400 });
    }

    const ids = answers.map((a) => a.questionId);
    const dbRes = await query(
      `SELECT id, correct_index, explanation, explanation_ml
       FROM trivia_questions
       WHERE id = ANY($1)`,
      [ids]
    );

    const qMap = new Map(dbRes.rows.map((r) => [r.id as number, r]));

    const diffMult: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
    const mult = diffMult[difficulty];

    let totalPoints = 0;
    let correct = 0;

    const results = answers.map((ans) => {
      const q = qMap.get(ans.questionId);
      if (!q) return { correct: false, correctIndex: -1, points: 0, explanation: "", explanation_ml: "" };

      const isCorrect = ans.answerIndex === q.correct_index;
      let pts = 0;
      if (isCorrect) {
        const speedPts = ans.timeSpent < 10 ? 3 : ans.timeSpent < 20 ? 2 : 1;
        pts = speedPts * mult;
      }
      totalPoints += pts;
      if (isCorrect) correct++;
      return {
        correct: isCorrect,
        correctIndex: q.correct_index,
        points: pts,
        explanation: q.explanation,
        explanation_ml: q.explanation_ml,
      };
    });

    const streakBonus = calcStreakBonus(results);
    totalPoints += streakBonus;

    await query(
      `INSERT INTO game_scores (user_id, contest_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, NULL, 'trivia', $2, $3, $4, NOW())`,
      [user.userId, null, totalPoints, JSON.stringify({ correct, difficulty, answers })]
    );

    return NextResponse.json({ results, totalPoints, correct, streakBonus });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
