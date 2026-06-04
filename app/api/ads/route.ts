import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const AD_KEYS = [
  "ad_hilltop_banner",
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
    const fallback: Record<string, boolean> = {};
    for (const k of AD_KEYS) fallback[k] = true;
    return NextResponse.json({ success: true, settings: fallback });
  }
}
