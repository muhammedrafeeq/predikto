import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { AD_KEYS } from "@/app/api/admin/ads/route";

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

    return NextResponse.json({ success: true, settings }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    const fallback: Record<string, boolean> = {};
    for (const k of AD_KEYS) fallback[k] = true;
    return NextResponse.json({ success: true, settings: fallback });
  }
}
