"use client";

import React, { useState, useEffect } from "react";
import { Trophy, ChevronDown, ChevronUp, Minus, Award, User, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface RankingPlayer {
  rank: number;
  id: number;
  name: string;
  points: number;
  role: string;
  isUser?: boolean;
}

// Custom Soccer Ball SVG
const SoccerBallIcon = ({ className = "w-6 h-6 text-primary" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" />
    <path d="M12 22v-3" />
    <path d="M10 5 6 8.5" />
    <path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" />
    <path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" />
    <path d="M16.5 13 12 15" />
    <path d="M12 15v4" />
    <path d="M12 22 8.5 19.5" />
    <path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" />
    <path d="M16.5 13H20" />
  </svg>
);

const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getTier = (points: number) => {
  if (points >= 20) return "Pro Tier";
  if (points >= 12) return "Elite";
  if (points >= 6) return "Veteran";
  return "Competitor";
};

export default function Leaderboard() {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; points: number; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [multiplier, setMultiplier] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setCurrentUser(userData.user);
          }
        }

        const rankingsRes = await fetch("/api/leaderboard");
        if (rankingsRes.ok) {
          const rankingsData = await rankingsRes.json();
          if (rankingsData.success) {
            setRankings(rankingsData.rankings);
          }
        }
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Synchronized count-up animation multiplier over 1.5 seconds
  useEffect(() => {
    if (loading || rankings.length === 0) return;
    let startTimestamp: number | null = null;
    const duration = 1500;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setMultiplier(progress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const delay = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, 400);

    return () => clearTimeout(delay);
  }, [loading, rankings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface bg-pitch">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Arena Rankings...
        </p>
      </div>
    );
  }

  // Slice podium players (1st, 2nd, 3rd)
  const first = rankings[0] || null;
  const second = rankings[1] || null;
  const third = rankings[2] || null;

  // The rest go to the list table
  const listRankings = rankings.slice(3);

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 md:pb-8 bg-pitch overflow-x-hidden">
      
      {/* CSS Keyframes animations for Podium Rise */}
      <style>{`
        .podium-rise {
          animation: riseUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(50px);
        }
        @keyframes riseUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* TopAppBar Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-surface/80 backdrop-blur-xl border-b border-white/10 h-16">
        <div className="flex items-center gap-2">
          <SoccerBallIcon className="w-7 h-7 text-primary" />
          <h1 className="headline-md font-extrabold tracking-tighter text-primary select-none">
            PREDIKTO
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors label-md" href="/matches">Matches</a>
            <a className="text-primary font-bold label-md" href="/leaderboard">Rankings</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors label-md" href="/history">Profile</a>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 select-none">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP8lJw8ALFixkH-EjSGFL0Zrn3B2sXjjhJiBFS_BdIvH1HvPsQ0bv-alUicuh1Js8juYlaHRyx57lRKt2qsDLFaRqWm6pewsS4E9aA7CrnRYK9XDk2pXSLm3cwzcKHkqyOuF8mm8xAt_16nTFwqx-GdH_utatVkr-UZcOjiOgppF4EawItJdkmlFg4NLfrrVG0peAg0HyFbqoNHtp_jgRFteFFBoz8UNizq79qJShPjRpjBL0Srk9FKg-5qvn-v45TBIMn4O5HTCAX"
            />
          </div>
        </div>
      </header>

      {/* Main rankings lists */}
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-8">
        
        {/* Header Section */}
        <section className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-3 text-tertiary select-none">
            <Trophy className="w-16 h-16 animate-pulse-slow shadow-tertiary/20" />
          </div>
          <h2 className="headline-lg text-on-surface text-2xl font-extrabold tracking-tight">Global Leaderboard</h2>
          <p className="body-md text-on-surface-variant max-w-md mt-1 text-sm">
            Top predictors across all leagues this season. Are you in the Pro Tier yet?
          </p>
        </section>

        {/* 3D Podium Presentation Section */}
        <section className="flex flex-col md:flex-row items-end justify-center gap-6 mb-12 max-w-2xl mx-auto md:h-[360px] select-none">
          
          {/* 2nd Place */}
          {second && (
            <div className="podium-rise flex flex-col items-center w-full md:w-1/3" style={{ animationDelay: "0.2s" }}>
              <div className="relative mb-3 group">
                <div className="w-16 h-16 rounded-full border-2 border-silver flex items-center justify-center font-extrabold text-xl bg-surface-container text-silver select-none">
                  {getInitials(second.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-silver flex items-center justify-center text-base-bg font-extrabold shimmer-effect overflow-hidden text-[10px]">
                  2
                </div>
              </div>
              <div className="w-full bg-card border border-border-card border-b-0 rounded-t-lg h-28 flex flex-col items-center justify-center shadow-lg">
                <span className="label-md text-on-surface font-medium text-xs truncate w-11/12 text-center">{second.name}</span>
                <span className="headline-md font-bold text-on-surface-variant font-mono mt-0.5">
                  {Math.floor(multiplier * second.points).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/10 px-2 py-0.5 rounded-full mt-1.5">
                  {getTier(second.points)}
                </span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {first && (
            <div className="podium-rise flex flex-col items-center w-full md:w-1/3 z-10" style={{ animationDelay: "0.1s" }}>
              <div className="relative mb-4 group scale-105">
                <div className="w-20 h-20 rounded-full border-4 border-tertiary flex items-center justify-center font-extrabold text-2xl bg-surface-container shadow-[0_0_20px_rgba(255,185,85,0.25)] text-tertiary select-none">
                  {getInitials(first.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary font-extrabold shimmer-effect overflow-hidden text-xs">
                  1
                </div>
              </div>
              <div className="w-full bg-card/65 border border-border-card border-b-0 rounded-t-lg h-40 flex flex-col items-center justify-center shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-t from-tertiary/5 to-transparent rounded-t-lg pointer-events-none" />
                <span className="label-md text-on-surface font-bold relative text-sm truncate w-11/12 text-center">{first.name}</span>
                <span className="headline-lg font-bold text-tertiary font-mono relative mt-0.5 text-xl">
                  {Math.floor(multiplier * first.points).toLocaleString()}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-tertiary bg-tertiary-container/15 px-3 py-0.5 rounded-full mt-2 relative">
                  {getTier(first.points)}
                </span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="podium-rise flex flex-col items-center w-full md:w-1/3" style={{ animationDelay: "0.3s" }}>
              <div className="relative mb-3 group">
                <div className="w-16 h-16 rounded-full border-2 border-bronze flex items-center justify-center font-extrabold text-xl bg-surface-container text-bronze select-none">
                  {getInitials(third.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bronze flex items-center justify-center text-on-surface font-extrabold shimmer-effect overflow-hidden text-[10px]">
                  3
                </div>
              </div>
              <div className="w-full bg-card border border-border-card border-b-0 rounded-t-lg h-24 flex flex-col items-center justify-center shadow-lg">
                <span className="label-md text-on-surface font-medium text-xs truncate w-11/12 text-center">{third.name}</span>
                <span className="headline-md font-bold text-on-surface-variant font-mono mt-0.5">
                  {Math.floor(multiplier * third.points).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary-container/10 px-2 py-0.5 rounded-full mt-1.5">
                  {getTier(third.points)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Ranking List Table Grid */}
        <section className="flex flex-col gap-3">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-1.5 text-on-surface-variant label-sm uppercase tracking-wider font-semibold select-none text-[10px]">
            <div className="col-span-1 text-left">Pos</div>
            <div className="col-span-6 md:col-span-8 text-left">Player</div>
            <div className="col-span-3 md:col-span-2 text-right font-bold">Points</div>
            <div className="col-span-2 md:col-span-1 text-right">Trend</div>
          </div>

          {/* User's position overlay if user not in podium but has rankings */}
          {rankings.length === 0 && (
            <div className="text-center py-6 text-on-surface-variant text-sm">No competitors recorded in standings.</div>
          )}

          {/* Ranking Rows */}
          {rankings.map((player) => {
            const isMe = currentUser && currentUser.id === player.id;
            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 items-center px-4 py-3.5 rounded-lg shadow-sm border transition-all duration-base hover:bg-white/5 ${
                  isMe
                    ? "bg-primary-container/10 border-primary border-l-4 border-l-primary"
                    : "bg-card border-border-card"
                }`}
              >
                {/* Position */}
                <div className={`col-span-1 font-bold label-md text-left ${isMe ? "text-primary" : "text-on-surface-variant"}`}>
                  {player.rank}
                </div>

                {/* Player Info */}
                <div className="col-span-6 md:col-span-8 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm select-none ${
                    isMe ? "bg-primary/20 text-primary border border-primary/30" : "bg-surface-container border border-white/5 text-on-surface-variant"
                  }`}>
                    {getInitials(player.name)}
                  </div>
                  <div className="text-left">
                    <div className={`label-md text-sm ${isMe ? "font-bold text-primary" : "font-medium text-on-surface"}`}>
                      {player.name} {isMe && "(You)"}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider mt-0.5">
                      {getTier(player.points)}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="col-span-3 md:col-span-2 text-right font-mono font-bold headline-md text-white select-none text-sm">
                  {Math.floor(multiplier * player.points).toLocaleString()}
                </div>

                {/* Trend Arrow (Neutral Default) */}
                <div className="col-span-2 md:col-span-1 flex justify-end text-right select-none text-on-surface-variant">
                  <Minus className="w-5 h-5 opacity-40" />
                </div>

              </div>
            );
          })}
        </section>
      </main>

      {/* Responsive Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-surface/80 backdrop-blur-xl border-t border-white/10 md:hidden">
        <a className="flex flex-col items-center justify-center text-on-surface-variant gap-0.5 transition-colors" href="/matches">
          <SoccerBallIcon className="w-5 h-5 text-on-surface-variant" />
          <span className="label-sm select-none text-xs">Matches</span>
        </a>
        <a className="flex flex-col items-center justify-center text-primary font-bold gap-0.5" href="/leaderboard">
          <Award className="w-5 h-5 text-primary" />
          <span className="label-sm select-none text-xs">Rankings</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant gap-0.5 transition-colors" href="/history">
          <User className="w-5 h-5" />
          <span className="label-sm select-none text-xs">Profile</span>
        </a>
        {currentUser?.role === "admin" && (
          <a className="flex flex-col items-center justify-center text-on-surface-variant gap-0.5 transition-colors" href="/admin">
            <Shield className="w-5 h-5" />
            <span className="label-sm select-none text-xs">Admin</span>
          </a>
        )}
      </nav>
    </div>
  );
}
