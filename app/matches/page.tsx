"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Activity, ArrowRight, RefreshCw, Trophy, Globe, Flame, Sparkles, ChevronRight, Zap } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";

interface Match {
  id: string | number;
  status: string;
  statusDetail?: string;
  matchTime: string;
  teamHome: string;
  teamHomeLogo?: string;
  teamHomeCode?: string;
  scoreHome?: number;
  teamAway: string;
  teamAwayLogo?: string;
  teamAwayCode?: string;
  scoreAway?: number;
  league?: string;
  round?: string;
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"live" | "upcoming" | "finished">("live");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        if (data.matches) setMatches(data.matches);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 10000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const availableLeagues = useMemo(() => {
    return Array.from(new Set(matches.map((m) => m.league).filter((l): l is string => Boolean(l))));
  }, [matches]);

  const filteredMatches = matches.filter((m) => {
    const matchesStatus = m.status === filterStatus;
    const matchesLeague =
      selectedLeague === "all" || (m.league && m.league.toLowerCase() === selectedLeague.toLowerCase());
    return matchesStatus && matchesLeague;
  });

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      <TopBar />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 pt-22 pb-28 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-black uppercase tracking-widest mb-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Match Arena
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Football <span className="glow-title-indigo">Live Arena & Fixtures</span>
            </h1>
          </div>

          {/* Status Segment Chips */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#090c21]/90 border border-white/15 w-full md:w-auto overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-2xl">
            {(["live", "upcoming", "finished"] as const).map((st) => {
              const isActive = filterStatus === st;
              const count = matches.filter((m) => m.status === st).length;

              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/50 scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {st === "live" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Live ({count})
                    </>
                  ) : st === "upcoming" ? (
                    <>Upcoming ({count})</>
                  ) : (
                    <>Finished ({count})</>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => { setLoading(true); fetchMatches(); }}
              className="p-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 rounded-xl hover:bg-white/5"
              title="Refresh Feed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* League Filter Chips Bar */}
        <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar border-b border-white/10">
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

        {/* Next-Gen Match Cards Grid */}
        {loading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-slate-900/50 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-16 bg-[#090c21]/60 rounded-3xl border border-white/10 my-8 p-8 backdrop-blur-2xl">
            <Trophy className="w-14 h-14 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-200">No Matches Available</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no matches matching filters ({filterStatus} • {selectedLeague === "all" ? "All Leagues" : selectedLeague}).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">
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
                  {/* Top Header Row */}
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
                      <span className="flex items-center gap-1 text-slate-400 font-bold shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(m.matchTime).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  {/* Team vs Team Scoreboard Arena */}
                  <div className="flex justify-between items-center gap-3 py-1 relative z-10">
                    {/* Home Team */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0 shadow-md">
                        {m.teamHomeLogo ? (
                          <img src={m.teamHomeLogo} alt={m.teamHome} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs">
                            {m.teamHomeCode}
                          </div>
                        )}
                      </div>
                      <span className="font-black text-xs sm:text-sm text-white truncate">{m.teamHome}</span>
                    </div>

                    {/* Score Capsule */}
                    <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#03050e]/90 border border-amber-500/40 font-mono text-amber-300 font-black text-xs sm:text-base shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)] tracking-wider">
                      {isFinished || isLive ? `${m.scoreHome} - ${m.scoreAway}` : "VS"}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                      <span className="font-black text-xs sm:text-sm text-white truncate">{m.teamAway}</span>
                      <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0 shadow-md">
                        {m.teamAwayLogo ? (
                          <img src={m.teamAwayLogo} alt={m.teamAway} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs">
                            {m.teamAwayCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Navigation Footer */}
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
      </main>
      <Footer />
      <BottomNav activeTab="matches" />
    </div>
  );
}
