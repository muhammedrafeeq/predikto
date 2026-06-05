import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const res = await query(
      `SELECT id, title, body, created_at FROM notifications
       WHERE user_id = $1 AND read = false ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    return NextResponse.json({ notifications: res.rows });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const { ids } = await request.json();

    if (ids?.length) {
      await query(
        `UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2::int[])`,
        [userId, ids]
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
