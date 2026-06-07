import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await requireAdmin();

    await query(`
      CREATE TABLE IF NOT EXISTS first_goal_results (
        match_id          INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
        first_goal_minute INTEGER NOT NULL,
        recorded_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS formation_results (
        match_id       INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
        home_formation VARCHAR(20) NOT NULL,
        away_formation VARCHAR(20) NOT NULL,
        recorded_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bracket_results (
        id          SERIAL PRIMARY KEY,
        stage       VARCHAR(20)  NOT NULL,
        matchup     VARCHAR(50)  NOT NULL UNIQUE,
        winner      VARCHAR(100) NOT NULL,
        recorded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    return NextResponse.json({
      success: true,
      message: "first_goal_results, formation_results, and bracket_results tables created",
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
