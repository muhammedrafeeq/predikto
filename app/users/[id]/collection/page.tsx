"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PlayerCard from "@/components/cards/PlayerCard";
import MissingCard from "@/components/cards/MissingCard";
import { PlayerCardData } from "@/lib/cardDrop";

interface Team {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
}

export default function PublicCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const targetUserId = parseInt(params.id as string, 10);

  const [userName, setUserName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const [cards, setCards] = useState<PlayerCardData[]>([]);

  // Viewer State
  const [viewerUserId, setViewerUserId] = useState<number | null>(null);
  const [viewerDuplicates, setViewerDuplicates] = useState<PlayerCardData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Trade Modal State
  const [selectedRequestedCard, setSelectedRequestedCard] = useState<PlayerCardData | null>(null);
  const [selectedOfferedCardId, setSelectedOfferedCardId] = useState<number | null>(null);
  const [submittingTrade, setSubmittingTrade] = useState(false);

  useEffect(() => {
    if (!isNaN(targetUserId)) {
      loadPublicCollection(null);
      loadViewerInfo();
    }
  }, [targetUserId]);

  const loadPublicCollection = async (teamId: number | null) => {
    setLoading(true);
    setError("");
    try {
      const url = teamId 
        ? `/api/users/${targetUserId}/collection?teamId=${teamId}` 
        : `/api/users/${targetUserId}/collection`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load collection");
      }
      const data = await res.json();
      setUserName(data.userName);
      setCards(data.cards || []);
      setTeams(data.teams || []);
      setActiveTeamId(data.activeTeamId);
    } catch (err: any) {
      setError(err.message || "Failed to load public collection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadViewerInfo = async () => {
    try {
      // 1. Fetch viewer details & duplicates
      const res = await fetch("/api/collection?duplicates=true");
      if (res.ok) {
        const data = await res.json();
        setViewerUserId(data.userId);
        setViewerDuplicates(data.cards || []);
      }
    } catch (e) {
      console.error("Not logged in or failed to fetch viewer info:", e);
    }
  };

  const handleOpenTradeModal = (card: PlayerCardData) => {
    if (!viewerUserId) {
      setError("Please log in to offer a trade.");
      return;
    }
    setSelectedRequestedCard(card);
    setSelectedOfferedCardId(null);
  };

  const handleSendTrade = async () => {
    if (!selectedRequestedCard || !selectedOfferedCardId) return;
    setSubmittingTrade(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: targetUserId,
          offeredCardId: selectedOfferedCardId,
          requestedCardId: selectedRequestedCard.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send trade proposal");
      }

      setSuccessMsg(`Trade proposal sent to ${userName}!`);
      setSelectedRequestedCard(null);
      
      // Refresh pages/cards
      await loadPublicCollection(activeTeamId);
      await loadViewerInfo();
    } catch (err: any) {
      setError(err.message || "Failed to send trade.");
    } finally {
      setSubmittingTrade(false);
    }
  };

  const isOwnCollection = viewerUserId === targetUserId;

  return (
    <div className="min-h-screen text-white bg-base-bg p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
            Public Profile
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">
            {userName ? `${userName}'s Collection` : "User Collection"}
          </h1>
        </div>

        <Link
          href="/collection"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all"
        >
          My Collection
        </Link>
      </div>

      {isOwnCollection && (
        <div className="mb-6 p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl text-indigo-300 text-xs font-semibold text-center">
          💡 This is your public collection page. Other users see this view when they visit your profile to request trades.
        </div>
      )}

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

      {/* Team Selection List */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto py-2 pr-4 scrollbar-thin">
        {teams.map((t) => {
          const isActive = activeTeamId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTeamId(t.id);
                loadPublicCollection(t.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-neutral-950 border-white font-black"
                  : "bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <span>{t.flag_emoji}</span>
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

        {/* Single continuous grid (no position categorisation) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
          {cards.map((card) => {
            const isOwned = (card.quantity || 0) > 0;
            const isDuplicate = (card.quantity || 0) >= 2;
            const canOffer = isDuplicate && !isOwnCollection && viewerUserId && card.rarity !== "legendary";

            return (
              <div key={card.id} className="flex flex-col items-center gap-2">
                {isOwned ? (
                  <PlayerCard card={card} size="sm" showStats={false} />
                ) : (
                  <MissingCard
                    playerName={card.player_name}
                    position={card.position}
                    jerseyNumber={card.jersey_number}
                    teamName={card.team_name}
                    flagEmoji={card.flag_emoji}
                    size="sm"
                  />
                )}

                {/* Propose Trade Action Button for Viewer */}
                {canOffer ? (
                  <button
                    onClick={() => handleOpenTradeModal(card)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black uppercase tracking-wider py-1.5 rounded-xl shadow-[0_2px_8px_rgba(99,102,241,0.25)] hover:scale-[1.03] transition-all cursor-pointer text-center"
                  >
                    Offer Trade
                  </button>
                ) : (
                  <div className="h-7" /> // Aligner space
                )}
              </div>
            );
          })}
        </div>

      {/* Offer Trade Modal */}
      {selectedRequestedCard && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Propose Trade to {userName}
                </h3>
                <button
                  onClick={() => setSelectedRequestedCard(null)}
                  className="text-neutral-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* requested card visual */}
              <div className="bg-neutral-950/60 p-4 border border-neutral-800/80 rounded-2xl flex items-center gap-4 mb-6">
                <div className="scale-75 origin-left w-36 h-48 -mr-10">
                  <PlayerCard card={selectedRequestedCard} size="sm" showStats={false} />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                    You are requesting
                  </span>
                  <h4 className="font-extrabold text-white text-md uppercase">
                    {selectedRequestedCard.player_name}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Rarity: <span className="font-bold uppercase">{selectedRequestedCard.rarity}</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                    {userName} has duplicates of this card, so they will keep their original copy after the trade is completed.
                  </p>
                </div>
              </div>

              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 block mb-2">
                Select one of your duplicates to offer:
              </span>

              {/* Scrollable list of viewer duplicates */}
              <div className="overflow-y-auto max-h-[35vh] p-1 grid grid-cols-3 gap-3 pr-2 scrollbar-thin">
                {viewerDuplicates.map((card) => {
                  const isSelected = selectedOfferedCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedOfferedCardId(card.id)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer select-none transition-all hover:scale-[1.03] ${
                        isSelected
                          ? "ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <PlayerCard card={card} size="sm" showStats={false} />
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

                {viewerDuplicates.length === 0 && (
                  <p className="col-span-3 text-center py-10 text-xs text-zinc-500 uppercase tracking-widest font-black">
                    You do not have any duplicate cards to offer
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-neutral-800 pt-4 mt-4">
              <button
                onClick={() => setSelectedRequestedCard(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-950 text-neutral-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTrade}
                disabled={!selectedOfferedCardId || submittingTrade}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  selectedOfferedCardId && !submittingTrade
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    : "bg-neutral-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {submittingTrade ? "Sending Proposal..." : "Propose Trade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
