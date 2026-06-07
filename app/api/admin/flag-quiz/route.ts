import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const res = await query(
      `SELECT id, country_name, flag_emoji, difficulty, active, created_at
       FROM flag_quiz_flags ORDER BY difficulty, country_name`
    );
    return NextResponse.json({ success: true, flags: res.rows });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { countryName, flagEmoji, difficulty, active } = await req.json();
    if (!countryName || !flagEmoji || !difficulty) {
      return NextResponse.json({ error: "countryName, flagEmoji and difficulty are required" }, { status: 400 });
    }
    const valid = ["easy", "medium", "hard"];
    if (!valid.includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }
    const res = await query(
      `INSERT INTO flag_quiz_flags (country_name, flag_emoji, difficulty, active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [countryName.trim(), flagEmoji.trim(), difficulty, active !== false]
    );
    return NextResponse.json({ success: true, flag: res.rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
