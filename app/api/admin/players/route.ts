import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET /api/admin/players?q=search&team=teamName
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const team = url.searchParams.get("team")?.trim() ?? "";

    let res;
    if (team) {
      res = await query(
        `SELECT DISTINCT name, name_ml AS "nameMl", team_name AS "teamName", is_star
         FROM players
         WHERE LOWER(team_name) = LOWER($1)
         ORDER BY name ASC`,
        [team]
      );
    } else if (q.length >= 2) {
      res = await query(
        `SELECT DISTINCT name, name_ml AS "nameMl", team_name AS "teamName", is_star
         FROM players
         WHERE name ILIKE $1
         ORDER BY name ASC
         LIMIT 20`,
        [`%${q}%`]
      );
    } else {
      res = await query(
        `SELECT DISTINCT name, name_ml AS "nameMl", team_name AS "teamName", is_star
         FROM players
         ORDER BY name ASC
         LIMIT 50`
      );
    }

    return NextResponse.json({ success: true, players: res.rows });
  } catch (error) {
    console.error("GET admin players error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/players — update name_ml and/or is_star for a player
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, teamName, nameMl, is_star } = await req.json();
    if (!name || !teamName) {
      return NextResponse.json({ error: "name and teamName are required" }, { status: 400 });
    }
    await query(
      `UPDATE players SET name_ml = $1, is_star = COALESCE($2, is_star) WHERE name = $3 AND LOWER(team_name) = LOWER($4)`,
      [nameMl ?? '', is_star ?? null, name, teamName]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT admin players error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/players — add a new player
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, teamName, nameMl } = await req.json();
    if (!name || !teamName) {
      return NextResponse.json({ error: "name and teamName are required" }, { status: 400 });
    }
    await query(
      `INSERT INTO players (name, team_name, name_ml)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_name, name) DO UPDATE SET name_ml = EXCLUDED.name_ml`,
      [name, teamName, nameMl ?? '']
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST admin players error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
