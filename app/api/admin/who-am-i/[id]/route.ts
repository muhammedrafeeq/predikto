import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// PUT — update entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json() as {
      playerName: string;
      aliases: string[];
      clues: string[];
      cluesMl: string[];
      active: boolean;
    };
    const { playerName, aliases, clues, cluesMl, active } = body;

    if (!playerName?.trim() || !Array.isArray(clues) || clues.length !== 6) {
      return NextResponse.json({ error: "playerName and exactly 6 clues are required" }, { status: 400 });
    }

    const res = await query(
      `UPDATE who_am_i_players
       SET player_name = $1, aliases = $2, clues = $3, clues_ml = $4, active = $5
       WHERE id = $6
       RETURNING id, player_name AS "playerName", aliases, clues, clues_ml AS "cluesMl", active`,
      [playerName.trim(), JSON.stringify(aliases ?? []), JSON.stringify(clues), JSON.stringify(cluesMl ?? []), active ?? true, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, player: res.rows[0] });
  } catch (error) {
    console.error("PUT who-am-i admin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove entry
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await query("DELETE FROM who_am_i_players WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE who-am-i admin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
