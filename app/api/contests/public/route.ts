import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/contests/public — returns global/public contests without requiring auth
export async function GET() {
  try {
    const result = await query(
      `SELECT
        c.id,
        c.name,
        c.game_type as "gameType",
        c.join_code as "joinCode",
        c.created_at as "createdAt",
        c.is_public as "isPublic",
        t.name as "tournamentName",
        (SELECT COUNT(*)::int FROM contest_members WHERE contest_id = c.id) as "memberCount",
        creator.name as "creatorName"
       FROM contests c
       JOIN tournaments t ON c.tournament_id = t.id
       LEFT JOIN users creator ON c.creator_id = creator.id
       WHERE c.is_public = true
       ORDER BY c.created_at DESC`,
      []
    );

    return NextResponse.json({ success: true, contests: result.rows });
  } catch (error) {
    console.error("Public contests API error:", error);
    return NextResponse.json({ success: false, contests: [] });
  }
}
