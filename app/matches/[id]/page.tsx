"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Trophy, Activity, Shield, Users, Clock, Flame, Newspaper, BarChart2, ExternalLink, Sparkles, MapPin } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";

interface MatchDetailsProps {
  params: Promise<{ id: string }>;
}

interface MatchData {
  id: string | number;
  teamHome: string;
  teamHomeLogo?: string;
  teamAway: string;
  teamAwayLogo?: string;
  matchTime: string;
  status: string;
  statusDetail?: string;
  league?: string;
  scoreHome?: number;
  scoreAway?: number;
}

interface MatchStat {
  label: string;
  homeValue: string;
  awayValue: string;
}

interface KeyEvent {
  id: string;
  text: string;
  type: string;
  clock: string;
  period: number;
}

interface RosterTeam {
  teamName: string;
  teamLogo: string;
  players: Array<{
    id: string;
    name: string;
    jersey?: string;
    position?: string;
    starter?: boolean;
  }>;
}

interface NewsArticle {
  headline: string;
  description: string;
  link?: string;
  image?: string;
}

interface H2hMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
}

export default function MatchDetailPage({ params }: MatchDetailsProps) {
  const { id } = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [venue, setVenue] = useState<string | null>(null);
  const [stats, setStats] = useState<MatchStat[]>([]);
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [commentary, setCommentary] = useState<Array<{ text: string; clock: string }>>([]);
  const [rosters, setRosters] = useState<RosterTeam[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [h2h, setH2h] = useState<H2hMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "lineups" | "stats" | "news">("overview");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.match) {
          setMatch(data.match);
          setVenue(data.venue || null);
          setStats(data.stats || []);
          setKeyEvents(data.keyEvents || []);
          setCommentary(data.commentary || []);
          setRosters(data.rosters || []);
          setNews(data.news || []);
          setH2h(data.h2h || []);
        }
      }
    } catch (err) {
      console.error("Failed to load match detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050714] text-slate-100 flex flex-col justify-center items-center">
        <TopBar />
        <div className="text-sm font-black text-indigo-400 animate-pulse flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin" /> Loading Stadium Match Center...
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#050714] text-slate-100 flex flex-col font-sans">
        <TopBar />
        <main className="flex-1 max-w-xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center text-center">
          <Shield className="w-14 h-14 text-slate-700 mb-3" />
          <h2 className="text-2xl font-black text-white">Match Not Found</h2>
          <button
            onClick={() => router.push("/matches")}
            className="mt-5 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            Back to Match Arena
          </button>
        </main>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div className="min-h-screen bg-[#050714] text-slate-100 flex flex-col font-sans">
      <TopBar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 pt-20 pb-28 flex flex-col gap-6">
        <button
          onClick={() => router.push("/matches")}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </button>

        {/* Stadium Hero Arena */}
        <section
          className={`relative rounded-3xl p-5 sm:p-8 border flex flex-col gap-6 shadow-2xl overflow-hidden ${
            isLive
              ? "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
              : "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-white/15"
          }`}
        >
          {/* Tactical Pitch Lines Graphic Accent */}
          <div className="absolute inset-0 bg-pitch opacity-30 pointer-events-none" />

          {/* League & Status Bar */}
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-300 relative z-10">
            <span className="flex items-center gap-1.5 text-indigo-300 truncate max-w-[200px] sm:max-w-[320px]">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" /> {match.league || "Live Football Match"}
            </span>

            {isLive ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-black bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/40 shadow-md shadow-emerald-500/20 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> {match.statusDetail || "LIVE"}
              </span>
            ) : isFinished ? (
              <span className="text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0">
                {match.statusDetail || "FULL TIME"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-black shrink-0">
                <Calendar className="w-4 h-4 text-amber-400" />
                UPCOMING
              </span>
            )}
          </div>

          {/* Center Stadium Score Capsule Grid */}
          <div className="grid grid-cols-3 items-center py-2 sm:py-6 text-center gap-2 relative z-10">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-2.5 min-w-0">
              {match.teamHomeLogo ? (
                <img src={match.teamHomeLogo} alt={match.teamHome} className="w-14 h-14 sm:w-24 sm:h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] shrink-0" />
              ) : (
                <div className="w-14 h-14 sm:w-24 sm:h-24 bg-slate-800 rounded-full flex items-center justify-center font-black text-sm border border-white/10 shrink-0" />
              )}
              <h2 className="font-black text-xs sm:text-xl text-white truncate max-w-full leading-tight">{match.teamHome}</h2>
            </div>

            {/* Glowing Score Digits */}
            <div className="flex flex-col items-center justify-center gap-1 shrink-0">
              <div className="text-3xl sm:text-6xl font-black font-mono tracking-widest text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                {isFinished || isLive ? `${match.scoreHome} - ${match.scoreAway}` : "VS"}
              </div>
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">
                {isLive ? match.statusDetail || "In Progress" : isFinished ? "Final Result" : new Date(match.matchTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-2.5 min-w-0">
              {match.teamAwayLogo ? (
                <img src={match.teamAwayLogo} alt={match.teamAway} className="w-14 h-14 sm:w-24 sm:h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] shrink-0" />
              ) : (
                <div className="w-14 h-14 sm:w-24 sm:h-24 bg-slate-800 rounded-full flex items-center justify-center font-black text-sm border border-white/10 shrink-0" />
              )}
              <h2 className="font-black text-xs sm:text-xl text-white truncate max-w-full leading-tight">{match.teamAway}</h2>
            </div>
          </div>

          {venue && (
            <div className="text-center text-[11px] sm:text-xs text-slate-400 font-bold border-t border-white/10 pt-3 flex items-center justify-center gap-1.5 relative z-10">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {venue}
            </div>
          )}
        </section>

        {/* Futuristic Glass Segment Tab Bar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 overflow-x-auto no-scrollbar select-none shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40" : "text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>

          {(isLive || isFinished || keyEvents.length > 0) && (
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "timeline" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Timeline ({keyEvents.length})
            </button>
          )}

          {stats.length > 0 && (
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "stats" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Statistics
            </button>
          )}

          {rosters.length > 0 && (
            <button
              onClick={() => setActiveTab("lineups")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "lineups" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Squad Lineups ({rosters.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("news")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "news" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40" : "text-slate-400 hover:text-white"
            }`}
          >
            News ({news.length})
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Match Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">League Competition</span>
                  <span className="text-white font-black text-sm">{match.league || "Live Football"}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-1">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Scheduled Kickoff</span>
                  <span className="text-white font-black text-sm">{new Date(match.matchTime).toLocaleString()}</span>
                </div>
              </div>
            </section>

            {h2h.length > 0 && (
              <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Head-to-Head (H2H) History
                </h3>
                <div className="flex flex-col gap-2.5">
                  {h2h.map((h, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs gap-3">
                      <span className="text-slate-400 font-mono text-[10px] shrink-0 font-bold">{h.date}</span>
                      <div className="flex items-center gap-2 font-black truncate">
                        <span className="truncate">{h.homeTeam}</span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40 shrink-0">{h.score}</span>
                        <span className="truncate">{h.awayTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {news.length > 0 && (
              <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-400 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-teal-400" /> Football News & Previews
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.slice(0, 4).map((n, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-3 justify-between">
                      {n.image && (
                        <img src={n.image} alt={n.headline} className="w-full h-40 object-cover rounded-xl border border-white/10" />
                      )}
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-white line-clamp-2">{n.headline}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-3 font-medium">{n.description}</p>
                      </div>
                      {n.link && (
                        <a
                          href={n.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                        >
                          Read Article <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="flex flex-col gap-6">
            {keyEvents.length > 0 ? (
              <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" /> Key Match Events Timeline
                </h3>
                <div className="flex flex-col gap-2.5">
                  {keyEvents.map((ev) => (
                    <div key={ev.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono text-[11px] font-black shrink-0">
                        {ev.clock || "Event"}
                      </span>
                      <span className="text-slate-100">{ev.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-bold">
                No key events recorded yet for this match.
              </div>
            )}

            {commentary.length > 0 && (
              <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" /> Live Commentary Feed
                </h3>
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                  {commentary.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950/60 text-xs text-slate-300 flex gap-3 font-medium">
                      {c.clock && <span className="font-mono font-black text-amber-400 shrink-0">{c.clock}</span>}
                      <span>{c.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === "stats" && (
          <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-6 backdrop-blur-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" /> Visual Match Statistics
            </h3>
            {stats.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-bold">
                Statistics will update once the match starts.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.map((st, i) => {
                  const hNum = parseFloat(st.homeValue) || 0;
                  const aNum = parseFloat(st.awayValue) || 0;
                  const total = hNum + aNum || 1;
                  const hPct = Math.round((hNum / total) * 100);

                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-amber-400 font-mono text-sm">{st.homeValue}</span>
                        <span className="text-slate-400 uppercase text-[10px] tracking-widest font-black">{st.label}</span>
                        <span className="text-indigo-400 font-mono text-sm">{st.awayValue}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" style={{ width: `${hPct}%` }} />
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500" style={{ width: `${100 - hPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* LINEUPS TAB */}
        {activeTab === "lineups" && (
          <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-6 backdrop-blur-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-teal-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" /> Team Squad Lineups
            </h3>
            {rosters.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-bold">
                Official lineups will be confirmed closer to kickoff.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rosters.map((r, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                      {r.teamLogo && <img src={r.teamLogo} alt={r.teamName} className="w-7 h-7 object-contain drop-shadow" />}
                      <h4 className="font-black text-sm text-white">{r.teamName}</h4>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                      {r.players.map((p) => (
                        <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 text-xs font-bold">
                          <div className="flex items-center gap-2.5">
                            {p.jersey && <span className="font-mono font-black text-amber-400 w-5 text-center">{p.jersey}</span>}
                            <span className="text-white">{p.name}</span>
                          </div>
                          {p.position && <span className="text-[9px] text-slate-400 uppercase font-black shrink-0">{p.position}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* NEWS TAB */}
        {activeTab === "news" && (
          <section className="rounded-3xl p-6 bg-slate-900/60 border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-teal-400 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-teal-400" /> Latest Football News
            </h3>
            {news.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-bold">
                No news articles available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.map((n, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-3 justify-between">
                    {n.image && (
                      <img src={n.image} alt={n.headline} className="w-full h-40 object-cover rounded-xl border border-white/10" />
                    )}
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-white line-clamp-2">{n.headline}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3 font-medium">{n.description}</p>
                    </div>
                    {n.link && (
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                      >
                        Read Article <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
      <BottomNav activeTab="matches" />
    </div>
  );
}
