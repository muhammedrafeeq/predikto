import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const teamIdParam = url.searchParams.get("teamId");
    const rarity = url.searchParams.get("rarity");
    const search = url.searchParams.get("search");

    let sql = `
      SELECT pc.*, t.name as team_name, t.flag_emoji 
      FROM player_cards pc
      JOIN teams t ON pc.team_id = t.id
      WHERE pc.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (teamIdParam) {
      const teamId = parseInt(teamIdParam, 10);
      if (!isNaN(teamId)) {
        sql += ` AND pc.team_id = $${paramIndex}`;
        params.push(teamId);
        paramIndex++;
      }
    }

    if (rarity) {
      sql += ` AND pc.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }

    if (search) {
      sql += ` AND pc.player_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY t.name ASC, pc.player_name ASC`;

    const res = await query<any>(sql, params);

    return NextResponse.json({ cards: res.rows });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      teamId,
      playerName,
      position,
      jerseyNumber,
      rarity,
      overallRating,
      stats,
    } = body;

    // Validate fields
    if (
      !teamId ||
      !playerName ||
      !position ||
      !rarity ||
      !overallRating ||
      !stats
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["GK", "DEF", "MID", "FWD"].includes(position)) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    if (!["common", "rare", "epic", "legendary"].includes(rarity)) {
      return NextResponse.json({ error: "Invalid rarity" }, { status: 400 });
    }

    const ratingVal = parseInt(overallRating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 99) {
      return NextResponse.json({ error: "Overall rating must be between 1 and 99" }, { status: 400 });
    }

    // Insert
    const insertRes = await query<any>(
      `INSERT INTO player_cards (team_id, player_name, position, jersey_number, rarity, overall_rating, stats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        parseInt(teamId, 10),
        playerName,
        position,
        jerseyNumber ? parseInt(jerseyNumber, 10) : null,
        rarity,
        ratingVal,
        JSON.stringify(stats),
      ]
    );

    return NextResponse.json({ success: true, cardId: insertRes.rows[0].id });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
