import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await requireAuth();

    const res = await query("SELECT key, value FROM system_settings");
    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      settings[row.key] = row.value;
    }

    // Convert setting values to appropriate types for frontend use
    return NextResponse.json({
      success: true,
      settings: {
        allow_contest_creation: settings["allow_contest_creation"] !== "false",
      },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
