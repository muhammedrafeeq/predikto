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

    // 1. Verify user is in contest
    const membership = await query(
      `SELECT 1 FROM contest_members WHERE contest_id = $1 AND user_id = $2`,
      [contestId, user.userId]
    );

    if (membership.rowCount === 0 && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. You are not a member of this contest." }, { status: 403 });
    }

    // 2. Fetch contest metadata to know game type
    const contestRes = await query(
      `SELECT game_type as "gameType" FROM contests WHERE id = $1`,
      [contestId]
    );

    if (contestRes.rowCount === 0) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const { gameType } = contestRes.rows[0];

    // 3. Compute leaderboard rankings based on contest game type
    let rankings: any[] = [];
    if (gameType === "match_prediction") {
      const scoreRes = await query(
        `SELECT u.id, u.name, COALESCE(SUM(s.points), 0)::int as points
         FROM contest_members cm
         JOIN users u ON cm.user_id = u.id
         LEFT JOIN scores s ON s.user_id = u.id AND s.contest_id = cm.contest_id
         WHERE cm.contest_id = $1
         GROUP BY u.id, u.name
         ORDER BY points DESC, u.name ASC`,
        [contestId]
      );
      rankings = scoreRes.rows;
    } else {
      // Map frontend gameType identifier to db game_type (e.g. first_goal, formation, bracket)
      let dbGameType = gameType;
      const scoreRes = await query(
        `SELECT u.id, u.name, COALESCE(SUM(gs.points), 0)::int as points
         FROM contest_members cm
         JOIN users u ON cm.user_id = u.id
         LEFT JOIN game_scores gs ON gs.user_id = u.id AND gs.contest_id = cm.contest_id AND gs.game_type = $2
         WHERE cm.contest_id = $1
         GROUP BY u.id, u.name
         ORDER BY points DESC, u.name ASC`,
        [contestId, dbGameType]
      );
      rankings = scoreRes.rows;
    }

    // Assign dense rank
    let currentRank = 1;
    let prevPoints: number | null = null;
    const ranked = rankings.map((row) => {
      const pts = typeof row.points === "string" ? parseInt(row.points, 10) : row.points;
      if (prevPoints !== null && pts < prevPoints) {
        currentRank++;
      }
      prevPoints = pts;
      return {
        ...row,
        points: pts,
        rank: currentRank
      };
    });

    return NextResponse.json({ success: true, rankings: ranked });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
