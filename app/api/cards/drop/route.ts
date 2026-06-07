import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/gameAuth";
import { dropMultipleCards } from "@/lib/cardDrop";

export async function POST(req: NextRequest) {
  try {
    const caller = await requireAuth();
    const body = await req.json();
    const { trigger, triggerRefId, count = 1, userId: targetUserId } = body;

    if (!trigger) {
      return NextResponse.json({ error: "trigger is required" }, { status: 400 });
    }

    // Determine whose collection gets the card
    let recipientUserId = caller.userId;
    if (targetUserId && targetUserId !== caller.userId) {
      // Must be admin to drop cards for other users
      await requireAdmin();
      recipientUserId = targetUserId;
    }

    const droppedCards = await dropMultipleCards(
      recipientUserId,
      trigger,
      count,
      triggerRefId ? parseInt(triggerRefId, 10) : undefined
    );

    return NextResponse.json({ success: true, cards: droppedCards });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
