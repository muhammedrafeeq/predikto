"use client";

import React, { useState, useEffect } from "react";
import PlayerCard from "./PlayerCard";
import { PlayerCardData } from "@/lib/cardDrop";

interface TradeCardProps {
  trade: any;
  currentUserId: number;
  onAccept?: (tradeId: number) => void;
  onReject?: (tradeId: number) => void; // Used for both decline and cancel
  onCounter?: (tradeId: number) => void;
}

export default function TradeCard({
  trade,
  currentUserId,
  onAccept,
  onReject,
  onCounter,
}: TradeCardProps) {
  const [timeLeft, setTimeLeft] = useState("");

  const isSender = trade.from_user_id === currentUserId;
  const isPending = trade.status === "pending";
  const isCountered = trade.status === "countered";

  // Determine who currently needs to take action
  const isActionNeeded = 
    (isPending && !isSender) || // Incoming pending: recipient (me) needs to act
    (isCountered && isSender);  // Countered: original sender (me) needs to act on the counter

  // Format cards for rendering
  const offeredCard: PlayerCardData = {
    id: trade.offered_card_id,
    team_id: 0,
    player_name: trade.offered_player_name,
    position: trade.offered_position,
    rarity: trade.offered_rarity,
    overall_rating: trade.offered_rating,
    stats: { pace: 0, shooting: 0, passing: 0, defending: 0 },
    team_name: "",
    flag_emoji: trade.offered_flag,
  };

  const rightCardData = isCountered && trade.counter_card_id
    ? {
        id: trade.counter_card_id,
        player_name: trade.counter_player_name,
        position: trade.counter_position,
        rarity: trade.counter_rarity,
        overall_rating: trade.counter_rating,
        flag_emoji: trade.counter_flag,
      }
    : {
        id: trade.requested_card_id,
        player_name: trade.requested_player_name,
        position: trade.requested_position,
        rarity: trade.requested_rarity,
        overall_rating: trade.requested_rating,
        flag_emoji: trade.requested_flag,
      };

  const rightCard: PlayerCardData = {
    id: rightCardData.id,
    team_id: 0,
    player_name: rightCardData.player_name,
    position: rightCardData.position,
    rarity: rightCardData.rarity,
    overall_rating: rightCardData.overall_rating,
    stats: { pace: 0, shooting: 0, passing: 0, defending: 0 },
    team_name: "",
    flag_emoji: rightCardData.flag_emoji,
  };

  // Countdown timer logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(trade.expires_at).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      
      setTimeLeft(`${hours}h ${minutes}m remaining`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // update every minute

    return () => clearInterval(interval);
  }, [trade.expires_at]);

  return (
    <div className="surface-glass-1 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 w-full max-w-xl">
      {/* Trade Header */}
      <div className="flex justify-between items-center border-b border-neutral-800/60 pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
            {isCountered ? "Counter Offer" : "Trade Proposal"}
          </span>
          <span className="text-sm font-extrabold text-white mt-0.5">
            {isSender 
              ? `To: ${trade.to_user_name}` 
              : `From: ${trade.from_user_name}`}
          </span>
        </div>
        
        <div className="text-right">
          <span className="text-xs font-semibold text-neutral-400 block">
            {timeLeft}
          </span>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-neutral-900 border border-neutral-800 text-neutral-300">
            {trade.status}
          </span>
        </div>
      </div>

      {/* Cards side by side */}
      <div className="flex items-center justify-around gap-4 py-2">
        {/* Left Side: Offered Card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {isSender ? "You Offer" : "They Offer"}
          </span>
          <PlayerCard card={offeredCard} showStats={false} size="sm" />
        </div>

        {/* Swap Icon */}
        <div className="flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 w-10 h-10 rounded-full text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
        </div>

        {/* Right Side: Requested or Countered Card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {isSender 
              ? (isCountered ? "They Propose" : "You Request") 
              : (isCountered ? "You Propose" : "They Request")}
          </span>
          <PlayerCard card={rightCard} showStats={false} size="sm" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-neutral-800/60 pt-3 flex gap-2 justify-end">
        {isActionNeeded ? (
          <>
            {/* Counter offer button (only if pending request received by me) */}
            {isPending && !isSender && onCounter && (
              <button
                onClick={() => onCounter(trade.id)}
                className="px-4 py-2 text-xs font-black rounded-lg border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-950 text-neutral-300 transition-all cursor-pointer"
              >
                Counter
              </button>
            )}

            {/* Reject / Decline button */}
            <button
              onClick={() => onReject?.(trade.id)}
              className="px-4 py-2 text-xs font-black rounded-lg bg-neutral-900 hover:bg-neutral-950 border border-neutral-800 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              Decline
            </button>

            {/* Accept button */}
            <button
              onClick={() => onAccept?.(trade.id)}
              className="px-4 py-2 text-xs font-black rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
            >
              Accept
            </button>
          </>
        ) : (
          // Outgoing or already countered by me (waiting for them)
          <div className="flex justify-between w-full items-center">
            <span className="text-[11px] italic text-neutral-500">
              {isCountered 
                ? "Waiting for counter-proposal review..." 
                : "Waiting for their response..."}
            </span>
            <button
              onClick={() => onReject?.(trade.id)}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-neutral-800 hover:bg-neutral-950 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
            >
              Cancel Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
