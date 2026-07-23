"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Calendar, Gamepad2, ArrowRight, Activity, Flame, Shield, HelpCircle, Flag, Globe, Sparkles, Zap
} from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import AppInstallBanner from "@/components/AppInstallBanner";

interface Match {
  id: string | number;
  status: string;
  statusDetail?: string;
  matchTime: string;
  teamHome: string;
  teamHomeLogo?: string;
  scoreHome?: number;
  teamAway: string;
  teamAwayLogo?: string;
  scoreAway?: number;
  league?: string;
  round?: string;
}

export default function LiveScoresHome() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"live" | "upcoming" | "finished">("live");
  const [currentUser, setCurrentUser] = useState<{ id?: number; name: string; role?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [userRes, matchesRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/matches")
      ]);

      if (userRes.ok) {
        const ud = await userRes.json();
        if (ud.user) setCurrentUser(ud.user);
      }

      if (matchesRes.ok) {
        const md = await matchesRes.json();
        if (md.matches) setMatches(md.matches);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const [selectedLeague, setSelectedLeague] = useState<string>("all");

  const availableLeagues = useMemo(() => {
    return Array.from(new Set(matches.map((m) => m.league).filter((l): l is string => Boolean(l))));
  }, [matches]);

  const filteredMatches = matches.filter((m) => {
    const st = (m.status || "").toLowerCase();
    const matchesStatus =
      filter === "live"
        ? st === "live"
        : filter === "upcoming"
        ? st === "upcoming" || st === "open"
        : st === "finished" || st === "resulted" || st === "completed";

    const matchesLeague =
      selectedLeague === "all" || (m.league && m.league.toLowerCase() === selectedLeague.toLowerCase());

    return matchesStatus && matchesLeague;
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      <TopBar userName={currentUser?.name} activeTab="contests" />
      <AppInstallBanner />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-22 pb-28 flex flex-col gap-10">
        {/* Next-Gen Hero Arena Banner */}
        <section
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border border-indigo-500/30 shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(9, 12, 33, 0.95) 0%, rgba(30, 27, 75, 0.9) 50%, rgba(9, 12, 33, 0.95) 100%)",
          }}
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/40 mb-4 text-indigo-300 backdrop-blur-xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Match Arena
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Real-Time Football Scores & <span className="glow-title-indigo">Live Match Center</span>
            </h1>
            <p className="text-sm text-slate-300 mt-3 font-medium leading-relaxed max-w-xl">
              Track live match updates, schedules, league statistics, lineups, commentary, and test your football knowledge with interactive games.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => router.push("/matches")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/30"
            >
              <Calendar className="w-4 h-4 text-white" /> View Match Arena
            </button>
            <button
              onClick={() => router.push("/games")}
              className="px-6 py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <Gamepad2 className="w-4 h-4 text-amber-400" /> Play Mini-Games
            </button>
          </div>
        </section>

        {/* Match Dashboard Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 text-white">
                <Trophy className="w-6 h-6 text-amber-400" /> Live Match Dashboard
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-1">
                Real-time scoreboards, match timeline, lineups, and live statistics
              </p>
            </div>

            {/* Status Segment Chips */}
            <div className="flex bg-[#090c21]/90 p-1.5 rounded-2xl border border-white/15 shrink-0 shadow-2xl backdrop-blur-2xl">
              {(["live", "upcoming", "finished"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                    filter === tab
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/40 scale-[1.02]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "live" ? "🔴 Live" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* League Filter Chips Bar */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider pr-1 shrink-0">
              <Globe className="w-4 h-4 text-indigo-400" /> League:
            </div>

            <button
              onClick={() => setSelectedLeague("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                selectedLeague === "all"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.25)] scale-[1.02]"
                  : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              🏆 All Leagues ({matches.length})
            </button>

            {availableLeagues.map((lg) => {
              const count = matches.filter((m) => m.league?.toLowerCase() === lg.toLowerCase()).length;
              const isActive = selectedLeague.toLowerCase() === lg.toLowerCase();

              return (
                <button
                  key={lg}
                  onClick={() => setSelectedLeague(lg)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] scale-[1.02]"
                      : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {lg} ({count})
                </button>
              );
            })}
          </div>

          {/* Match Grid */}
          {loading && matches.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-40 rounded-3xl bg-slate-900/50 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="py-16 rounded-3xl bg-[#090c21]/60 border border-white/10 text-center p-8 flex flex-col items-center my-4 backdrop-blur-2xl">
              <Shield className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-black text-slate-300">No matches found in this filter</h3>
              <p className="text-xs text-slate-400 mt-1">Try selecting a different status tab or league filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMatches.map((m) => {
                const isLive = m.status === "live";
                const isFinished = m.status === "finished";

                return (
                  <div
                    key={m.id}
                    onClick={() => router.push(`/matches/${m.id}`)}
                    className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-5 group overflow-hidden ${
                      isLive ? "nextgen-card-live" : "nextgen-card"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 gap-2 relative z-10">
                      <span className="truncate max-w-[200px] sm:max-w-[240px] text-indigo-300 font-extrabold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {m.league || m.round || "Football"}
                      </span>

                      {isLive ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-black bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> {m.statusDetail || "LIVE"}
                        </span>
                      ) : isFinished ? (
                        <span className="text-emerald-400 font-black bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          {m.statusDetail || "FT"}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold shrink-0">{new Date(m.matchTime).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>

                    {/* Team vs Team Scoreboard Arena */}
                    <div className="flex justify-between items-center gap-3 py-1 relative z-10">
                      {/* Home */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0 shadow-md">
                          {m.teamHomeLogo ? (
                            <img src={m.teamHomeLogo} alt={m.teamHome} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs">
                              {m.teamHome.slice(0, 3).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-black text-xs sm:text-sm text-white truncate">{m.teamHome}</span>
                      </div>

                      {/* Score Capsule */}
                      <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#03050e]/90 border border-amber-500/40 font-mono text-amber-300 font-black text-xs sm:text-base shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)] tracking-wider">
                        {isFinished || isLive ? `${m.scoreHome} - ${m.scoreAway}` : "VS"}
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-end gap-3 flex-1 text-right min-w-0">
                        <span className="font-black text-xs sm:text-sm text-white truncate">{m.teamAway}</span>
                        <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0 shadow-md">
                          {m.teamAwayLogo ? (
                            <img src={m.teamAwayLogo} alt={m.teamAway} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs">
                              {m.teamAway.slice(0, 3).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-indigo-400 font-black group-hover:translate-x-1 transition-transform border-t border-white/5 pt-3 relative z-10">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> View Match Arena & Lineups
                      </span>
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Mini-Games Showcase Banner */}
        <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-emerald-500/15 border border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Interactive Football Mini-Games</h3>
              <p className="text-xs text-slate-300 font-bold mt-1">
                Play Penalty Shootout, Football Trivia, Flag Quiz, and Who Am I? to test your skills!
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/games")}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-amber-300/40"
          >
            Explore Mini-Games <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}

      <Footer />
      <BottomNav activeTab="matches" />
    </div>
  );
}
