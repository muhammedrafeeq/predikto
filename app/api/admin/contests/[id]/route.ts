import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET /api/admin/contests/[id] — get contest details + member list
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const contestRes = await query(
      `SELECT
        c.id,
        c.name,
        c.game_type  AS "gameType",
        c.join_code  AS "joinCode",
        c.created_at AS "createdAt",
        t.name       AS "tournamentName",
        creator.name AS "creatorName"
       FROM contests c
       JOIN tournaments t ON c.tournament_id = t.id
       LEFT JOIN users creator ON c.creator_id = creator.id
       WHERE c.id = $1`,
      [id]
    );

    if (contestRes.rowCount === 0) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const membersRes = await query(
      `SELECT
        u.id,
        u.name,
        u.phone,
        u.role,
        u.is_active AS "isActive",
        cm.joined_at AS "joinedAt",
        COUNT(DISTINCT p.id)::int AS "predictionsCount"
       FROM contest_members cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN predictions p ON p.user_id = u.id AND p.contest_id = cm.contest_id
       WHERE cm.contest_id = $1
       GROUP BY u.id, u.name, u.phone, u.role, u.is_active, cm.joined_at
       ORDER BY cm.joined_at ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      contest: contestRes.rows[0],
      members: membersRes.rows,
    });
  } catch (error) {
    console.error("GET Admin Contest[id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/contests/[id] — delete contest + cascade
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Cascade delete in order
    await query("DELETE FROM game_scores WHERE contest_id = $1", [id]);
    await query("DELETE FROM scores WHERE contest_id = $1", [id]);
    await query("DELETE FROM predictions WHERE contest_id = $1", [id]);
    await query("DELETE FROM contest_members WHERE contest_id = $1", [id]);

    const res = await query("DELETE FROM contests WHERE id = $1 RETURNING id", [id]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Admin Contest[id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/contests/[id] — add or remove a member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json() as { action: "add" | "remove"; userId: number };
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: "action and userId are required" }, { status: 400 });
    }

    if (action === "add") {
      // Check user exists
      const userCheck = await query("SELECT id FROM users WHERE id = $1", [userId]);
      if (userCheck.rowCount === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await query(
        "INSERT INTO contest_members (contest_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, userId]
      );
    } else if (action === "remove") {
      await query(
        "DELETE FROM contest_members WHERE contest_id = $1 AND user_id = $2",
        [id, userId]
      );
    } else {
      return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Admin Contest[id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
