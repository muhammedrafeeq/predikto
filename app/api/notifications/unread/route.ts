import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "predikto-secret-jwt-key-2026-secure";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ notifications: [] });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

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
