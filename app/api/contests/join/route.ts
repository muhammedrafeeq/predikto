import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// POST /api/contests/join - Join a contest via code
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json() as { joinCode?: string };
    const { joinCode } = body;

    if (!joinCode) {
      return NextResponse.json({ error: "Join code is required" }, { status: 400 });
    }

    const trimmedCode = joinCode.trim().toUpperCase();

    // Find the contest
    const contestRes = await query(
      `SELECT id, name, game_type as "gameType" FROM contests WHERE join_code = $1`,
      [trimmedCode]
    );

    if (contestRes.rowCount === 0) {
      return NextResponse.json({ error: "Invalid join code. Contest not found." }, { status: 404 });
    }

    const contest = contestRes.rows[0];

    // Check if user is already a member
    const memberCheck = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contest.id, user.userId]
    );

    if (memberCheck.rowCount && memberCheck.rowCount > 0) {
      return NextResponse.json({
        success: true,
        message: "You are already a member of this contest",
        contestId: contest.id,
        gameType: contest.gameType,
        name: contest.name,
      });
    }

    // Add user as member
    await query(
      `INSERT INTO contest_members (contest_id, user_id) VALUES ($1, $2)`,
      [contest.id, user.userId]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully joined contest: ${contest.name}!`,
      contestId: contest.id,
      gameType: contest.gameType,
      name: contest.name,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
