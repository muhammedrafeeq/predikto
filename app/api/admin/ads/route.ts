import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export const AD_KEYS = [
  "ad_hilltop_banner",
  "ad_games_hub_300x250",
  "ad_games_hub_native",
  "ad_trivia_320x50",
  "ad_leaderboard_728x90",
  "ad_leaderboard_300x250",
  "ad_leaderboard_160x600",
  "ad_contest_160x300",
  "ad_match_result_468x60",
];

export async function GET() {
  try {
    await requireAdmin();

    const res = await query(
      `SELECT key, value FROM system_settings WHERE key = ANY($1)`,
      [AD_KEYS]
    );

    const settings: Record<string, boolean> = {};
    for (const k of AD_KEYS) settings[k] = true;
    for (const row of res.rows) {
      settings[row.key] = row.value !== "false";
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { key, enabled } = await req.json() as { key: string; enabled: boolean };

    if (!AD_KEYS.includes(key)) {
      return NextResponse.json({ error: "Invalid ad key" }, { status: 400 });
    }

    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, String(enabled)]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
