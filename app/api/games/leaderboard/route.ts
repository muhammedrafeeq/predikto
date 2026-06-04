import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") ?? "all";

    const validGames = ["all", "penalty", "formation", "first_goal", "trivia", "who_am_i", "bracket"];
    if (!validGames.includes(game)) {
      return NextResponse.json({ error: "Invalid game filter" }, { status: 400 });
    }

    let rows;
    if (game === "all") {
      const res = await query(`
        SELECT
          u.id,
          u.name,
          COALESCE(SUM(gs.points), 0)          AS total_points,
          COUNT(DISTINCT gs.game_type)::int     AS game_types_played,
          COUNT(*)::int                          AS total_plays
        FROM users u
        JOIN game_scores gs ON gs.user_id = u.id
        WHERE u.is_active = true
        GROUP BY u.id, u.name
        ORDER BY total_points DESC, game_types_played DESC
        LIMIT 100
      `);
      rows = res.rows;
    } else {
      const aggregate = ["formation", "first_goal", "bracket"].includes(game) ? "SUM" : "SUM";
      const res = await query(`
        SELECT
          u.id,
          u.name,
          COALESCE(${aggregate}(gs.points), 0) AS total_points,
          COUNT(*)::int                          AS total_plays
        FROM users u
        JOIN game_scores gs ON gs.user_id = u.id
        WHERE u.is_active = true AND gs.game_type = $1
        GROUP BY u.id, u.name
        ORDER BY total_points DESC
        LIMIT 100
      `, [game]);
      rows = res.rows;
    }

    const rankings = rows.map((r: any, idx: number) => ({
      rank: idx + 1,
      id: r.id,
      name: r.name,
      points: parseInt(r.total_points, 10),
      gamesPlayed: parseInt(r.total_plays ?? r.game_types_played ?? 0, 10),
    }));

    return NextResponse.json({ success: true, rankings, game });
  } catch (error) {
    console.error("Games Leaderboard API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
