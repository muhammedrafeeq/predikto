"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Shield, History, Gamepad2, Target, Users,
  Clock, Brain, HelpCircle, Network, ChevronRight, Sparkles, Lock
} from "lucide-react";

const SoccerBallIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" /><path d="M12 22v-3" />
    <path d="M10 5 6 8.5" /><path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" /><path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" /><path d="M16.5 13 12 15" />
    <path d="M12 15v4" /><path d="M12 22 8.5 19.5" /><path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" /><path d="M16.5 13H20" />
  </svg>
);

interface GameCard {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  badge: string;
  badgeColor: string;
  maxPts: string;
  href: string;
  comingSoon?: boolean;
}

const GAMES: GameCard[] = [
  {
    id: "penalty",
    title: "Penalty Shootout",
    tagline: "Beat the keeper",
    description: "Pick your direction and power. The keeper reacts — can you score all 5?",
    icon: Target,
    accent: "text-green-400",
    accentBg: "bg-green-400/10",
    accentBorder: "border-green-400/20",
    accentGlow: "rgba(74,222,128,0.15)",
    badge: "DAILY",
    badgeColor: "bg-green-400/15 text-green-400",
    maxPts: "20 pts",
    href: "/games/penalty",
  },
  {
    id: "trivia",
    title: "Football Trivia",
    tagline: "Test your knowledge",
    description: "10 timed questions across history, rules, players & WC 2026. Speed earns bonus points.",
    icon: Brain,
    accent: "text-sky-400",
    accentBg: "bg-sky-400/10",
    accentBorder: "border-sky-400/20",
    accentGlow: "rgba(56,189,248,0.15)",
    badge: "DAILY",
    badgeColor: "bg-sky-400/15 text-sky-400",
    maxPts: "28 pts",
    href: "/games/trivia",
  },
  {
    id: "who_am_i",
    title: "Who Am I?",
    tagline: "Guess the player",
    description: "Progressive clues revealed one by one. Fewer clues used = more points. One shot.",
    icon: HelpCircle,
    accent: "text-teal-400",
    accentBg: "bg-teal-400/10",
    accentBorder: "border-teal-400/20",
    accentGlow: "rgba(45,212,191,0.15)",
    badge: "DAILY",
    badgeColor: "bg-teal-400/15 text-teal-400",
    maxPts: "20 pts",
    href: "/games/who-am-i",
  },
  {
    id: "first_goal",
    title: "First Goal Timer",
    tagline: "Predict the minute",
    description: "Name the exact minute the first goal is scored in upcoming real matches.",
    icon: Clock,
    accent: "text-amber-400",
    accentBg: "bg-amber-400/10",
    accentBorder: "border-amber-400/20",
    accentGlow: "rgba(251,191,36,0.15)",
    badge: "PER MATCH",
    badgeColor: "bg-amber-400/15 text-amber-400",
    maxPts: "20 pts",
    href: "/games/first-goal",
  },
  {
    id: "formation",
    title: "Formation Predictor",
    tagline: "Pick the lineup",
    description: "Predict the starting XI and formation for real upcoming matches. Points for each correct player.",
    icon: Users,
    accent: "text-violet-400",
    accentBg: "bg-violet-400/10",
    accentBorder: "border-violet-400/20",
    accentGlow: "rgba(167,139,250,0.15)",
    badge: "PER MATCH",
    badgeColor: "bg-violet-400/15 text-violet-400",
    maxPts: "20 pts",
    href: "/games/formation",
  },
  {
    id: "bracket",
    title: "Tournament Bracket",
    tagline: "Fill the WC bracket",
    description: "Predict every knockout result before the tournament starts. Points for each correct winner.",
    icon: Network,
    accent: "text-yellow-400",
    accentBg: "bg-yellow-400/10",
    accentBorder: "border-yellow-400/20",
    accentGlow: "rgba(250,204,21,0.15)",
    badge: "ONE-SHOT",
    badgeColor: "bg-yellow-400/15 text-yellow-400",
    maxPts: "101 pts",
    href: "/games/bracket",
  },
];

export default function GamesHub() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [gamePoints, setGamePoints] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, lbRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/games/leaderboard?game=all"),
        ]);
        if (userRes.ok) {
          const d = await userRes.json();
          if (d.user) setCurrentUser(d.user);

          if (lbRes.ok) {
            const lb = await lbRes.json();
            if (lb.success && d.user) {
              const me = lb.rankings.find((r: any) => r.id === d.user.id);
              if (me) setGamePoints(me.points);
            }
          }
        }
      } catch {}
      // stagger card reveal
      setTimeout(() => setRevealed(true), 100);
    }
    load();
  }, []);

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 md:pb-8 overflow-x-hidden" style={{ background: "#0a0a0f" }}>
      <style>{`
        .game-card-enter {
          opacity: 0;
          transform: translateY(24px);
          animation: gameCardIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes gameCardIn {
          to { opacity: 1; transform: translateY(0); }
        }
        .pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        .float-icon {
          animation: floatIcon 3.5s ease-in-out infinite;
        }
        @keyframes floatIcon {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-6px) rotate(3deg); }
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <SoccerBallIcon className="w-7 h-7 text-primary" />
          <h1 className="headline-md font-extrabold tracking-tighter text-primary select-none">
            PREDIK<span className="text-white">TO</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {gamePoints > 0 && (
            <span className="text-xs font-bold font-mono text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-full border border-violet-400/20">
              {gamePoints} game pts
            </span>
          )}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm select-none"
            style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", boxShadow: "0 0 16px #a855f744" }}>
            {(currentUser?.name ?? "U")[0].toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-8">

        {/* Hero section */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/20 mb-4">
            <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.18em]">Mini Games Arena</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Play & Earn Points</h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Six games, a separate leaderboard, and bragging rights. Each game earns points on the Games board.
          </p>

          <button
            onClick={() => router.push("/games/leaderboard")}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-300 text-sm font-bold hover:bg-violet-500/20 transition-all"
          >
            <Trophy className="w-4 h-4" />
            Games Leaderboard
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* Game Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game, idx) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className={`group relative rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden ${game.accentBorder} ${revealed ? "game-card-enter" : "opacity-0"}`}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  animationDelay: `${idx * 0.07}s`,
                  boxShadow: `0 0 0 0 ${game.accentGlow}`,
                }}
                onClick={() => !game.comingSoon && router.push(game.href)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${game.accentGlow}`;
                  (e.currentTarget as HTMLElement).style.borderColor = game.accentBorder.replace("/20", "/40");
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${game.accentGlow}`;
                }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${game.accentGlow.replace("0.15", "0.8")}, transparent)` }} />

                {/* Coming soon overlay */}
                {game.comingSoon && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
                    style={{ background: "rgba(10,10,15,0.75)", backdropFilter: "blur(4px)" }}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                      <Lock className="w-4 h-4 text-white/40" />
                      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Coming Soon</span>
                    </div>
                  </div>
                )}

                <div className="p-5 flex flex-col gap-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl ${game.accentBg} border ${game.accentBorder} flex items-center justify-center float-icon group-hover:scale-110 transition-transform duration-300`}
                      style={{ animationDelay: `${idx * 0.2}s` }}>
                      <Icon className={`w-5 h-5 ${game.accent}`} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full ${game.badgeColor} border ${game.accentBorder}`}>
                        {game.badge}
                      </span>
                      <span className={`text-[10px] font-black ${game.accent}`}>
                        Up to {game.maxPts}
                      </span>
                    </div>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-white/90 transition-colors">
                      {game.title}
                    </h3>
                    <p className={`text-[11px] font-bold ${game.accent} mb-1.5 uppercase tracking-wider`}>
                      {game.tagline}
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed">{game.description}</p>
                  </div>

                  {/* CTA */}
                  <div className={`flex items-center justify-between pt-3 border-t ${game.accentBorder}`}>
                    <span className="text-[10px] text-white/30 font-mono font-bold">GAME #{idx + 1}</span>
                    <div className={`flex items-center gap-1 text-xs font-bold ${game.accent} group-hover:gap-2 transition-all`}>
                      {game.comingSoon ? "Soon" : "Play Now"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Points summary if user has game points */}
        {gamePoints > 0 && (
          <section className="mt-8 rounded-2xl p-5 border border-violet-400/15"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.04))" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400/60 mb-1">Your Games Score</p>
                <p className="text-3xl font-black text-violet-400 font-mono">{gamePoints} <span className="text-lg text-violet-400/50">pts</span></p>
              </div>
              <Sparkles className="w-8 h-8 text-violet-400/30 pulse-glow" />
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
        style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/matches" className="flex flex-col items-center justify-center text-white/40 hover:text-primary gap-0.5 transition-colors">
          <SoccerBallIcon className="w-5 h-5 text-white/40" />
          <span className="text-[10px] font-semibold">Matches</span>
        </a>
        <a href="/leaderboard" className="flex flex-col items-center justify-center text-white/40 hover:text-primary gap-0.5 transition-colors">
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Rankings</span>
        </a>
        <a href="/games" className="flex flex-col items-center justify-center text-violet-400 font-bold gap-0.5">
          <Gamepad2 className="w-5 h-5 text-violet-400" />
          <span className="text-[10px] font-semibold">Games</span>
        </a>
        <a href="/history" className="flex flex-col items-center justify-center text-white/40 hover:text-sky-400 gap-0.5 transition-colors">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold">History</span>
        </a>
        {currentUser?.role === "admin" && (
          <a href="/admin" className="flex flex-col items-center justify-center text-white/40 hover:text-violet-400 gap-0.5 transition-colors">
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Admin</span>
          </a>
        )}
      </nav>
    </div>
  );
}
