import { NextRequest, NextResponse } from "next/server";
import { getOptionalAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

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

const FALLBACK_FLAGS = [
  // EASY: Top tier & major powerhouses
  { id: 1, country_name: "Argentina", flag_emoji: "🇦🇷", difficulty: "easy" },
  { id: 2, country_name: "Brazil", flag_emoji: "🇧🇷", difficulty: "easy" },
  { id: 3, country_name: "France", flag_emoji: "🇫🇷", difficulty: "easy" },
  { id: 4, country_name: "Germany", flag_emoji: "🇩🇪", difficulty: "easy" },
  { id: 5, country_name: "Spain", flag_emoji: "🇪🇸", difficulty: "easy" },
  { id: 6, country_name: "England", flag_emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", difficulty: "easy" },
  { id: 7, country_name: "Portugal", flag_emoji: "🇵🇹", difficulty: "easy" },
  { id: 8, country_name: "Netherlands", flag_emoji: "🇳🇱", difficulty: "easy" },
  { id: 9, country_name: "Italy", flag_emoji: "🇮🇹", difficulty: "easy" },
  { id: 10, country_name: "United States", flag_emoji: "🇺🇸", difficulty: "easy" },
  { id: 11, country_name: "Mexico", flag_emoji: "🇲🇽", difficulty: "easy" },
  { id: 12, country_name: "Canada", flag_emoji: "🇨🇦", difficulty: "easy" },
  { id: 13, country_name: "Japan", flag_emoji: "🇯🇵", difficulty: "easy" },
  { id: 14, country_name: "Uruguay", flag_emoji: "🇺🇾", difficulty: "easy" },
  { id: 15, country_name: "Croatia", flag_emoji: "🇭🇷", difficulty: "easy" },
  { id: 16, country_name: "Belgium", flag_emoji: "🇧🇪", difficulty: "easy" },
  { id: 17, country_name: "Colombia", flag_emoji: "🇨🇴", difficulty: "easy" },
  { id: 18, country_name: "South Korea", flag_emoji: "🇰🇷", difficulty: "easy" },
  { id: 19, country_name: "Morocco", flag_emoji: "🇲🇦", difficulty: "easy" },
  { id: 20, country_name: "Australia", flag_emoji: "🇦🇺", difficulty: "easy" },
  { id: 21, country_name: "Sweden", flag_emoji: "🇸🇪", difficulty: "easy" },
  { id: 22, country_name: "Switzerland", flag_emoji: "🇨🇭", difficulty: "easy" },
  { id: 23, country_name: "Poland", flag_emoji: "🇵🇱", difficulty: "easy" },
  { id: 24, country_name: "Denmark", flag_emoji: "🇩🇰", difficulty: "easy" },
  { id: 25, country_name: "Nigeria", flag_emoji: "🇳🇬", difficulty: "easy" },
  { id: 26, country_name: "Egypt", flag_emoji: "🇪🇬", difficulty: "easy" },
  { id: 27, country_name: "India", flag_emoji: "🇮🇳", difficulty: "easy" },

  // MEDIUM: Well-known international teams
  { id: 28, country_name: "Chile", flag_emoji: "🇨🇱", difficulty: "medium" },
  { id: 29, country_name: "Peru", flag_emoji: "🇵🇪", difficulty: "medium" },
  { id: 30, country_name: "Ecuador", flag_emoji: "🇪🇨", difficulty: "medium" },
  { id: 31, country_name: "Paraguay", flag_emoji: "🇵🇾", difficulty: "medium" },
  { id: 32, country_name: "Venezuela", flag_emoji: "🇻🇪", difficulty: "medium" },
  { id: 33, country_name: "Ghana", flag_emoji: "🇬🇭", difficulty: "medium" },
  { id: 34, country_name: "Ivory Coast", flag_emoji: "🇨🇮", difficulty: "medium" },
  { id: 35, country_name: "Cameroon", flag_emoji: "🇨🇲", difficulty: "medium" },
  { id: 36, country_name: "Senegal", flag_emoji: "🇸🇳", difficulty: "medium" },
  { id: 37, country_name: "Algeria", flag_emoji: "🇩🇿", difficulty: "medium" },
  { id: 38, country_name: "Tunisia", flag_emoji: "🇹🇳", difficulty: "medium" },
  { id: 39, country_name: "Iran", flag_emoji: "🇮🇷", difficulty: "medium" },
  { id: 40, country_name: "Qatar", flag_emoji: "🇶🇦", difficulty: "medium" },
  { id: 41, country_name: "Saudi Arabia", flag_emoji: "🇸🇦", difficulty: "medium" },
  { id: 42, country_name: "United Arab Emirates", flag_emoji: "🇦🇪", difficulty: "medium" },
  { id: 43, country_name: "Turkey", flag_emoji: "🇹🇷", difficulty: "medium" },
  { id: 44, country_name: "Ukraine", flag_emoji: "🇺🇦", difficulty: "medium" },
  { id: 45, country_name: "Serbia", flag_emoji: "🇷🇸", difficulty: "medium" },
  { id: 46, country_name: "Scotland", flag_emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", difficulty: "medium" },
  { id: 47, country_name: "Wales", flag_emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", difficulty: "medium" },
  { id: 48, country_name: "Austria", flag_emoji: "🇦🇹", difficulty: "medium" },
  { id: 49, country_name: "Greece", flag_emoji: "🇬🇷", difficulty: "medium" },
  { id: 50, country_name: "Norway", flag_emoji: "🇳🇴", difficulty: "medium" },
  { id: 51, country_name: "Czechia", flag_emoji: "🇨🇿", difficulty: "medium" },
  { id: 52, country_name: "Romania", flag_emoji: "🇷🇴", difficulty: "medium" },
  { id: 53, country_name: "South Africa", flag_emoji: "🇿🇦", difficulty: "medium" },
  { id: 54, country_name: "Mali", flag_emoji: "🇲🇱", difficulty: "medium" },
  { id: 55, country_name: "Costa Rica", flag_emoji: "🇨🇷", difficulty: "medium" },
  { id: 56, country_name: "Jamaica", flag_emoji: "🇯🇲", difficulty: "medium" },
  { id: 57, country_name: "Panama", flag_emoji: "🇵🇦", difficulty: "medium" },
  { id: 58, country_name: "Honduras", flag_emoji: "🇭🇳", difficulty: "medium" },
  { id: 59, country_name: "Iceland", flag_emoji: "🇮🇸", difficulty: "medium" },
  { id: 60, country_name: "Republic of Ireland", flag_emoji: "🇮🇪", difficulty: "medium" },
  { id: 61, country_name: "Finland", flag_emoji: "🇫🇮", difficulty: "medium" },
  { id: 62, country_name: "Iraq", flag_emoji: "🇮🇶", difficulty: "medium" },
  { id: 63, country_name: "Uzbekistan", flag_emoji: "🇺🇿", difficulty: "medium" },
  { id: 64, country_name: "China", flag_emoji: "🇨🇳", difficulty: "medium" },
  { id: 65, country_name: "New Zealand", flag_emoji: "🇳🇿", difficulty: "medium" },

  // HARD: Challenging international football nations
  { id: 66, country_name: "Cape Verde", flag_emoji: "🇨🇻", difficulty: "hard" },
  { id: 67, country_name: "Georgia", flag_emoji: "🇬🇪", difficulty: "hard" },
  { id: 68, country_name: "Albania", flag_emoji: "🇦🇱", difficulty: "hard" },
  { id: 69, country_name: "Slovakia", flag_emoji: "🇸🇰", difficulty: "hard" },
  { id: 70, country_name: "Slovenia", flag_emoji: "🇸🇮", difficulty: "hard" },
  { id: 71, country_name: "Bosnia and Herzegovina", flag_emoji: "🇧🇦", difficulty: "hard" },
  { id: 72, country_name: "Montenegro", flag_emoji: "🇲🇪", difficulty: "hard" },
  { id: 73, country_name: "North Macedonia", flag_emoji: "🇲🇰", difficulty: "hard" },
  { id: 74, country_name: "Luxembourg", flag_emoji: "🇱🇺", difficulty: "hard" },
  { id: 75, country_name: "Cyprus", flag_emoji: "🇨🇾", difficulty: "hard" },
  { id: 76, country_name: "Armenia", flag_emoji: "🇦🇲", difficulty: "hard" },
  { id: 77, country_name: "Azerbaijan", flag_emoji: "🇦🇿", difficulty: "hard" },
  { id: 78, country_name: "Kazakhstan", flag_emoji: "🇰🇿", difficulty: "hard" },
  { id: 79, country_name: "Jordan", flag_emoji: "🇯🇴", difficulty: "hard" },
  { id: 80, country_name: "Bahrain", flag_emoji: "🇧🇭", difficulty: "hard" },
  { id: 81, country_name: "Oman", flag_emoji: "🇴🇲", difficulty: "hard" },
  { id: 82, country_name: "Palestine", flag_emoji: "🇵🇸", difficulty: "hard" },
  { id: 83, country_name: "Syria", flag_emoji: "🇸🇾", difficulty: "hard" },
  { id: 84, country_name: "Thailand", flag_emoji: "🇹🇭", difficulty: "hard" },
  { id: 85, country_name: "Vietnam", flag_emoji: "🇻🇳", difficulty: "hard" },
  { id: 86, country_name: "Indonesia", flag_emoji: "🇮🇩", difficulty: "hard" },
  { id: 87, country_name: "Malaysia", flag_emoji: "🇲🇾", difficulty: "hard" },
  { id: 88, country_name: "Fiji", flag_emoji: "🇫🇯", difficulty: "hard" },
  { id: 89, country_name: "Haiti", flag_emoji: "🇭🇹", difficulty: "hard" },
  { id: 90, country_name: "Curaçao", flag_emoji: "🇨🇼", difficulty: "hard" },
  { id: 91, country_name: "Trinidad and Tobago", flag_emoji: "🇹🇹", difficulty: "hard" },
  { id: 92, country_name: "El Salvador", flag_emoji: "🇸🇻", difficulty: "hard" },
  { id: 93, country_name: "Bolivia", flag_emoji: "🇧🇴", difficulty: "hard" },
  { id: 94, country_name: "Burkina Faso", flag_emoji: "🇧🇫", difficulty: "hard" },
  { id: 95, country_name: "DR Congo", flag_emoji: "🇨🇩", difficulty: "hard" },
  { id: 96, country_name: "Zambia", flag_emoji: "🇿🇲", difficulty: "hard" },
  { id: 97, country_name: "Angola", flag_emoji: "🇦🇴", difficulty: "hard" },
  { id: 98, country_name: "Benin", flag_emoji: "🇧🇯", difficulty: "hard" },
  { id: 99, country_name: "Mauritania", flag_emoji: "🇲🇷", difficulty: "hard" },
  { id: 100, country_name: "Madagascar", flag_emoji: "🇲🇬", difficulty: "hard" },
  { id: 101, country_name: "Equatorial Guinea", flag_emoji: "🇬🇶", difficulty: "hard" },
  { id: 102, country_name: "Gabon", flag_emoji: "🇬🇦", difficulty: "hard" },
  { id: 103, country_name: "Mozambique", flag_emoji: "🇲🇿", difficulty: "hard" },
  { id: 104, country_name: "Northern Ireland", flag_emoji: "🇬🇧", difficulty: "hard" },
];

async function ensureFlagTable(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS flag_quiz_flags (
        id SERIAL PRIMARY KEY,
        country_name VARCHAR(100) NOT NULL,
        flag_emoji VARCHAR(10) NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium',
        active BOOLEAN DEFAULT true
      );
    `);
    const countRes = await query(`SELECT COUNT(*) FROM flag_quiz_flags`);
    const currentCount = parseInt(countRes.rows[0]?.count ?? "0", 10);

    if (currentCount < FALLBACK_FLAGS.length) {
      for (const f of FALLBACK_FLAGS) {
        await query(
          `INSERT INTO flag_quiz_flags (country_name, flag_emoji, difficulty, active)
           VALUES ($1, $2, $3, true)
           ON CONFLICT DO NOTHING`,
          [f.country_name, f.flag_emoji, f.difficulty]
        );
      }
    }
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    const user = await getOptionalAuth();
    const url = new URL(req.url);
    const diff = (url.searchParams.get("difficulty") as Difficulty) || "medium";
    const validDiffs: Difficulty[] = ["easy", "medium", "hard"];
    const difficulty = validDiffs.includes(diff) ? diff : "medium";
    const refId = getTodayRef();

    // Check already played if logged in
    if (user?.userId) {
      try {
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
      } catch {}
    }

    // Auto-create/seed table if missing
    await ensureFlagTable();

    let flags: { id: number; country_name: string; flag_emoji: string }[] = [];
    let allFlags: { id: number; country_name: string }[] = [];

    try {
      const flagRes = await query(
        `SELECT id, country_name, flag_emoji FROM flag_quiz_flags
         WHERE difficulty = $1 AND active = true
         ORDER BY RANDOM() LIMIT 10`,
        [difficulty]
      );
      flags = flagRes.rows as { id: number; country_name: string; flag_emoji: string }[];

      const allRes = await query(
        `SELECT id, country_name FROM flag_quiz_flags WHERE active = true`
      );
      allFlags = allRes.rows as { id: number; country_name: string }[];
    } catch {}

    // Fallback to static data if DB queries returned insufficient rows
    if (!flags || flags.length < 4) {
      const diffFlags = FALLBACK_FLAGS.filter((f) => f.difficulty === difficulty || difficulty === "medium");
      flags = shuffle(diffFlags.length >= 4 ? diffFlags : FALLBACK_FLAGS).slice(0, 10);
      allFlags = FALLBACK_FLAGS;
    }

    const questions = flags.map((flag) => {
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
    const user = await getOptionalAuth();
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

    // Prevent duplicate submission if logged in
    if (user?.userId) {
      const existing = await query(
        `SELECT id FROM game_scores WHERE user_id = $1 AND game_type = 'flag_quiz' AND reference_id = $2 AND metadata->>'difficulty' = $3`,
        [user.userId, refId, difficulty]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        return NextResponse.json({ error: "Already played today" }, { status: 409 });
      }
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

    if (user?.userId) {
      await query(
        `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata)
         VALUES ($1, 'flag_quiz', $2, $3, $4)`,
        [user.userId, refId, totalPoints, JSON.stringify({ difficulty, date: new Date().toISOString().slice(0, 10), correct: correctCount, total: answers.length })]
      );
    }

    return NextResponse.json({ success: true, results, totalPoints, streakBonus, correctCount });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
