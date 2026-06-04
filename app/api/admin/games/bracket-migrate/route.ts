import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await requireAdmin();

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
      message: "bracket_results table created (or already exists)",
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
