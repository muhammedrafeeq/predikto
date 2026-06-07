import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET — list all who-am-i player entries
export async function GET() {
  try {
    await requireAdmin();
    const res = await query(
      `SELECT id, player_name AS "playerName", aliases, clues, clues_ml AS "cluesMl", active, created_at AS "createdAt"
       FROM who_am_i_players
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ success: true, players: res.rows });
  } catch (error) {
    console.error("GET who-am-i admin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create a new entry
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as {
      playerName: string;
      aliases: string[];
      clues: string[];
      cluesMl: string[];
    };

    const { playerName, aliases, clues, cluesMl } = body;
    if (!playerName?.trim() || !Array.isArray(clues) || clues.length !== 6) {
      return NextResponse.json({ error: "playerName and exactly 6 clues are required" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO who_am_i_players (player_name, aliases, clues, clues_ml)
       VALUES ($1, $2, $3, $4)
       RETURNING id, player_name AS "playerName", aliases, clues, clues_ml AS "cluesMl", active`,
      [playerName.trim(), JSON.stringify(aliases ?? []), JSON.stringify(clues), JSON.stringify(cluesMl ?? [])]
    );
    return NextResponse.json({ success: true, player: res.rows[0] });
  } catch (error) {
    console.error("POST who-am-i admin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
