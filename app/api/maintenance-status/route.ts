import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 0;

export async function GET() {
  try {
    const res = await query("SELECT value FROM settings WHERE key = 'maintenance_mode'");
    const enabled = res.rows[0]?.value === "true";
    return NextResponse.json({ enabled }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
