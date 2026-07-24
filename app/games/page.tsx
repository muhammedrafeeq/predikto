"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Gamepad2,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  HelpCircle,
  Search,
  Flag,
  Flame,
  Award
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";

/* ── 3-D SVG Icons for Volt Score Theme ── */

const Icon3dPenalty = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="ball-top-v" cx="38%" cy="32%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#c3f400" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ball-body-v" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#c3f400" />
        <stop offset="100%" stopColor="#556d00" />
      </radialGradient>
      <filter id="ball-shadow-v" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#c3f400" floodOpacity="0.6" />
      </filter>
    </defs>
    <ellipse cx="40" cy="72" rx="16" ry="4" fill="#c3f400" opacity="0.2" />
    <circle cx="40" cy="36" r="26" fill="url(#ball-body-v)" filter="url(#ball-shadow-v)" />
    <path d="M40 14 l5 4 -2 6 -6 0 -2-6z" fill="#161e00" opacity="0.85" />
    <path d="M56 25 l2 6 -5 3 -4-4 2-6z" fill="#161e00" opacity="0.85" />
    <path d="M51 47 l-3 5 -6-1 -1-6 5-3z" fill="#161e00" opacity="0.85" />
    <path d="M29 47 l-5-3 -1 6 -6 1 -3-5z" fill="#161e00" opacity="0.85" />
    <path d="M24 25 l-2 6 4 4 -5-3z" fill="#161e00" opacity="0.75" />
    <circle cx="33" cy="27" r="7" fill="url(#ball-top-v)" />
    <rect x="14" y="60" width="52" height="4" rx="2" fill="#e5e2e1" />
    <rect x="14" y="56" width="4" height="8" rx="1.5" fill="#c4c9ac" />
    <rect x="62" y="56" width="4" height="8" rx="1.5" fill="#c4c9ac" />
    <rect x="14" y="56" width="52" height="2" rx="1" fill="#ffffff" opacity="0.6" />
  </svg>
);

const Icon3dTrivia = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="brain-v" cx="38%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#00e3fd" />
        <stop offset="100%" stopColor="#004f58" />
      </radialGradient>
      <filter id="brain-glow-v">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#00e3fd" floodOpacity="0.6" />
      </filter>
    </defs>
    <ellipse cx="40" cy="73" rx="14" ry="3.5" fill="#00e3fd" opacity="0.2" />
    <path d="M40 15 C28 15 20 23 20 32 C20 37 22 41 24 44 C20 46 18 50 19 54 C20 59 25 62 30 62 L50 62 C55 62 60 59 61 54 C62 50 60 46 56 44 C58 41 60 37 60 32 C60 23 52 15 40 15Z"
      fill="url(#brain-v)" filter="url(#brain-glow-v)" />
    <path d="M40 18 Q38 32 40 46 Q42 32 40 18" stroke="#9cf0ff" strokeWidth="1.5" opacity="0.6" fill="none" />
    <circle cx="57" cy="20" r="10" fill="#00e3fd" />
    <text x="57" y="25" textAnchor="middle" fill="#001f24" fontSize="13" fontWeight="900">?</text>
  </svg>
);

const Icon3dWhoAmI = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="glass-v" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#c3f400" />
        <stop offset="100%" stopColor="#3c4d00" />
      </radialGradient>
      <filter id="glass-glow-v">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#c3f400" floodOpacity="0.6" />
      </filter>
    </defs>
    <ellipse cx="40" cy="73" rx="13" ry="3" fill="#c3f400" opacity="0.2" />
    <circle cx="33" cy="33" r="19" fill="url(#glass-v)" filter="url(#glass-glow-v)" />
    <circle cx="33" cy="33" r="13" fill="#161e00" opacity="0.5" />
    <circle cx="33" cy="30" r="4" fill="#c3f400" opacity="0.9" />
    <path d="M25 42 Q33 36 41 42" fill="#c3f400" opacity="0.7" />
    <rect x="47" y="47" width="16" height="6" rx="3" fill="#3c4d00" transform="rotate(45 47 47)" />
  </svg>
);

const Icon3dFlag = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="flag-top-v" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffb4ab" />
        <stop offset="100%" stopColor="#93000a" />
      </linearGradient>
      <linearGradient id="flag-bot-v" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c3f400" />
        <stop offset="100%" stopColor="#556d00" />
      </linearGradient>
      <filter id="flag-glow-v">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#ffb4ab" floodOpacity="0.4" />
      </filter>
    </defs>
    <ellipse cx="21" cy="73" rx="6" ry="2.5" fill="#c4c9ac" opacity="0.3" />
    <rect x="18" y="10" width="4" height="62" rx="2" fill="#e5e2e1" />
    <path d="M22 12 Q40 10 56 16 Q48 22 56 28 Q40 34 22 32 Z" fill="url(#flag-top-v)" filter="url(#flag-glow-v)" />
    <path d="M22 32 Q40 30 56 36 Q48 42 56 48 Q40 50 22 48 Z" fill="url(#flag-bot-v)" />
    <circle cx="20" cy="10" r="4" fill="#ffffff" />
  </svg>
);

const GAMES = [
  {
    id: "penalty",
    title: "Penalty Shootout",
    description: "Aim, power up, and score against world-class AI goalkeepers!",
    Icon3d: Icon3dPenalty,
    accent: "#c3f400",
    badge: "20 PTS",
    href: "/games/penalty",
    tag: "FEATURED"
  },
  {
    id: "trivia",
    title: "Football Trivia",
    description: "Answer real-time trivia questions about leagues, stats & legends.",
    Icon3d: Icon3dTrivia,
    accent: "#00e3fd",
    badge: "30 PTS",
    href: "/games/trivia",
    tag: "POPULAR"
  },
  {
    id: "who_am_i",
    title: "Who Am I?",
    description: "Guess secret star footballers using clue hints!",
    Icon3d: Icon3dWhoAmI,
    accent: "#c3f400",
    badge: "15 PTS",
    href: "/games/who-am-i",
    tag: "DAILY"
  },
  {
    id: "flag_quiz",
    title: "Flag Quiz",
    description: "Identify national team flags and test your global knowledge.",
    Icon3d: Icon3dFlag,
    accent: "#ffb4ab",
    badge: "90 PTS",
    href: "/games/flag-quiz",
    tag: "CHALLENGE"
  },
];

export default function VoltScoreGamesHub() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [gamePoints, setGamePoints] = useState(0);

  useEffect(() => {
    async function loadUser() {
      try {
        const [userRes, lbRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/games/leaderboard?game=all")
        ]);
        if (userRes.ok) {
          const d = await userRes.json();
          if (d.user) setCurrentUser(d.user);
          if (lbRes.ok && d.user) {
            const lb = await lbRes.json();
            if (lb.success) {
              const me = lb.rankings?.find((r: any) => r.id === d.user.id);
              if (me) setGamePoints(me.points);
            }
          }
        }
      } catch (err) {
        console.error("Games page user load error:", err);
      }
    }
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-body-md selection:bg-[#c3f400] selection:text-[#161e00]">
      {/* Top App Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
        <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c3f400]/10 border border-[#c3f400]/30 flex items-center justify-center text-[#c3f400] group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-[#c3f400]" />
            </div>
            <h1 className="font-headline-lg-mobile text-[22px] sm:text-[26px] text-[#c3f400] tracking-wider leading-none">
              SKORIO
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-3.5 py-1.5 rounded-full glass-card border border-[#c3f400]/30 text-[#c3f400] hover:bg-[#c3f400] hover:text-[#0A0A0A] font-label-caps text-[11px] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              Live Scores
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="pt-20 pb-28 px-4 sm:px-6 max-w-[1200px] mx-auto space-y-8">
        {/* Hero Section */}
        <section className="glass-card rounded-2xl p-6 sm:p-10 border border-[#c3f400]/30 bg-gradient-to-r from-[#c3f400]/10 via-[#0e0e0e] to-[#00e3fd]/10 shadow-[0_0_30px_rgba(195,244,0,0.1)] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c3f400]/10 border border-[#c3f400]/30 text-[#c3f400] font-label-caps text-[11px] tracking-widest uppercase mb-3">
              <Gamepad2 className="w-4 h-4 text-[#c3f400] animate-pulse" /> MINI-GAMES ARENA
            </div>
            <h2 className="font-headline-lg text-[28px] sm:text-[38px] text-white leading-tight uppercase tracking-wider">
              TEST YOUR FOOTBALL <span className="text-[#c3f400]">SKILLS & KNOWLEDGE</span>
            </h2>
            <p className="font-body-lg text-[#c4c9ac] mt-2 text-[16px] sm:text-[18px]">
              Compete in instant mini-games, earn token rewards, and climb the leaderboards!
            </p>
          </div>
        </section>

        {/* User Points Card */}
        {currentUser && (
          <section className="glass-card rounded-xl p-5 border border-[#c3f400]/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c3f400]/20 border border-[#c3f400]/40 flex items-center justify-center text-[#c3f400] font-headline-md text-xl">
                🏆
              </div>
              <div>
                <p className="font-label-caps text-[11px] text-[#c4c9ac] uppercase">Your Game Points</p>
                <p className="font-headline-lg text-[28px] text-[#c3f400] leading-none mt-0.5">
                  {gamePoints} <span className="font-label-mono text-sm text-[#c4c9ac]">PTS</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/history")}
              className="px-4 py-2 rounded-xl glass-card text-[#c3f400] hover:bg-[#c3f400] hover:text-[#161e00] font-label-caps text-[11px] font-bold transition-all border border-[#c3f400]/30 cursor-pointer"
            >
              View History
            </button>
          </section>
        )}

        {/* Games Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GAMES.map((game) => (
            <div
              key={game.id}
              onClick={() => router.push(game.href)}
              className="glass-card rounded-2xl p-6 border border-white/10 hover:border-[#c3f400]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between gap-6 group relative overflow-hidden shadow-xl hover:-translate-y-1"
            >
              {/* Top Tag & Badge */}
              <div className="flex justify-between items-center relative z-10">
                <span
                  className="font-label-caps text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase"
                  style={{
                    backgroundColor: `${game.accent}15`,
                    borderColor: `${game.accent}40`,
                    color: game.accent,
                  }}
                >
                  {game.tag}
                </span>

                <span className="font-label-mono text-[11px] font-bold text-[#c3f400] bg-[#c3f400]/10 px-2.5 py-1 rounded-full border border-[#c3f400]/20">
                  +{game.badge}
                </span>
              </div>

              {/* 3D Icon Container */}
              <div className="w-24 h-24 mx-auto relative z-10 group-hover:scale-110 transition-transform duration-300">
                <game.Icon3d />
              </div>

              {/* Game Info & Action Button */}
              <div className="space-y-3 relative z-10 text-center">
                <h3 className="font-headline-md text-[20px] text-white uppercase tracking-wider group-hover:text-[#c3f400] transition-colors">
                  {game.title}
                </h3>
                <p className="font-body-md text-[14px] text-[#c4c9ac] line-clamp-2">
                  {game.description}
                </p>

                <button className="w-full py-2.5 rounded-xl bg-[#c3f400] text-[#161e00] font-headline-md text-[15px] uppercase tracking-wider hover:bg-[#abd600] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(195,244,0,0.2)]">
                  Play Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
      <BottomNav activeTab="games" />
    </div>
  );
}
