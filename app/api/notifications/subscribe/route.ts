import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const subscription = await request.json();

    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET endpoint = $2, p256dh = $3, auth = $4`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await requireAuth();
    await query("DELETE FROM push_subscriptions WHERE user_id = $1", [userId]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
