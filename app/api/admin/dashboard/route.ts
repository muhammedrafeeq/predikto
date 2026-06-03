import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // 1. Get counts
    const usersCountRes = await query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(usersCountRes.rows[0].count, 10);

    const matchesCountRes = await query("SELECT COUNT(*) FROM matches");
    const totalMatches = parseInt(matchesCountRes.rows[0].count, 10);

    const predictionsCountRes = await query("SELECT COUNT(*) FROM predictions");
    const totalPredictions = parseInt(predictionsCountRes.rows[0].count, 10);

    const resultedMatchesRes = await query(
      "SELECT COUNT(*) FROM matches WHERE status = 'resulted'"
    );
    const resultedMatches = parseInt(resultedMatchesRes.rows[0].count, 10);

    // 2. Get active markets / capacity
    // We group predictions by match to see active participation
    const activeMarketsRes = await query(
      `SELECT m.id, m.team_home, m.team_away, COUNT(DISTINCT p.user_id) as entry_count
       FROM matches m
       LEFT JOIN predictions p ON m.id = p.match_id
       WHERE m.status != 'resulted'
       GROUP BY m.id, m.team_home, m.team_away
       ORDER BY m.match_time ASC
       LIMIT 2`
    );

    const activeMarkets = activeMarketsRes.rows.map((row) => {
      // Calculate capacity percentage relative to total users
      const entryCount = parseInt(row.entry_count, 10);
      const capacityPercent = totalUsers > 0 ? Math.round((entryCount / totalUsers) * 100) : 0;
      return {
        matchId: row.id,
        teams: `${row.team_home} vs ${row.team_away}`,
        entryCount,
        capacityPercent,
      };
    });

    // 3. Get recent activity feed (latest 5 predictions)
    const recentActivityRes = await query(
      `SELECT p.created_at, u.name as user_name, m.team_home, m.team_away, m.id as match_id
       FROM predictions p
       JOIN users u ON p.user_id = u.id
       JOIN matches m ON p.match_id = m.id
       ORDER BY p.created_at DESC
       LIMIT 5`
    );

    const recentActivity = recentActivityRes.rows.map((row) => {
      const timeDiff = Date.now() - new Date(row.created_at).getTime();
      const minutesAgo = Math.max(1, Math.floor(timeDiff / (1000 * 60)));
      
      let timeText = `${minutesAgo} min${minutesAgo > 1 ? "s" : ""} ago`;
      if (minutesAgo >= 60) {
        const hoursAgo = Math.floor(minutesAgo / 60);
        timeText = `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
      }

      return {
        userName: row.user_name,
        teams: `${row.team_home} vs ${row.team_away}`,
        matchId: row.match_id,
        timeText,
        league: "Premier League", // default mockup league
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalMatches,
        totalPredictions,
        resultedMatches,
      },
      activeMarkets,
      recentActivity,
    });
  } catch (error) {
    console.error("Admin Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
