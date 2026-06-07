"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CollectionGrid from "@/components/cards/CollectionGrid";
import CardReveal from "@/components/cards/CardReveal";
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
  const [userId, setUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);

  // Daily Login Claiming State
  const [claiming, setClaiming] = useState(false);
  const [revealQueue, setRevealQueue] = useState<PlayerCardData[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);

  // Load Initial Data
  useEffect(() => {
    async function loadInitialData() {
      try {
        // 1. Get streak info
        const streakRes = await fetch("/api/daily-login");
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData);
        }

        // 2. Fetch userId (can get it from a simple who-am-i call, or we can look at jwt decoded / public session info.
        // Let's call /api/favourite-team or create a check to get active user. Wait, we can fetch public info or just query collection progress to get user info)
        const progressRes = await fetch("/api/collection/progress");
        if (progressRes.ok) {
          // Just verifying we are logged in
        }

        // Let's decode or get user details. Wait! We can get the user ID by checking the JWT. Let's fetch favourite-team to get a success status
        const favTeamRes = await fetch("/api/favourite-team");
        if (favTeamRes.ok) {
          // If we need the user ID for sharing, let's fetch from a session endpoint or build it dynamically.
          // Wait! Let's make a request to /api/collection. It returns the list of teams and cards.
        }

        // Load collection
        await loadCollection(null);
      } catch (err: any) {
        setError("Error loading collection. Please try again.");
        console.error(err);
      }
    }
    loadInitialData();
  }, []);

  const loadCollection = async (teamId: number | null) => {
    setLoading(true);
    try {
      const url = teamId ? `/api/collection?teamId=${teamId}` : "/api/collection";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load cards");
      const data = await res.json();
      setCards(data.cards || []);
      setTeams(data.teams || []);
      setActiveTeamId(data.activeTeamId);
      
      // Get user id from cookies or JWT if possible - but wait, the share link needs the user's ID.
      // Let's query public collection. Wait, does public collection need user ID? Yes, /users/[id]/collection.
      // To get current user's ID, we can fetch from a helper endpoint or just fetch progress which can include it.
      // Let's add a small GET in api/collection or progress to get the user ID, or fetch it.
      // Let's look at what endpoints we have. We can fetch it by doing a quick fetch to an endpoint.
      // Let's see if we can get user ID from a simple call. Let's create an endpoint or just fetch /api/trades to see if it exposes it,
      // or we can fetch a /api/users/me endpoint if it exists. Wait! Let's write a small API endpoint if we need to,
      // or check if there is an existing endpoint. Wait, does `/api/trades` return current user ID? Let's check.
      // Actually, we can fetch `userId` from a token or session. Let's fetch it from a small custom endpoint `/api/me` or `/api/users/me` if we want.
      // Let's make a quick request to `/api/favourite-team`. It returns success and team.
      // Wait, let's check: does `/api/collection/progress` have the user ID? It does not, but we can write a simple endpoint or just return user ID in `/api/collection`!
      // Yes! That is a genius idea: let's modify `/api/collection` (GET) to return the current user's ID!
      // Let's see: we can do that easily by modifying `/api/collection/route.ts` to add `userId: user.userId` in the json payload!
      // Let's do that right after this, or let's assume we can fetch it. Let's replace the collection route to include `userId` in its return.
      // Yes!
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
        setRevealQueue(data.droppedCards);
        setCurrentRevealIndex(0); // Start revealing the first card
      }

      // Reload the collection for the active team
      await loadCollection(activeTeamId);
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
    }
  };

  const handleShareCollection = async () => {
    // Let's fetch whoami if we don't have user ID
    let currentId = userId;
    if (!currentId) {
      try {
        const res = await fetch("/api/collection/progress"); // Wait, we can get it from collection API
        const data = await fetch("/api/collection").then(r => r.json());
        if (data.userId) {
          setUserId(data.userId);
          currentId = data.userId;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (currentId) {
      const shareUrl = `${window.location.origin}/users/${currentId}/collection`;
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } else {
      setError("Unable to generate sharing link. Try again.");
    }
  };

  return (
    <div className="min-h-screen text-white bg-base-bg p-4 sm:p-6 pb-24">
      {/* Upper Navigation Tabs */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Card Collection
        </h1>
        <div className="flex gap-2">
          <Link
            href="/trades"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center gap-1.5"
          >
            🔄 Trades Hub
          </Link>
          <button
            onClick={handleShareCollection}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            {shareSuccess ? "✅ Link Copied!" : "📤 Share"}
          </button>
        </div>
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
              <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-neutral-400 font-bold text-xs uppercase tracking-wide">
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

      {/* Team Filter / Selector */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto py-2 pr-4 scrollbar-thin">
        {teams.map((t) => {
          const isActive = activeTeamId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTeamId(t.id);
                loadCollection(t.id);
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

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-t-indigo-500 border-neutral-800 animate-spin" />
        </div>
      ) : (
        <CollectionGrid cards={cards} onCardClick={(c) => {
          // Redirect to card detail page
          window.location.href = `/collection/${c.id}`;
        }} />
      )}

      {/* Inline Card Reveal Overlay Modal */}
      {revealQueue.length > 0 && currentRevealIndex >= 0 && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-6">
            <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
              Card Reward {currentRevealIndex + 1} of {revealQueue.length}
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              Flip the Card to Reveal Your Player!
            </h2>
          </div>
          
          <CardReveal
            card={revealQueue[currentRevealIndex]}
            onComplete={handleRevealComplete}
          />
        </div>
      )}
    </div>
  );
}
