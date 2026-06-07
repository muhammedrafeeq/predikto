import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { countryName, flagEmoji, difficulty, active } = await req.json();
    const res = await query(
      `UPDATE flag_quiz_flags
       SET country_name = COALESCE($1, country_name),
           flag_emoji   = COALESCE($2, flag_emoji),
           difficulty   = COALESCE($3, difficulty),
           active       = COALESCE($4, active)
       WHERE id = $5
       RETURNING *`,
      [countryName ?? null, flagEmoji ?? null, difficulty ?? null, active ?? null, parseInt(id, 10)]
    );
    if (res.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, flag: res.rows[0] });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const res = await query(`DELETE FROM flag_quiz_flags WHERE id = $1`, [parseInt(id, 10)]);
    if (res.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
