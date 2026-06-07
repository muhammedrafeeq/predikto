"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight, Layers, Sparkles, Gamepad2, ChevronLeft } from "lucide-react";
import CollectionGrid from "@/components/cards/CollectionGrid";
import CardReveal from "@/components/cards/CardReveal";
import PlayerCard from "@/components/cards/PlayerCard";
import { PlayerCardData } from "@/lib/cardDrop";

interface Team {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  alreadyLoggedIn: boolean;
}

export default function MyCollectionPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const [cards, setCards] = useState<PlayerCardData[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [ownedCards, setOwnedCards] = useState<PlayerCardData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Daily Login Claiming State
  const [claiming, setClaiming] = useState(false);
  const [revealQueue, setRevealQueue] = useState<PlayerCardData[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  const [isViewingCollectionCard, setIsViewingCollectionCard] = useState(false);

  // Load Initial Data
  useEffect(() => {
    async function loadInitialData() {
      try {
        // 1. Fetch current user info
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const d = await userRes.json();
          if (d.user) setCurrentUser(d.user);
        }

        // 2. Get streak info
        const streakRes = await fetch("/api/daily-login");
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData);
        }

        // Load collection
        await loadCollection();
      } catch (err: any) {
        setError("Error loading collection. Please try again.");
        console.error(err);
      }
    }
    loadInitialData();
  }, []);

  const loadCollection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collection");
      if (!res.ok) throw new Error("Failed to load cards");
      const data = await res.json();
      setCards(data.cards || []);
      setTeams(data.teams || []);
      setActiveTeamId(data.activeTeamId);
      setOwnedCards(data.ownedCards || []);
    } catch (err) {
      setError("Error loading collection cards.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Claim Daily Login
  const handleClaimDailyLogin = async () => {
    if (claiming || streak?.alreadyLoggedIn) return;
    setClaiming(true);
    setError("");

    try {
      const res = await fetch("/api/daily-login", { method: "POST" });
      if (!res.ok) throw new Error("Failed to claim daily login");
      const data = await res.json();

      // Update streak state
      setStreak({
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        alreadyLoggedIn: true,
      });

      // Load dropped cards into the reveal queue
      if (data.droppedCards && data.droppedCards.length > 0) {
        setIsViewingCollectionCard(false); // Ensure we are not in viewer mode
        setRevealQueue(data.droppedCards);
        setCurrentRevealIndex(0); // Start revealing the first card
      }

      // Reload the collection
      await loadCollection();
    } catch (err: any) {
      setError(err.message || "Failed to claim login rewards.");
    } finally {
      setClaiming(false);
    }
  };

  const handleRevealComplete = () => {
    if (currentRevealIndex < revealQueue.length - 1) {
      // Go to next card in the queue
      setCurrentRevealIndex(currentRevealIndex + 1);
    } else {
      // Finished all reveals
      setRevealQueue([]);
      setCurrentRevealIndex(-1);
      setIsViewingCollectionCard(false);
    }
  };

  const handleOpenCollectionCardViewer = (card: PlayerCardData) => {
    setIsViewingCollectionCard(true);
    setRevealQueue([card]);
    setCurrentRevealIndex(0);
  };

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  return (
    <div className="relative min-h-screen pb-24 text-white bg-base-bg">
      {/* Top Navigation Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-5 py-3 h-16"
        style={{
          background: "rgba(10,10,15,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Link
            href="/games"
            className="p-1.5 -ml-1 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-all flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-black uppercase tracking-tight text-white select-none">
            Cards Collection
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/trades"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:scale-105"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Trades Hub
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 pt-20 pb-4">
        {/* Title like Gameboard Hero */}
        <div className="text-center py-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
            style={{
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.2)",
            }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "#a78bfa" }}
            >
              Player Cards
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-1">My Card Collection</h2>
          <p className="text-sm text-neutral-400">
            Collect squad cards, claim daily login packs, and swap with other players.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/40 rounded-2xl text-rose-400 text-xs font-semibold text-center w-full">
            {error}
          </div>
        )}

        {/* Streak Dashboard Card */}
        {streak && (
          <div className="surface-glass-2 border border-neutral-800 rounded-2xl p-5 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-900 flex items-center justify-center text-2xl">
                🔥
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Daily Streak
                </p>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {streak.currentStreak} Days{" "}
                  <span className="text-xs text-neutral-500 font-semibold normal-case">
                    (Longest: {streak.longestStreak}d)
                  </span>
                </h2>
              </div>
            </div>

            <div className="w-full md:w-auto">
              {streak.alreadyLoggedIn ? (
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-neutral-400 font-bold text-xs uppercase tracking-wide">
                  <span>✅</span> Claimed Today
                </div>
              ) : (
                <button
                  onClick={handleClaimDailyLogin}
                  disabled={claiming}
                  className="w-full md:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse cursor-pointer"
                >
                  {claiming ? "Claiming..." : "Claim Daily Login"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collected Cards Section Header */}
        {activeTeam && (
          <div className="flex items-center justify-between gap-3 mb-5 bg-neutral-900/40 border border-neutral-850 rounded-2xl p-4">
            <div className="flex items-center gap-3.5">
              <span className="text-3.5xl filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] leading-none">
                {activeTeam.flag_emoji}
              </span>
              <div>
                <span className="text-[9px] bg-indigo-950/60 border border-indigo-900 text-indigo-400 px-2.5 py-0.5 rounded-full font-black tracking-widest uppercase">
                  Collected Cards Section
                </span>
                <h3 className="text-md font-black uppercase tracking-tight text-white mt-1.5">
                  {activeTeam.name}
                </h3>
              </div>
            </div>

            <Link
              href="/onboarding/team"
              className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-all text-neutral-300 hover:text-white shrink-0"
            >
              Change Team
            </Link>
          </div>
        )}

        {/* Main Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-t-indigo-500 border-neutral-800 animate-spin" />
          </div>
        ) : (
          <CollectionGrid
            cards={cards}
            onCardClick={handleOpenCollectionCardViewer}
          />
        )}

        {/* Collected Cards from Any Team Section */}
        <div className="mt-8 border-t border-neutral-900 pt-8">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
            <span>🎴</span> Collected Cards (All Teams)
          </h3>
          
          {ownedCards.length === 0 ? (
            <div className="surface-glass-2 border border-neutral-900 rounded-2xl p-8 text-center text-xs text-neutral-400 uppercase tracking-widest font-bold">
              No cards collected yet. Play games to earn cards!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
              {ownedCards.map((card) => {
                const isEligibleForTrade = (card.quantity || 0) >= 2 && card.rarity !== "legendary";
                return (
                  <div key={card.id} className="flex flex-col items-center gap-2">
                    <PlayerCard 
                      card={card} 
                      size="sm" 
                      showStats={false} 
                      onClick={() => handleOpenCollectionCardViewer(card)} 
                    />
                    
                    {isEligibleForTrade ? (
                      <Link
                        href="/trades"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider py-1.5 rounded-xl shadow-[0_2px_8px_rgba(99,102,241,0.25)] hover:scale-[1.03] transition-all text-center cursor-pointer"
                      >
                        Trade (x{card.quantity})
                      </Link>
                    ) : (
                      <div className="h-7 text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center justify-center">
                        x{card.quantity} Owned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How to Collect Cards Section */}
        <div className="mt-8 border-t border-neutral-900 pt-8">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            How to Collect Cards
          </h3>
          <div className="flex flex-col gap-4">
            <div className="surface-glass-2 border border-neutral-850 p-4 rounded-xl flex items-start gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Daily Login Streak</h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Claim 2 cards every day you log in. Maintaining a day 7 streak guarantees a **Rare or higher** card.
                </p>
              </div>
            </div>

            <div className="surface-glass-2 border border-neutral-850 p-4 rounded-xl flex items-start gap-3">
              <span className="text-xl">🧠</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Football Trivia Quiz</h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Get 5+ correct answers in the daily trivia quiz for a card drop. Scoring a perfect 5/5 increases the chance of an **Epic** or **Legendary** card.
                </p>
              </div>
            </div>

            <div className="surface-glass-2 border border-neutral-850 p-4 rounded-xl flex items-start gap-3">
              <span className="text-xl">⚽</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Match Predictions</h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Earn 1 card for every correct outcome you predict. Getting a perfect score (11/11 pts) guarantees an **Epic** (70%) or **Legendary** (30%) card.
                </p>
              </div>
            </div>

            <div className="surface-glass-2 border border-neutral-850 p-4 rounded-xl flex items-start gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Hot Streaks & Leaderboards</h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Predict 3 correct outcomes in a row to get a bonus card. Finish #1 on any Matchday leaderboard to receive a **3-card pack**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Inline Card Reveal Overlay Modal */}
      {revealQueue.length > 0 && currentRevealIndex >= 0 && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
              {isViewingCollectionCard 
                ? "Card Viewer" 
                : `Card Reward ${currentRevealIndex + 1} of ${revealQueue.length}`
              }
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              {isViewingCollectionCard 
                ? "Tap the Card to Flip and View Stats!" 
                : "Flip the Card to Reveal Your Player!"
              }
            </h2>
          </div>

          <CardReveal
            card={revealQueue[currentRevealIndex]}
            onComplete={handleRevealComplete}
            detailsUrl={isViewingCollectionCard ? `/collection/${revealQueue[currentRevealIndex].id}` : undefined}
          />
        </div>
      )}
    </div>
  );
}
