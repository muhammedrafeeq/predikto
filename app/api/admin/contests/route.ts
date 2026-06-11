import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// Helper to generate a unique random 6-character join code
async function generateUniqueJoinCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let isUnique = false;
  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const check = await query("SELECT id FROM contests WHERE join_code = $1", [code]);
    if (check.rowCount === 0) isUnique = true;
  }
  return code;
}

// GET /api/admin/contests — list all contests with members + tournament info
export async function GET() {
  try {
    await requireAdmin();
    const result = await query(
      `SELECT
        c.id,
        c.name,
        c.name_ml         AS "nameMl",
        c.game_type       AS "gameType",
        c.game_types      AS "gameTypes",
        c.join_code       AS "joinCode",
        c.created_at      AS "createdAt",
        c.is_public       AS "isPublic",
        t.id              AS "tournamentId",
        t.name            AS "tournamentName",
        creator.name      AS "creatorName",
        (SELECT COUNT(*)::int FROM contest_members WHERE contest_id = c.id) AS "memberCount"
       FROM contests c
       JOIN tournaments t ON c.tournament_id = t.id
       LEFT JOIN users creator ON c.creator_id = creator.id
       ORDER BY c.created_at DESC`
    );

    return NextResponse.json({ success: true, contests: result.rows });
  } catch (error) {
    console.error("GET Admin Contests Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/contests — create a new contest (admin bypass)
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, nameMl, tournamentId, gameType, gameTypes, isPublic } = body as {
      name?: string;
      nameMl?: string;
      tournamentId?: number;
      gameType?: string;
      gameTypes?: string[];
      isPublic?: boolean;
    };

    if (!name || (!gameType && (!gameTypes || gameTypes.length === 0))) {
      return NextResponse.json(
        { error: "name and gameTypes are required" },
        { status: 400 }
      );
    }

    const tId = tournamentId || 1;

    const validGameTypes = ["match_prediction", "first_goal", "formation", "bracket"];
    // Resolve final game types array
    const resolvedGameTypes: string[] = gameTypes && gameTypes.length > 0
      ? gameTypes
      : [gameType as string];
    if (resolvedGameTypes.some((t) => !validGameTypes.includes(t))) {
      return NextResponse.json({ error: "Invalid gameType" }, { status: 400 });
    }
    // Primary game_type is first entry (for backward compat)
    const primaryGameType = resolvedGameTypes[0];

    // Validate tournament
    const tourCheck = await query("SELECT id FROM tournaments WHERE id = $1", [tId]);
    if (tourCheck.rowCount === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const joinCode = await generateUniqueJoinCode();

    const res = await query(
      `INSERT INTO contests (name, name_ml, tournament_id, game_type, game_types, join_code, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, name_ml AS "nameMl", game_type AS "gameType", game_types AS "gameTypes", join_code AS "joinCode", created_at AS "createdAt", is_public AS "isPublic"`,
      [name.trim(), (nameMl ?? "").trim(), tId, primaryGameType, resolvedGameTypes, joinCode, !!isPublic]
    );

    const contest = res.rows[0];

    // Fetch tournament name for response
    const tRes = await query("SELECT name FROM tournaments WHERE id = $1", [tId]);

    return NextResponse.json(
      {
        success: true,
        contest: {
          ...contest,
          tournamentId,
          tournamentName: tRes.rows[0]?.name ?? "",
          creatorName: "Admin",
          memberCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Admin Contests Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
