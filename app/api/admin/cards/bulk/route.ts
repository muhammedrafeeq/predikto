import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { cards } = body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: "Invalid cards array" }, { status: 400 });
    }

    try {
      await query("BEGIN");

      for (const card of cards) {
        const {
          teamId,
          playerName,
          position,
          jerseyNumber,
          rarity,
          overallRating,
          stats,
        } = card;

        if (
          !teamId ||
          !playerName ||
          !position ||
          !rarity ||
          !overallRating ||
          !stats
        ) {
          throw new Error(`Missing fields for player: ${playerName || "Unknown"}`);
        }

        await query(
          `INSERT INTO player_cards (team_id, player_name, position, jersey_number, rarity, overall_rating, stats)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            parseInt(teamId, 10),
            playerName,
            position,
            jerseyNumber ? parseInt(jerseyNumber, 10) : null,
            rarity,
            parseInt(overallRating, 10),
            typeof stats === "string" ? stats : JSON.stringify(stats),
          ]
        );
      }

      await query("COMMIT");
      return NextResponse.json({ success: true, count: cards.length });
    } catch (txnError: any) {
      await query("ROLLBACK");
      console.error("Bulk insert failed, rolled back:", txnError);
      return NextResponse.json({ error: txnError.message ?? "Database error during bulk insert" }, { status: 400 });
    }
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
