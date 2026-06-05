"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Shield, History, Gamepad2, ChevronRight, Sparkles, LayoutGrid } from "lucide-react";
import AdBanner, { NativeBanner } from "@/components/AdBanner";

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

/* ── 3-D SVG Icons ── */

const Icon3dPenalty = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <defs>
      <radialGradient id="ball-top" cx="38%" cy="32%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ball-body" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#15803d" />
      </radialGradient>
      <filter id="ball-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4ade80" floodOpacity="0.5" />
      </filter>
    </defs>
    {/* Shadow ellipse */}
    <ellipse cx="40" cy="72" rx="16" ry="4" fill="#4ade80" opacity="0.18" />
    {/* Ball body */}
    <circle cx="40" cy="36" r="26" fill="url(#ball-body)" filter="url(#ball-shadow)" />
    {/* Pentagon patches */}
    <path d="M40 14 l5 4 -2 6 -6 0 -2-6z" fill="#166534" opacity="0.8" />
    <path d="M56 25 l2 6 -5 3 -4-4 2-6z" fill="#166534" opacity="0.8" />
    <path d="M51 47 l-3 5 -6-1 -1-6 5-3z" fill="#166534" opacity="0.8" />
    <path d="M29 47 l-5-3 -1 6 -6 1 -3-5z" fill="#166534" opacity="0.8" />
    <path d="M24 25 l-2 6 4 4 -5-3z" fill="#166534" opacity="0.7" />
    {/* Shine */}
    <circle cx="33" cy="27" r="7" fill="url(#ball-top)" />
    {/* Goal post - bottom */}
    <rect x="14" y="60" width="52" height="4" rx="2" fill="#d1d5db" />
    <rect x="14" y="56" width="4" height="8" rx="1.5" fill="#9ca3af" />
    <rect x="62" y="56" width="4" height="8" rx="1.5" fill="#9ca3af" />
    <rect x="14" y="56" width="52" height="2" rx="1" fill="#f9fafb" opacity="0.5" />
  </svg>
);

const Icon3dTrivia = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <defs>
      <radialGradient id="brain-g" cx="38%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0369a1" />
      </radialGradient>
      <radialGradient id="brain-shine" cx="35%" cy="28%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id="brain-glow">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.6" />
      </filter>
    </defs>
    <ellipse cx="40" cy="73" rx="14" ry="3.5" fill="#38bdf8" opacity="0.15" />
    {/* Brain shape */}
    <path d="M40 15 C28 15 20 23 20 32 C20 37 22 41 24 44 C20 46 18 50 19 54 C20 59 25 62 30 62 L50 62 C55 62 60 59 61 54 C62 50 60 46 56 44 C58 41 60 37 60 32 C60 23 52 15 40 15Z"
      fill="url(#brain-g)" filter="url(#brain-glow)" />
    {/* Brain split line */}
    <path d="M40 18 Q38 32 40 46 Q42 32 40 18" stroke="#0284c7" strokeWidth="1.5" opacity="0.5" fill="none" />
    {/* Left lobe wrinkles */}
    <path d="M24 30 Q27 27 30 30" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    <path d="M22 38 Q26 35 29 38" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    <path d="M21 47 Q25 44 28 47" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Right lobe wrinkles */}
    <path d="M56 30 Q53 27 50 30" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    <path d="M58 38 Q54 35 51 38" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    <path d="M59 47 Q55 44 52 47" stroke="#0284c7" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Shine */}
    <ellipse cx="31" cy="24" rx="6" ry="5" fill="url(#brain-shine)" />
    {/* Question mark badge */}
    <circle cx="57" cy="20" r="10" fill="#0ea5e9" />
    <text x="57" y="25" textAnchor="middle" fill="white" fontSize="13" fontWeight="900">?</text>
  </svg>
);

const Icon3dWhoAmI = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <defs>
      <radialGradient id="glass-body" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#5eead4" />
        <stop offset="100%" stopColor="#0d9488" />
      </radialGradient>
      <filter id="glass-glow">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#2dd4bf" floodOpacity="0.6" />
      </filter>
    </defs>
    <ellipse cx="40" cy="73" rx="13" ry="3" fill="#2dd4bf" opacity="0.15" />
    {/* Magnifying glass circle */}
    <circle cx="33" cy="33" r="19" fill="url(#glass-body)" filter="url(#glass-glow)" />
    <circle cx="33" cy="33" r="13" fill="#0d9488" opacity="0.5" />
    <circle cx="33" cy="33" r="13" stroke="#5eead4" strokeWidth="1" fill="none" opacity="0.4" />
    {/* Glass reflection */}
    <ellipse cx="27" cy="26" rx="5" ry="4" fill="white" opacity="0.25" transform="rotate(-30 27 26)" />
    {/* Silhouette inside */}
    <circle cx="33" cy="30" r="4" fill="#ccfbf1" opacity="0.7" />
    <path d="M25 42 Q33 36 41 42" fill="#ccfbf1" opacity="0.5" />
    {/* Handle */}
    <rect x="47" y="47" width="16" height="6" rx="3" fill="#0f766e" transform="rotate(45 47 47)" />
    <rect x="47" y="47" width="14" height="4" rx="2" fill="#5eead4" opacity="0.5" transform="rotate(45 47 47)" />
  </svg>
);

const Icon3dClock = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <defs>
      <radialGradient id="clock-face" cx="40%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#b45309" />
      </radialGradient>
      <radialGradient id="clock-inner" cx="38%" cy="32%" r="60%">
        <stop offset="0%" stopColor="#1c1917" />
        <stop offset="100%" stopColor="#0c0a09" />
      </radialGradient>
      <filter id="clock-glow">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#fbbf24" floodOpacity="0.55" />
      </filter>
    </defs>
    <ellipse cx="40" cy="73" rx="14" ry="3.5" fill="#fbbf24" opacity="0.15" />
    {/* Outer ring */}
    <circle cx="40" cy="38" r="27" fill="url(#clock-face)" filter="url(#clock-glow)" />
    {/* Crown / top knob */}
    <rect x="37" y="9" width="6" height="6" rx="2" fill="#d97706" />
    <rect x="38" y="8" width="4" height="3" rx="1" fill="#fbbf24" />
    {/* Face */}
    <circle cx="40" cy="38" r="21" fill="url(#clock-inner)" />
    {/* Tick marks */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
      const r1 = i % 3 === 0 ? 16 : 18, r2 = 20;
      const a = (angle - 90) * Math.PI / 180;
      return <line key={angle}
        x1={40 + r1 * Math.cos(a)} y1={38 + r1 * Math.sin(a)}
        x2={40 + r2 * Math.cos(a)} y2={38 + r2 * Math.sin(a)}
        stroke={i % 3 === 0 ? "#fbbf24" : "#78716c"} strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />;
    })}
    {/* Minute hand (pointing ~8 min) */}
    <line x1="40" y1="38" x2="40" y2="22" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
    {/* Hour hand (pointing ~4) */}
    <line x1="40" y1="38" x2="52" y2="47" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
    {/* Center dot */}
    <circle cx="40" cy="38" r="3" fill="#fbbf24" />
    <circle cx="40" cy="38" r="1.5" fill="#fff" />
    {/* Lightning bolt badge */}
    <circle cx="60" cy="18" r="10" fill="#f59e0b" />
    <path d="M63 12 l-5 8 h4 l-5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const Icon3dFormation = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <defs>
      <linearGradient id="pitch-g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
      <filter id="pitch-glow">
        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#a855f7" floodOpacity="0.5" />
      </filter>
    </defs>
    <ellipse cx="40" cy="73" rx="16" ry="4" fill="#a855f7" opacity="0.15" />
    {/* Pitch board */}
    <rect x="10" y="12" width="60" height="58" rx="6" fill="url(#pitch-g)" filter="url(#pitch-glow)" />
    {/* Pitch markings */}
    <rect x="16" y="18" width="48" height="46" rx="3" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />
    <line x1="40" y1="18" x2="40" y2="64" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
    <circle cx="40" cy="41" r="8" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
    {/* GK box */}
    <rect x="28" y="58" width="24" height="8" rx="1" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
    {/* Players - 4-3-3 formation dots */}
    {/* GK */}
    <circle cx="40" cy="61" r="3.5" fill="#c4b5fd" />
    {/* Defenders */}
    <circle cx="20" cy="52" r="3.5" fill="#ddd6fe" />
    <circle cx="31" cy="52" r="3.5" fill="#ddd6fe" />
    <circle cx="49" cy="52" r="3.5" fill="#ddd6fe" />
    <circle cx="60" cy="52" r="3.5" fill="#ddd6fe" />
    {/* Midfielders */}
    <circle cx="26" cy="41" r="3.5" fill="#ede9fe" />
    <circle cx="40" cy="41" r="3.5" fill="#ede9fe" />
    <circle cx="54" cy="41" r="3.5" fill="#ede9fe" />
    {/* Forwards */}
    <circle cx="22" cy="28" r="3.5" fill="#f5f3ff" />
    <circle cx="40" cy="25" r="3.5" fill="#f5f3ff" />
    <circle cx="58" cy="28" r="3.5" fill="#f5f3ff" />
    {/* Shine top */}
    <rect x="12" y="13" width="56" height="8" rx="4" fill="white" opacity="0.07" />
  </svg>
);

const Icon3dBracket = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <defs>
      <linearGradient id="trophy-g" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="trophy-shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id="trophy-glow">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#fbbf24" floodOpacity="0.6" />
      </filter>
    </defs>
    <ellipse cx="40" cy="74" rx="15" ry="4" fill="#fbbf24" opacity="0.2" />
    {/* Trophy cup body */}
    <path d="M26 10 h28 v22 c0 14 -8 20 -14 22 c-6-2-14-8-14-22 Z" fill="url(#trophy-g)" filter="url(#trophy-glow)" />
    {/* Handles */}
    <path d="M26 16 Q16 20 18 28 Q20 34 26 32" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
    <path d="M54 16 Q64 20 62 28 Q60 34 54 32" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
    {/* Shine on cup */}
    <path d="M30 12 Q34 16 32 26" stroke="url(#trophy-shine)" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Star inside */}
    <path d="M40 22 l2 5 5 0 -4 3 2 5 -5-3 -5 3 2-5 -4-3 5 0z" fill="#fff9" />
    {/* Stem */}
    <rect x="36" y="54" width="8" height="8" rx="1" fill="#b45309" />
    {/* Base */}
    <rect x="28" y="62" width="24" height="6" rx="3" fill="url(#trophy-g)" />
    <rect x="29" y="62" width="22" height="3" rx="2" fill="#fde68a" opacity="0.3" />
    {/* Star badge */}
    <circle cx="60" cy="14" r="10" fill="#f59e0b" />
    <path d="M60 8 l1.5 4 4 0 -3 2.5 1.2 4 -3.7-2.5 -3.7 2.5 1.2-4 -3-2.5 4 0z" fill="white" />
  </svg>
);

const GAMES = [
  { id: "penalty",   title: "Penalty Shootout",    Icon3d: Icon3dPenalty,   accent: "#4ade80", glow: "rgba(74,222,128,0.5)",   bg: "linear-gradient(145deg,#052e16,#15803d)",  badge: "DAILY",     maxPts: "20",  href: "/games/penalty" },
  { id: "trivia",    title: "Football Trivia",      Icon3d: Icon3dTrivia,    accent: "#38bdf8", glow: "rgba(56,189,248,0.5)",   bg: "linear-gradient(145deg,#082f49,#0369a1)",  badge: "DAILY",     maxPts: "30",  href: "/games/trivia" },
  { id: "who_am_i",  title: "Who Am I?",            Icon3d: Icon3dWhoAmI,    accent: "#2dd4bf", glow: "rgba(45,212,191,0.5)",   bg: "linear-gradient(145deg,#042f2e,#0f766e)",  badge: "DAILY",     maxPts: "15",  href: "/games/who-am-i" },
  { id: "first_goal",title: "First Goal Timer",     Icon3d: Icon3dClock,     accent: "#fbbf24", glow: "rgba(251,191,36,0.5)",   bg: "linear-gradient(145deg,#1c1400,#b45309)",  badge: "PER MATCH", maxPts: "20",  href: "/games/first-goal" },
  { id: "formation", title: "Formation Predictor",  Icon3d: Icon3dFormation, accent: "#a78bfa", glow: "rgba(167,139,250,0.5)",  bg: "linear-gradient(145deg,#1e1035,#6d28d9)",  badge: "PER MATCH", maxPts: "20",  href: "/games/formation" },
  { id: "bracket",   title: "Tournament Bracket",   Icon3d: Icon3dBracket,   accent: "#facc15", glow: "rgba(250,204,21,0.5)",   bg: "linear-gradient(145deg,#1a1200,#a16207)",  badge: "ONE-SHOT",  maxPts: "100+",href: "/games/bracket" },
];

export default function GamesHub() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [gamePoints, setGamePoints] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, lbRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/games/leaderboard?game=all")]);
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
      setTimeout(() => setRevealed(true), 80);
    }
    load();
  }, []);

  return (
    <div className="relative min-h-screen pb-24" style={{ background: "#0a0a0f", color: "#fff" }}>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(22px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes iconFloat {
          0%,100% { transform: translateY(0px)  rotate(0deg)  scale(1); }
          50%      { transform: translateY(-7px) rotate(4deg)  scale(1.06); }
        }
        @keyframes iconPress {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.88) rotate(-4deg); }
          100% { transform: scale(1.08) rotate(2deg); }
        }
        .card-in  { animation: cardIn 0.48s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .icon-float { animation: iconFloat 3.8s ease-in-out infinite; }
        .icon-press { animation: iconPress 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .game-tile  { transition: transform 0.15s ease, box-shadow 0.25s ease; cursor: pointer; }
        .game-tile:active { transform: scale(0.93) !important; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <img src="/skorio-logo.png" alt="Skorio Logo" className="w-7 h-7 object-contain rounded-lg" />
          <span className="text-lg font-black tracking-tighter" style={{ color: "#a855f7" }}>
            SKO<span style={{ color: "#fff" }}>RIO</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {gamePoints > 0 && (
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full"
              style={{ color: "#a78bfa", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}>
              {gamePoints} pts
            </span>
          )}
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm select-none"
            style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}>
            {(currentUser?.name ?? "U")[0].toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-20 pb-4">

        {/* Hero */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <Gamepad2 className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#a78bfa" }}>Mini Games Arena</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-1">Play & Earn Points</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Six games. One leaderboard. Compete daily.</p>
          <button onClick={() => router.push("/games/leaderboard")}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#c4b5fd" }}>
            <Trophy className="w-4 h-4" />
            Games Leaderboard
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-5 px-6">
          {GAMES.map((game, idx) => {
            const isHovered = hovered === game.id;
            const isPressed = pressed === game.id;
            return (
              <div
                key={game.id}
                className={`flex flex-col items-center gap-2 select-none ${revealed ? "card-in" : "opacity-0"}`}
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                {/* App icon tile */}
                <div
                  className="game-tile relative flex items-center justify-center w-full overflow-hidden"
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: "20px",
                    background: game.bg,
                    boxShadow: isHovered
                      ? `0 8px 32px ${game.glow}, 0 2px 8px rgba(0,0,0,0.6)`
                      : `0 4px 16px rgba(0,0,0,0.5)`,
                    transform: isPressed ? "scale(0.90)" : isHovered ? "scale(1.04)" : "scale(1)",
                    transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHovered(game.id)}
                  onMouseLeave={() => { setHovered(null); setPressed(null); }}
                  onPointerDown={() => setPressed(game.id)}
                  onPointerUp={() => { setPressed(null); router.push(game.href); }}
                >
                  {/* iOS-style gloss highlight top */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                    style={{
                      borderRadius: "20px 20px 60% 60% / 20px 20px 40% 40%",
                      background: "linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0))",
                    }} />

                  {/* 3D Icon centered & filling tile */}
                  <div
                    className={isHovered ? "icon-float" : ""}
                    style={{
                      width: "92%", height: "92%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      filter: `drop-shadow(0 6px 14px ${game.glow})`,
                      transition: "filter 0.3s ease",
                    }}
                  >
                    <game.Icon3d />
                  </div>
                </div>

                {/* Text outside below tile */}
                <div className="text-center w-full">
                  <p className="text-sm font-black text-white leading-tight">{game.title}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: `${game.accent}18`, color: game.accent, border: `1px solid ${game.accent}33` }}>
                      {game.badge}
                    </span>
                    <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {game.maxPts} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ad banner */}
        <div className="mt-5 flex justify-center">
          <AdBanner adKey="70c7ee89310beba32f1c1ee13a530480" width={300} height={250} placement="ad_games_hub_300x250" />
        </div>

        {/* Native banner */}
        <div className="mt-5">
          <NativeBanner
            src="https://pl29633839.effectivecpmnetwork.com/d940a0643b83fbb38d2f7e88a787ae28/invoke.js"
            containerId="container-d940a0643b83fbb38d2f7e88a787ae28"
            placement="ad_games_hub_native"
          />
        </div>

        {/* Points summary */}
        {gamePoints > 0 && (
          <div className="mt-5 rounded-2xl p-4 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.08),rgba(99,102,241,0.05))", border: "1px solid rgba(167,139,250,0.15)" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(167,139,250,0.6)" }}>Your Games Score</p>
              <p className="text-2xl font-black font-mono" style={{ color: "#a78bfa" }}>{gamePoints} <span className="text-base opacity-50">pts</span></p>
            </div>
            <Sparkles className="w-7 h-7" style={{ color: "rgba(167,139,250,0.3)" }} />
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/contests" className="flex flex-col items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity text-white">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-semibold">My Contests</span>
        </a>
        <a href="/games" className="flex flex-col items-center gap-0.5" style={{ color: "#a78bfa" }}>
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Games</span>
        </a>
        <a href="/history" className="flex flex-col items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity text-white">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold">History</span>
        </a>
        {currentUser?.role === "admin" && (
          <a href="/admin" className="flex flex-col items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity text-white">
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Admin</span>
          </a>
        )}
      </nav>
    </div>
  );
}
