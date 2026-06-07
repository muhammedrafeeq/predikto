import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { recordDailyLogin, getStreakInfo } from "@/lib/dailyLogin";

export async function GET() {
  try {
    const user = await requireAuth();
    const streakInfo = await getStreakInfo(user.userId);
    return NextResponse.json(streakInfo);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST() {
  try {
    const user = await requireAuth();
    const result = await recordDailyLogin(user.userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
