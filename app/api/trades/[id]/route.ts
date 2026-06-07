import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import { checkCollectionComplete } from "@/lib/cardDrop";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const tradeId = parseInt(resolvedParams.id, 10);

    if (isNaN(tradeId)) {
      return NextResponse.json({ error: "Invalid trade ID" }, { status: 400 });
    }

    const { action, counterCardId } = await req.json();
    if (!["accept", "reject", "counter"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 1. Fetch trade details and verify it's active and not expired
    const tradeRes = await query<any>(
      `SELECT * FROM card_trades WHERE id = $1`,
      [tradeId]
    );

    if (tradeRes.rows.length === 0) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const trade = tradeRes.rows[0];

    if (trade.status !== "pending" && trade.status !== "countered") {
      return NextResponse.json({ error: "Trade is no longer active" }, { status: 400 });
    }

    const expiresAt = new Date(trade.expires_at);
    if (expiresAt.getTime() <= Date.now()) {
      // Mark as expired
      await query(`UPDATE card_trades SET status = 'expired' WHERE id = $1`, [tradeId]);
      return NextResponse.json({ error: "Trade has expired" }, { status: 400 });
    }

    // 2. Handle actions
    if (action === "reject") {
      // Either user can cancel/reject/decline
      if (user.userId !== trade.from_user_id && user.userId !== trade.to_user_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await query(
        `UPDATE card_trades SET status = 'rejected' WHERE id = $1`,
        [tradeId]
      );
      return NextResponse.json({ success: true, status: "rejected" });
    }

    if (action === "counter") {
      // Only the receiver (to_user_id) can counter a pending trade
      if (trade.status !== "pending" || user.userId !== trade.to_user_id) {
        return NextResponse.json({ error: "Unauthorized to counter this trade" }, { status: 403 });
      }

      const counterCardIdInt = parseInt(counterCardId, 10);
      if (isNaN(counterCardIdInt)) {
        return NextResponse.json({ error: "Invalid counter card ID" }, { status: 400 });
      }

      // Fetch counter card
      const cardRes = await query<any>(
        `SELECT pc.*, t.name as team_name FROM player_cards pc JOIN teams t ON pc.team_id = t.id WHERE pc.id = $1`,
        [counterCardIdInt]
      );

      if (cardRes.rows.length === 0) {
        return NextResponse.json({ error: "Counter card does not exist" }, { status: 404 });
      }

      const counterCard = cardRes.rows[0];

      if (counterCard.rarity === "legendary") {
        return NextResponse.json({ error: "Legendary cards cannot be traded" }, { status: 400 });
      }

      // Check recipient's (to_user_id / current user) favourite team
      const toFavRes = await query<{ team_id: number }>(
        `SELECT team_id FROM user_favourite_teams WHERE user_id = $1 AND slot = 1`,
        [user.userId]
      );
      if (toFavRes.rows[0]?.team_id === counterCard.team_id) {
        return NextResponse.json({ error: "You cannot trade cards from your favourite team" }, { status: 400 });
      }

      // Check duplicate status (the counter proposer must have duplicate of counterCardId)
      const qtyRes = await query<{ quantity: number }>(
        `SELECT quantity FROM user_cards WHERE user_id = $1 AND card_id = $2`,
        [user.userId, counterCardIdInt]
      );
      const qty = qtyRes.rows[0]?.quantity || 0;
      if (qty < 2) {
        return NextResponse.json({ error: "You can only offer duplicate cards (quantity >= 2)" }, { status: 400 });
      }

      // Update trade status to countered and set counter_card_id
      await query(
        `UPDATE card_trades 
         SET status = 'countered', counter_card_id = $1, expires_at = NOW() + INTERVAL '24 hours' 
         WHERE id = $2`,
        [counterCardIdInt, tradeId]
      );

      return NextResponse.json({ success: true, status: "countered" });
    }

    if (action === "accept") {
      // Authorized user checks
      // - Pending -> to_user_id must accept
      // - Countered -> from_user_id must accept
      const isAuthorized = 
        (trade.status === "pending" && user.userId === trade.to_user_id) ||
        (trade.status === "countered" && user.userId === trade.from_user_id);

      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized to accept this trade" }, { status: 403 });
      }

      const senderId = trade.from_user_id;
      const receiverId = trade.to_user_id;
      const senderOfferedCard = trade.offered_card_id;
      const receiverOfferedCard = trade.status === "countered" ? trade.counter_card_id : trade.requested_card_id;

      // 3. Perform the database queries to verify duplicates still exist at transaction start
      const senderQtyRes = await query<{ quantity: number }>(
        `SELECT quantity FROM user_cards WHERE user_id = $1 AND card_id = $2`,
        [senderId, senderOfferedCard]
      );
      const receiverQtyRes = await query<{ quantity: number }>(
        `SELECT quantity FROM user_cards WHERE user_id = $1 AND card_id = $2`,
        [receiverId, receiverOfferedCard]
      );

      const senderQty = senderQtyRes.rows[0]?.quantity || 0;
      const receiverQty = receiverQtyRes.rows[0]?.quantity || 0;

      if (senderQty < 2 || receiverQty < 2) {
        return NextResponse.json({ 
          error: "Trade is no longer valid. Both parties must have duplicate cards (quantity >= 2) to complete the trade." 
        }, { status: 400 });
      }

      // 4. Begin Swap Transaction
      // We'll execute sequential queries inside a try-catch for transactional safety
      try {
        await query("BEGIN");

        // Decrement sender offered card
        await query(
          `UPDATE user_cards SET quantity = quantity - 1 WHERE user_id = $1 AND card_id = $2`,
          [senderId, senderOfferedCard]
        );

        // Decrement receiver offered card
        await query(
          `UPDATE user_cards SET quantity = quantity - 1 WHERE user_id = $1 AND card_id = $2`,
          [receiverId, receiverOfferedCard]
        );

        // Increment receiver owned for sender offered card
        await query(
          `INSERT INTO user_cards (user_id, card_id, quantity, earned_via)
           VALUES ($1, $2, 1, 'prediction')
           ON CONFLICT (user_id, card_id) 
           DO UPDATE SET quantity = user_cards.quantity + 1`,
          [receiverId, senderOfferedCard]
        );

        // Increment sender owned for receiver offered card
        await query(
          `INSERT INTO user_cards (user_id, card_id, quantity, earned_via)
           VALUES ($1, $2, 1, 'prediction')
           ON CONFLICT (user_id, card_id) 
           DO UPDATE SET quantity = user_cards.quantity + 1`,
          [senderId, receiverOfferedCard]
        );

        // Set trade status to accepted
        await query(
          `UPDATE card_trades SET status = 'accepted' WHERE id = $1`,
          [tradeId]
        );

        await query("COMMIT");
      } catch (txnError) {
        await query("ROLLBACK");
        console.error("Trade transaction failed, rolled back:", txnError);
        throw txnError;
      }

      // Check collection completion for both users (post-transaction)
      await checkCollectionComplete(senderId, await getTeamIdOfCard(receiverOfferedCard));
      await checkCollectionComplete(receiverId, await getTeamIdOfCard(senderOfferedCard));

      return NextResponse.json({ success: true, status: "accepted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

async function getTeamIdOfCard(cardId: number): Promise<number> {
  const res = await query<{ team_id: number }>(
    `SELECT team_id FROM player_cards WHERE id = $1`,
    [cardId]
  );
  return res.rows[0]?.team_id || 0;
}
