import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const AD_KEYS = [
  "ad_social_bar",
  "ad_popunder",
  "ad_native_banner",
  "ad_medium_rectangle",
  "ad_leaderboard",
  "ad_full_banner",
  "ad_mobile_banner",
  "ad_wide_skyscraper",
  "ad_half_page",
  "ad_interstitial",
];

export async function GET() {
  try {
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
  } catch {
    // fail open — show ads if DB is unreachable
    const fallback: Record<string, boolean> = {};
    for (const k of AD_KEYS) fallback[k] = true;
    return NextResponse.json({ success: true, settings: fallback });
  }
}
