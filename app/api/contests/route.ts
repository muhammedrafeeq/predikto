import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// Helper to generate a unique random 6-character join code
async function generateUniqueJoinCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars like O, 0, I, 1
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const check = await query("SELECT id FROM contests WHERE join_code = $1", [code]);
    if (check.rowCount === 0) {
      isUnique = true;
    }
  }
  return code;
}

// GET /api/contests - Get all contests current user is in
export async function GET() {
  try {
    const user = await requireAuth();

    // Query for contests where current user is a member
    const result = await query(
      `SELECT 
        c.id, 
        c.name, 
        c.game_type as "gameType", 
        c.join_code as "joinCode", 
        c.created_at as "createdAt",
        t.name as "tournamentName",
        (SELECT COUNT(*)::int FROM contest_members WHERE contest_id = c.id) as "memberCount",
        creator.name as "creatorName"
       FROM contest_members cm
       JOIN contests c ON cm.contest_id = c.id
       JOIN tournaments t ON c.tournament_id = t.id
       LEFT JOIN users creator ON c.creator_id = creator.id
       WHERE cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ success: true, contests: result.rows });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

// POST /api/contests - Create a new contest
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json() as { name?: string; tournamentId?: number; gameType?: string };
    const { name, tournamentId, gameType } = body;

    if (!name || !tournamentId || !gameType) {
      return NextResponse.json(
        { error: "name, tournamentId, and gameType are required fields" },
        { status: 400 }
      );
    }

    // Validate tournament exists
    const tourcheck = await query("SELECT id FROM tournaments WHERE id = $1", [tournamentId]);
    if (tourcheck.rowCount === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Validate gameType
    const validGameTypes = ["match_prediction", "first_goal", "formation", "bracket"];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json({ error: "Invalid gameType" }, { status: 400 });
    }

    const joinCode = await generateUniqueJoinCode();

    // Insert contest
    const contestRes = await query(
      `INSERT INTO contests (name, tournament_id, game_type, join_code, creator_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, game_type as "gameType", join_code as "joinCode"`,
      [name, tournamentId, gameType, joinCode, user.userId]
    );

    const contest = contestRes.rows[0];

    // Creator automatically becomes a member of the contest
    await query(
      `INSERT INTO contest_members (contest_id, user_id)
       VALUES ($1, $2)`,
      [contest.id, user.userId]
    );

    return NextResponse.json({ success: true, contest }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
