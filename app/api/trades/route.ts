import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET: Fetch user's pending trades (incoming and outgoing)
export async function GET() {
  try {
    const user = await requireAuth();

    // Fetch all active trades involving the user (not expired, pending or countered)
    const tradesRes = await query<any>(
      `SELECT 
        ct.id,
        ct.from_user_id,
        ct.to_user_id,
        ct.offered_card_id,
        ct.requested_card_id,
        ct.status,
        ct.counter_card_id,
        ct.expires_at,
        ct.created_at,
        u_from.name as from_user_name,
        u_to.name as to_user_name,
        pc_offered.player_name as offered_player_name,
        pc_offered.rarity as offered_rarity,
        pc_offered.overall_rating as offered_rating,
        pc_offered.position as offered_position,
        t_offered.flag_emoji as offered_flag,
        pc_requested.player_name as requested_player_name,
        pc_requested.rarity as requested_rarity,
        pc_requested.overall_rating as requested_rating,
        pc_requested.position as requested_position,
        t_requested.flag_emoji as requested_flag,
        pc_counter.player_name as counter_player_name,
        pc_counter.rarity as counter_rarity,
        pc_counter.overall_rating as counter_rating,
        pc_counter.position as counter_position,
        t_counter.flag_emoji as counter_flag
       FROM card_trades ct
       JOIN users u_from ON ct.from_user_id = u_from.id
       JOIN users u_to ON ct.to_user_id = u_to.id
       JOIN player_cards pc_offered ON ct.offered_card_id = pc_offered.id
       JOIN teams t_offered ON pc_offered.team_id = t_offered.id
       JOIN player_cards pc_requested ON ct.requested_card_id = pc_requested.id
       JOIN teams t_requested ON pc_requested.team_id = t_requested.id
       LEFT JOIN player_cards pc_counter ON ct.counter_card_id = pc_counter.id
       LEFT JOIN teams t_counter ON pc_counter.team_id = t_counter.id
       WHERE (ct.from_user_id = $1 OR ct.to_user_id = $1)
         AND ct.status IN ('pending', 'countered')
         AND ct.expires_at > NOW()
       ORDER BY ct.created_at DESC`,
      [user.userId]
    );

    const incoming: any[] = [];
    const outgoing: any[] = [];

    for (const trade of tradesRes.rows) {
      // Incoming = action is needed from current user
      // - Pending and to_user_id is me
      // - Countered and from_user_id is me
      const isActionNeeded = 
        (trade.status === "pending" && trade.to_user_id === user.userId) ||
        (trade.status === "countered" && trade.from_user_id === user.userId);

      if (isActionNeeded) {
        incoming.push(trade);
      } else {
        outgoing.push(trade);
      }
    }

    return NextResponse.json({ incoming, outgoing });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

// POST: Create a new trade request
export async function POST(req: NextRequest) {
  try {
    const fromUser = await requireAuth();
    const body = await req.json();
    const { toUserId, offeredCardId, requestedCardId } = body;

    const toUserIdInt = parseInt(toUserId, 10);
    const offeredCardIdInt = parseInt(offeredCardId, 10);
    const requestedCardIdInt = parseInt(requestedCardId, 10);

    if (isNaN(toUserIdInt) || isNaN(offeredCardIdInt) || isNaN(requestedCardIdInt)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    if (toUserIdInt === fromUser.userId) {
      return NextResponse.json({ error: "You cannot trade with yourself" }, { status: 400 });
    }

    // 1. Fetch card details & rarities
    const cardsRes = await query<any>(
      `SELECT pc.*, t.name as team_name FROM player_cards pc JOIN teams t ON pc.team_id = t.id WHERE pc.id IN ($1, $2)`,
      [offeredCardIdInt, requestedCardIdInt]
    );

    if (cardsRes.rows.length < 2) {
      return NextResponse.json({ error: "One or both cards do not exist" }, { status: 404 });
    }

    const offeredCard = cardsRes.rows.find((c) => c.id === offeredCardIdInt);
    const requestedCard = cardsRes.rows.find((c) => c.id === requestedCardIdInt);

    // 2. Validate Legendaries block
    if (offeredCard.rarity === "legendary" || requestedCard.rarity === "legendary") {
      return NextResponse.json({ error: "Legendary cards cannot be traded" }, { status: 400 });
    }

    // 3. Validate Favourite Team block
    const fromFavRes = await query<{ team_id: number }>(
      `SELECT team_id FROM user_favourite_teams WHERE user_id = $1 AND slot = 1`,
      [fromUser.userId]
    );
    const toFavRes = await query<{ team_id: number }>(
      `SELECT team_id FROM user_favourite_teams WHERE user_id = $1 AND slot = 1`,
      [toUserIdInt]
    );

    const fromFavTeamId = fromFavRes.rows[0]?.team_id;
    const toFavTeamId = toFavRes.rows[0]?.team_id;

    if (fromFavTeamId && offeredCard.team_id === fromFavTeamId) {
      return NextResponse.json({ error: "You cannot trade cards from your favourite team" }, { status: 400 });
    }
    if (toFavTeamId && requestedCard.team_id === toFavTeamId) {
      return NextResponse.json({ error: "You cannot request cards from the recipient's favourite team" }, { status: 400 });
    }

    // 4. Duplicate Check (sender must have offered card duplicate, receiver must have requested card duplicate)
    const fromCardQtyRes = await query<{ quantity: number }>(
      `SELECT quantity FROM user_cards WHERE user_id = $1 AND card_id = $2`,
      [fromUser.userId, offeredCardIdInt]
    );
    const fromQty = fromCardQtyRes.rows[0]?.quantity || 0;
    if (fromQty < 2) {
      return NextResponse.json({ error: "You can only offer duplicate cards (quantity >= 2)" }, { status: 400 });
    }

    const toCardQtyRes = await query<{ quantity: number }>(
      `SELECT quantity FROM user_cards WHERE user_id = $1 AND card_id = $2`,
      [toUserIdInt, requestedCardIdInt]
    );
    const toQty = toCardQtyRes.rows[0]?.quantity || 0;
    if (toQty < 2) {
      return NextResponse.json({ error: "The recipient must have a duplicate of the requested card (quantity >= 2)" }, { status: 400 });
    }

    // 5. Unique active trade check
    const activeTradeCheck = await query(
      `SELECT id FROM card_trades 
       WHERE from_user_id = $1 AND to_user_id = $2 AND status IN ('pending', 'countered') AND expires_at > NOW()`,
      [fromUser.userId, toUserIdInt]
    );
    if (activeTradeCheck.rows.length > 0) {
      return NextResponse.json({ error: "You already have a pending trade request with this user" }, { status: 400 });
    }

    // 6. Create the trade (expires in 24 hours)
    const insertRes = await query<any>(
      `INSERT INTO card_trades (from_user_id, to_user_id, offered_card_id, requested_card_id, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
       RETURNING id`,
      [fromUser.userId, toUserIdInt, offeredCardIdInt, requestedCardIdInt]
    );

    return NextResponse.json({ success: true, tradeId: insertRes.rows[0].id });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
