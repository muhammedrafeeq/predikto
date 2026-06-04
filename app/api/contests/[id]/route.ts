import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const contestId = parseInt(id, 10);

    if (isNaN(contestId)) {
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    // 1. Verify user is a member of this contest
    const membership = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contestId, user.userId]
    );

    if (membership.rowCount === 0 && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. You are not a member of this contest." }, { status: 403 });
    }

    // 2. Fetch contest and tournament details
    const contestRes = await query(
      `SELECT 
        c.id, 
        c.name, 
        c.game_type as "gameType", 
        c.join_code as "joinCode", 
        c.created_at as "createdAt",
        c.creator_id as "creatorId",
        t.name as "tournamentName",
        t.id as "tournamentId"
       FROM contests c
       JOIN tournaments t ON c.tournament_id = t.id
       WHERE c.id = $1`,
      [contestId]
    );

    if (contestRes.rowCount === 0) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const contest = contestRes.rows[0];

    // 3. Fetch contest members list
    const membersRes = await query(
      `SELECT u.id, u.name, u.role, cm.joined_at as "joinedAt"
       FROM contest_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.contest_id = $1
       ORDER BY cm.joined_at ASC`,
      [contestId]
    );

    return NextResponse.json({
      success: true,
      contest,
      members: membersRes.rows,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
