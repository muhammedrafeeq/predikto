import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "predikto-secret-jwt-key-2026-secure";

async function getUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await request.json();

  await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET endpoint = $2, p256dh = $3, auth = $4`,
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await query("DELETE FROM push_subscriptions WHERE user_id = $1", [userId]);
  return NextResponse.json({ success: true });
}
