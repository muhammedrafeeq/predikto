import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();

    const res = await query(
      `SELECT phone, COALESCE((SELECT SUM(points) FROM scores WHERE user_id = $1), 0)::int AS total_points
       FROM users WHERE id = $1`,
      [user.userId]
    );

    return NextResponse.json({
      user: {
        id: user.userId,
        name: user.name,
        role: user.role,
        phone: res.rows[0]?.phone ?? "",
        points: res.rows[0]?.total_points ?? 0,
      },
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
