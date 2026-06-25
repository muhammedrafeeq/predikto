import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const res = await query("SELECT value FROM settings WHERE key = 'maintenance_mode'");
    const enabled = res.rows[0]?.value === "true";
    return NextResponse.json({ enabled });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { enabled } = await request.json();
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('maintenance_mode', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [enabled ? "true" : "false"]
    );
    return NextResponse.json({ success: true, enabled });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
