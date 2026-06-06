"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Crown, Star, Award, History, Shield, Gamepad2, ChevronLeft, LayoutGrid } from "lucide-react";

const SoccerBallIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" /><path d="M12 22v-3" />
    <path d="M10 5 6 8.5" /><path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" /><path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" /><path d="M16.5 13 12 15" />
    <path d="M12 15v4" />
    <path d="M12 22 8.5 19.5" /><path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" /><path d="M16.5 13H20" />
  </svg>
);

const GAME_FILTERS = [
  { id: "all", label: "All Games", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
  { id: "penalty", label: "Penalty", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  { id: "trivia", label: "Trivia", color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20" },
  { id: "who_am_i", label: "Who Am I", color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20" },
  { id: "first_goal", label: "First Goal", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { id: "formation", label: "Formation", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
  { id: "bracket", label: "Bracket", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
];

interface Player {
  rank: number;
  id: number;
  name: string;
  points: number;
  gamesPlayed: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export default function GamesLeaderboard() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState("all");
  const [rankings, setRankings] = useState<Player[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [multiplier, setMultiplier] = useState(0);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const d = await res.json();
          if (d.user) setCurrentUser(d.user);
        }
      } catch {}
    }
    loadUser();
  }, []);

  useEffect(() => {
    setLoading(true);
    setMultiplier(0);
    async function loadRankings() {
      try {
        const res = await fetch(`/api/games/leaderboard?game=${activeGame}`);
        if (res.ok) {
          const d = await res.json();
          if (d.success) setRankings(d.rankings);
        }
      } catch {}
      setLoading(false);
    }
    loadRankings();
  }, [activeGame]);

  useEffect(() => {
    if (loading || rankings.length === 0) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setMultiplier(p);
      if (p < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 200);
    return () => clearTimeout(t);
  }, [loading, rankings]);

  const first = rankings[0] ?? null;
  const second = rankings[1] ?? null;
  const third = rankings[2] ?? null;
  const filter = GAME_FILTERS.find((f) => f.id === activeGame) ?? GAME_FILTERS[0];

  return (
    <div className="relative min-h-screen pb-24 md:pb-8 overflow-x-hidden" style={{ background: "#0a0a0f" }}>
      <style>{`
        .podium-rise { animation: riseUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; transform:translateY(50px); }
        @keyframes riseUp { to { opacity:1; transform:translateY(0); } }
        .float-a { animation: floatA 4s ease-in-out infinite; }
        .float-b { animation: floatA 4s ease-in-out infinite; animation-delay:1.5s; }
        .float-c { animation: floatA 4s ease-in-out infinite; animation-delay:0.8s; }
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .sparkle-anim { animation: sparkleA 2.5s ease-in-out infinite; }
        @keyframes sparkleA { 0%,100%{opacity:0.4;transform:scale(0.9)} 50%{opacity:1;transform:scale(1.15);filter:drop-shadow(0 0 10px rgba(245,158,11,0.6))} }
        .stagger-row { opacity:0; transform:translateY(12px); animation: rowIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes rowIn { to { opacity:1; transform:translateY(0); } }
        .shimmer-e::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent); animation:shim 2.5s infinite; }
        @keyframes shim { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/games")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Gamepad2 className="w-6 h-6 text-violet-400" />
          <h1 className="headline-md font-extrabold tracking-tighter text-violet-400 select-none">
            GAMES <span className="text-white">BOARD</span>
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm select-none"
          style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", boxShadow: "0 0 16px #a855f744" }}>
          {(currentUser?.name ?? "U")[0].toUpperCase()}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-8">

        {/* Title */}
        <section className="flex flex-col items-center mb-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-violet-400 uppercase mb-1">Games Arena</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Games Leaderboard</h2>
          <p className="text-white/40 text-sm mt-1.5 max-w-xs">Points earned across all mini-games. Separate from match predictions.</p>
        </section>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-8 scrollbar-none">
          {GAME_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveGame(f.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                activeGame === f.id
                  ? `${f.bg} ${f.color} ${f.border}`
                  : "bg-white/3 text-white/40 border-white/8 hover:text-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/40 animate-pulse font-mono">Loading arena...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No scores yet for this game. Be the first!</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <section className="flex items-end justify-center gap-3 mb-12 h-[280px] select-none px-2">

              {/* 2nd */}
              {second && (
                <div className="podium-rise flex flex-col items-center w-1/3" style={{ animationDelay: "0.2s" }}>
                  <div className="relative mb-3 flex flex-col items-center float-b">
                    <Star className="w-5 h-5 text-slate-400 mb-1" />
                    <div className="w-14 h-14 rounded-full border-2 border-slate-400 flex items-center justify-center font-black text-lg bg-slate-900 text-slate-300 relative"
                      style={{ boxShadow: "0 0 15px rgba(148,163,184,0.15)" }}>
                      {getInitials(second.name)}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-400 border border-slate-900 flex items-center justify-center text-slate-950 font-black text-[10px]">2</div>
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-t from-slate-950/80 to-slate-800/40 border-t border-x border-slate-500/20 rounded-t-xl h-[100px] flex flex-col items-center justify-center relative shimmer-e overflow-hidden"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                    <span className="text-white font-bold text-xs truncate w-11/12 text-center">{second.name}</span>
                    <span className="text-lg font-black text-white font-mono mt-1">{Math.floor(multiplier * second.points)}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 bg-slate-400/10 border border-slate-400/20 px-2 py-0.5 rounded-full mt-1.5">
                      {second.gamesPlayed} games
                    </span>
                  </div>
                </div>
              )}

              {/* 1st */}
              {first && (
                <div className="podium-rise flex flex-col items-center w-1/3 z-10" style={{ animationDelay: "0.1s" }}>
                  <div className="relative mb-3 flex flex-col items-center float-a">
                    <Crown className="w-6 h-6 text-amber-400 mb-1 sparkle-anim" />
                    <div className="w-16 h-16 rounded-full border-[3px] border-amber-400 flex items-center justify-center font-black text-xl bg-amber-950/50 text-amber-300 relative"
                      style={{ boxShadow: "0 0 25px rgba(245,158,11,0.3)" }}>
                      {getInitials(first.name)}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border border-amber-950 flex items-center justify-center text-amber-950 font-black text-[11px] shimmer-e overflow-hidden">1</div>
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-t from-amber-950/80 to-amber-800/40 border-t-2 border-x border-amber-500/40 rounded-t-xl h-[140px] flex flex-col items-center justify-center relative shimmer-e overflow-hidden"
                    style={{ boxShadow: "0 4px 30px rgba(245,158,11,0.15)" }}>
                    <span className="text-white font-black text-sm truncate w-11/12 text-center">{first.name}</span>
                    <span className="text-2xl font-black text-amber-400 font-mono mt-1" style={{ textShadow: "0 0 15px rgba(245,158,11,0.4)" }}>
                      {Math.floor(multiplier * first.points)}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full mt-2">
                      {first.gamesPlayed} games
                    </span>
                  </div>
                </div>
              )}

              {/* 3rd */}
              {third && (
                <div className="podium-rise flex flex-col items-center w-1/3" style={{ animationDelay: "0.3s" }}>
                  <div className="relative mb-3 flex flex-col items-center float-c">
                    <Award className="w-4 h-4 text-amber-700 mb-1" />
                    <div className="w-14 h-14 rounded-full border-2 border-amber-700 flex items-center justify-center font-black text-lg bg-amber-950/30 text-amber-600 relative"
                      style={{ boxShadow: "0 0 12px rgba(180,83,9,0.15)" }}>
                      {getInitials(third.name)}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 border border-amber-950 flex items-center justify-center text-white font-black text-[10px]">3</div>
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-t from-amber-950/40 to-amber-900/10 border-t border-x border-amber-700/20 rounded-t-xl h-[80px] flex flex-col items-center justify-center relative shimmer-e overflow-hidden">
                    <span className="text-white font-bold text-xs truncate w-11/12 text-center">{third.name}</span>
                    <span className="text-lg font-black text-white font-mono mt-1">{Math.floor(multiplier * third.points)}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-600 bg-amber-600/10 border border-amber-600/20 px-2 py-0.5 rounded-full mt-1.5">
                      {third.gamesPlayed} games
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Full rankings list */}
            <section className="flex flex-col gap-2.5">
              <div className="grid grid-cols-12 px-4 py-2 text-white/30 text-[10px] uppercase tracking-wider font-bold border-b border-white/5">
                <div className="col-span-2">Pos</div>
                <div className="col-span-6">Player</div>
                <div className="col-span-4 text-right">Points</div>
              </div>

              {rankings.map((player, idx) => {
                const isMe = currentUser?.id === player.id;
                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all stagger-row ${
                      isMe
                        ? "bg-violet-400/8 border-violet-400/30 shadow-[0_0_20px_rgba(167,139,250,0.12)]"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    }`}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div className="col-span-2 flex items-center">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        player.rank === 1 ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                        player.rank === 2 ? "bg-slate-400/10 text-slate-400 border border-slate-400/20" :
                        player.rank === 3 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" :
                        "text-white/30 text-xs font-mono"
                      }`}>
                        {player.rank === 1 ? <Trophy className="w-3.5 h-3.5" /> :
                         player.rank === 2 ? <Star className="w-3.5 h-3.5 fill-slate-400" /> :
                         player.rank === 3 ? <Award className="w-3.5 h-3.5" /> :
                         player.rank}
                      </div>
                    </div>

                    <div className="col-span-6 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        isMe ? "bg-violet-400/20 text-violet-300 border border-violet-400/30" : "bg-white/5 text-white/50 border border-white/5"
                      }`}>
                        {getInitials(player.name)}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isMe ? "text-violet-300" : "text-white"}`}>
                          {player.name} {isMe && <span className="text-white/30 font-normal text-[10px]">(You)</span>}
                        </div>
                        <div className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-0.5">
                          {player.gamesPlayed} game{player.gamesPlayed !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-4 text-right flex items-center justify-end gap-1">
                      <span className="font-mono font-black text-sm text-white">
                        {Math.floor(multiplier * player.points)}
                      </span>
                      <span className="text-[10px] text-white/20">pts</span>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
        style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/" className="flex flex-col items-center justify-center text-white/40 hover:text-primary gap-0.5 transition-colors">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-semibold">My Contests</span>
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
