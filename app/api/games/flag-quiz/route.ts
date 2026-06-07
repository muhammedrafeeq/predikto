import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import { dropCard } from "@/lib/cardDrop";

type Difficulty = "easy" | "medium" | "hard";

const DIFF_MULTIPLIER: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const DIFF_TIME: Record<Difficulty, number> = { easy: 20, medium: 15, hard: 10 };

function getTodayRef(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcStreakBonus(results: { correct: boolean }[]): number {
  let bonus = 0, streak = 0;
  for (const r of results) {
    if (r.correct) { streak++; if (streak >= 3) bonus += 1; }
    else streak = 0;
  }
  return bonus;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const diff = (url.searchParams.get("difficulty") as Difficulty) || "medium";
    const validDiffs: Difficulty[] = ["easy", "medium", "hard"];
    const difficulty = validDiffs.includes(diff) ? diff : "medium";
    const refId = getTodayRef();

    // Check already played
    const played = await query(
      `SELECT points, metadata FROM game_scores
       WHERE user_id = $1 AND game_type = 'flag_quiz' AND reference_id = $2
         AND metadata->>'difficulty' = $3`,
      [user.userId, refId, difficulty]
    );
    if (played.rowCount && played.rowCount > 0) {
      return NextResponse.json({
        played: true,
        points: played.rows[0].points,
        correct: played.rows[0].metadata?.correct ?? 0,
        difficulty,
        timeLimit: DIFF_TIME[difficulty],
      });
    }

    // Fetch 10 random active flags for this difficulty
    const flagRes = await query(
      `SELECT id, country_name, flag_emoji FROM flag_quiz_flags
       WHERE difficulty = $1 AND active = true
       ORDER BY RANDOM() LIMIT 10`,
      [difficulty]
    );

    if (!flagRes.rows || flagRes.rows.length < 4) {
      return NextResponse.json({ error: "Not enough flags configured for this difficulty" }, { status: 503 });
    }

    // Fetch all active flags for wrong options pool
    const allRes = await query(
      `SELECT id, country_name FROM flag_quiz_flags WHERE active = true`
    );
    const allFlags = allRes.rows as { id: number; country_name: string }[];

    const questions = flagRes.rows.map((flag) => {
      const wrong = shuffle(allFlags.filter((f) => f.id !== flag.id))
        .slice(0, 3)
        .map((f) => f.country_name);
      const options = shuffle([flag.country_name, ...wrong]);
      return {
        id: flag.id,
        flagEmoji: flag.flag_emoji,
        options,
        correctAnswer: flag.country_name,
      };
    });

    return NextResponse.json({ played: false, questions, difficulty, timeLimit: DIFF_TIME[difficulty] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

interface AnswerInput {
  flagId: number;
  answer: string;
  correctAnswer: string;
  timeSpent: number;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { answers, difficulty } = body as { answers: AnswerInput[]; difficulty: Difficulty };

    const validDiffs: Difficulty[] = ["easy", "medium", "hard"];
    if (!validDiffs.includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "answers required" }, { status: 400 });
    }

    const refId = getTodayRef();

    // Prevent duplicate submission
    const existing = await query(
      `SELECT id FROM game_scores WHERE user_id = $1 AND game_type = 'flag_quiz' AND reference_id = $2 AND metadata->>'difficulty' = $3`,
      [user.userId, refId, difficulty]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: "Already played today" }, { status: 409 });
    }

    const mult = DIFF_MULTIPLIER[difficulty];

    const results = answers.map((a) => {
      const correct = a.answer === a.correctAnswer;
      let speedPts = 0;
      if (correct) {
        if (a.timeSpent < 5) speedPts = 3;
        else if (a.timeSpent < 10) speedPts = 2;
        else speedPts = 1;
      }
      return { flagId: a.flagId, correct, points: speedPts * mult, timeSpent: a.timeSpent };
    });

    const basePoints = results.reduce((s, r) => s + r.points, 0);
    const streakBonus = calcStreakBonus(results);
    const totalPoints = basePoints + streakBonus;
    const correctCount = results.filter((r) => r.correct).length;

    await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata)
       VALUES ($1, 'flag_quiz', $2, $3, $4)`,
      [user.userId, refId, totalPoints, JSON.stringify({ difficulty, date: new Date().toISOString().slice(0, 10), correct: correctCount, total: answers.length })]
    );

    // Drop card if at least 5 correct answers are obtained
    let droppedCard = null;
    if (correctCount >= 5) {
      const card = await dropCard(user.userId, "trivia");
      if (card) {
        droppedCard = card;
      }
    }

    return NextResponse.json({ success: true, results, totalPoints, streakBonus, correctCount, droppedCard });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
