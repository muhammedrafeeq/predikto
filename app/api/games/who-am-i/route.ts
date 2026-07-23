import { NextRequest, NextResponse } from "next/server";
import { getOptionalAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

const POINTS_BY_CLUE: Record<number, number> = { 1: 15, 2: 12, 3: 9, 4: 6, 5: 3, 6: 1 };

function getTodayRef(): number {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`, 10);
}

async function getTodayPlayer() {
  const res = await query(
    `SELECT id, player_name, aliases, clues, clues_ml FROM who_am_i_players WHERE active = true ORDER BY id ASC`
  );
  if (res.rowCount === 0) return null;
  const players = res.rows;
  const index = getTodayRef() % players.length;
  return players[index];
}

function fuzzyMatch(guess: string, playerName: string, aliases: string[]): boolean {
  const g = guess.trim().toLowerCase();
  if (!g) return false;
  const targets = [playerName.toLowerCase(), ...aliases.map((a: string) => a.toLowerCase())];
  return targets.some((t) => t === g || t.includes(g) || g.includes(t));
}

export async function GET(_req: NextRequest) {
  try {
    await getOptionalAuth();
    const player = await getTodayPlayer();
    if (!player) {
      return NextResponse.json({ error: "No players configured yet" }, { status: 503 });
    }

    const clues = Array.isArray(player.clues) ? player.clues : JSON.parse(player.clues ?? "[]");
    const cluesMl = Array.isArray(player.clues_ml) ? player.clues_ml : JSON.parse(player.clues_ml ?? "[]");

    return NextResponse.json({ played: false, clues, cluesMl });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOptionalAuth();
    const body = await req.json();
    const { guess, cluesRevealed } = body as { guess: string; cluesRevealed: number };

    if (typeof guess !== "string" || typeof cluesRevealed !== "number") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const player = await getTodayPlayer();
    if (!player) {
      return NextResponse.json({ error: "No players configured" }, { status: 503 });
    }

    const aliases: string[] = Array.isArray(player.aliases) ? player.aliases : JSON.parse(player.aliases ?? "[]");
    const correct = fuzzyMatch(guess, player.player_name, aliases);
    const clueNum = Math.max(1, Math.min(6, cluesRevealed));
    const isLastClue = clueNum >= 6;
    const refId = getTodayRef() % 2147483647;

    if (correct) {
      const points = POINTS_BY_CLUE[clueNum] ?? 1;
      if (user?.userId) {
        await query(
          `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
           VALUES ($1, 'who_am_i', $2, $3, $4, NOW())
           ON CONFLICT (user_id, game_type, reference_id) DO NOTHING`,
          [user.userId, refId, points, JSON.stringify({ cluesRevealed: clueNum, correct: true, guess })]
        );
      }
      return NextResponse.json({ correct: true, points, playerName: player.player_name, gameOver: true });
    }

    if (isLastClue) {
      if (user?.userId) {
        await query(
          `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
           VALUES ($1, 'who_am_i', $2, 0, $3, NOW())
           ON CONFLICT (user_id, game_type, reference_id) DO NOTHING`,
          [user.userId, refId, JSON.stringify({ cluesRevealed: clueNum, correct: false, guess })]
        );
      }
      return NextResponse.json({ correct: false, points: 0, playerName: player.player_name, gameOver: true });
    }

    return NextResponse.json({ correct: false, gameOver: false, nextClueNumber: clueNum + 1 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
