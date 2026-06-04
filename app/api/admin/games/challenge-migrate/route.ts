import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS penalty_challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        creator_name TEXT NOT NULL,
        creator_kicks JSONB NOT NULL,
        creator_goalie_kicks JSONB NOT NULL,
        creator_goals INTEGER NOT NULL,
        creator_points INTEGER NOT NULL,
        challenger_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        challenger_name TEXT,
        challenger_kicks JSONB,
        challenger_goalie_kicks JSONB,
        challenger_goals INTEGER,
        challenger_points INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours'
      )
    `);

    return NextResponse.json({ success: true, message: "penalty_challenges table created" });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
