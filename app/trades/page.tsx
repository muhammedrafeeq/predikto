"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TradeCard from "@/components/cards/TradeCard";
import PlayerCard from "@/components/cards/PlayerCard";
import { PlayerCardData } from "@/lib/cardDrop";

export default function TradesHubPage() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [duplicates, setDuplicates] = useState<PlayerCardData[]>([]);

  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Counter Offer Modal State
  const [counterTradeId, setCounterTradeId] = useState<number | null>(null);
  const [selectedCounterCardId, setSelectedCounterCardId] = useState<number | null>(null);
  const [submittingCounter, setSubmittingCounter] = useState(false);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch trades
      const res = await fetch("/api/trades");
      if (!res.ok) throw new Error("Failed to load trades");
      const data = await res.json();
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);

      // 2. Fetch my duplicates (for counter offers)
      const dupsRes = await fetch("/api/collection?duplicates=true");
      if (dupsRes.ok) {
        const dupsData = await dupsRes.json();
        setDuplicates(dupsData.cards || []);
        setCurrentUserId(dupsData.userId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load trades dashboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (tradeId: number) => {
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to accept trade");
      }

      setSuccessMsg("Trade completed successfully! Card swap finished.");
      await loadTrades();
    } catch (err: any) {
      setError(err.message || "Error accepting trade.");
    }
  };

  const handleReject = async (tradeId: number) => {
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update trade");
      }

      setSuccessMsg("Trade request cancelled or declined.");
      await loadTrades();
    } catch (err: any) {
      setError(err.message || "Error rejecting trade.");
    }
  };

  const handleOpenCounterModal = (tradeId: number) => {
    setCounterTradeId(tradeId);
    setSelectedCounterCardId(null);
  };

  const handleSubmitCounter = async () => {
    if (!counterTradeId || !selectedCounterCardId) return;
    setSubmittingCounter(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/trades/${counterTradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "counter",
          counterCardId: selectedCounterCardId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to counter trade");
      }

      setSuccessMsg("Counter offer sent successfully!");
      setCounterTradeId(null);
      await loadTrades();
    } catch (err: any) {
      setError(err.message || "Error submitting counter proposal.");
    } finally {
      setSubmittingCounter(false);
    }
  };

  const activeTrades = activeTab === "incoming" ? incoming : outgoing;

  return (
    <div className="min-h-screen text-white bg-base-bg p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
            Marketplace
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">
            Trades Hub
          </h1>
        </div>
        <Link
          href="/collection"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
        >
          🗂 My Collection
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/40 rounded-2xl text-rose-400 text-xs font-semibold text-center w-full">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-emerald-400 text-xs font-semibold text-center w-full">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-3 text-xs uppercase tracking-widest font-black transition-all cursor-pointer ${
            activeTab === "incoming"
              ? "border-b-2 border-indigo-500 text-white"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Incoming Trades ({incoming.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-4 py-3 text-xs uppercase tracking-widest font-black transition-all cursor-pointer ${
            activeTab === "outgoing"
              ? "border-b-2 border-indigo-500 text-white"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Outgoing Trades ({outgoing.length})
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-t-indigo-500 border-neutral-800 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6 items-center">
          {activeTrades.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 max-w-sm">
              <span className="text-4xl block mb-3">📦</span>
              <p className="text-xs font-black uppercase tracking-wider">No Active Trades</p>
              <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                To start a trade, visit another player's Public Collection and click "Offer Trade" on one of their duplicates.
              </p>
            </div>
          ) : (
            activeTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                currentUserId={currentUserId || 0}
                onAccept={handleAccept}
                onReject={handleReject}
                onCounter={handleOpenCounterModal}
              />
            ))
          )}
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterTradeId !== null && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Propose Counter Offer
                </h3>
                <button
                  onClick={() => setCounterTradeId(null)}
                  className="text-neutral-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-400 mb-4">
                Select one of your duplicate cards to offer in place of the originally requested card. Legendary cards are excluded.
              </p>

              {/* Scrollable grid of duplicates */}
              <div className="overflow-y-auto max-h-[50vh] p-1 grid grid-cols-3 gap-3 pr-2 scrollbar-thin">
                {duplicates.map((card) => {
                  const isSelected = selectedCounterCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCounterCardId(card.id)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer select-none transition-all hover:scale-[1.03] ${
                        isSelected
                          ? "ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <PlayerCard card={card} size="sm" showStats={false} />
                      {/* Selection Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-950/20 border-2 border-indigo-500 rounded-xl pointer-events-none flex items-center justify-center">
                          <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">
                            ✓
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {duplicates.length === 0 && (
                  <p className="col-span-3 text-center py-10 text-xs text-zinc-500 uppercase tracking-widest font-black">
                    No duplicates available to trade
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-neutral-800 pt-4 mt-4">
              <button
                onClick={() => setCounterTradeId(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-950 text-neutral-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCounter}
                disabled={!selectedCounterCardId || submittingCounter}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  selectedCounterCardId && !submittingCounter
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    : "bg-neutral-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {submittingCounter ? "Sending..." : "Submit Counter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
