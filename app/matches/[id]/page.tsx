"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Trophy,
  Activity,
  Shield,
  Users,
  Clock,
  Flame,
  Newspaper,
  BarChart2,
  ExternalLink,
  Sparkles,
  MapPin,
  TrendingUp,
  Zap,
  Gift
} from "lucide-react";
import Footer from "@/components/Footer";
import { MatchDetailSkeleton } from "@/components/Skeletons";

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
  period?: number;
  player?: string;
}

interface RosterPlayer {
  id: string;
  name: string;
  jersey?: string;
  position?: string;
  starter?: boolean;
}

interface RosterTeam {
  teamName: string;
  teamLogo?: string;
  players: RosterPlayer[];
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

function getLeagueFlag(leagueName?: string) {
  const lg = (leagueName || "").toLowerCase();
  if (lg.includes("premier") || lg.includes("eng")) return "🇬🇧";
  if (lg.includes("liga") || lg.includes("esp") || lg.includes("spanish")) return "🇪🇸";
  if (lg.includes("champions") || lg.includes("uefa") || lg.includes("ucl")) return "🇪🇺";
  if (lg.includes("bundesliga") || lg.includes("ger")) return "🇩🇪";
  if (lg.includes("serie") || lg.includes("ita")) return "🇮🇹";
  if (lg.includes("ligue") || lg.includes("fra")) return "🇫🇷";
  if (lg.includes("mls") || lg.includes("usa") || lg.includes("major")) return "🇺🇸";
  return "⚽";
}

function TacticalStadiumPitch({ roster }: { roster: RosterTeam }) {
  const players = roster?.players || [];
  const starters = players.filter((p) => p.starter !== false);
  const bench = players.filter((p) => p.starter === false);

  const gks = starters.filter((p) => (p.position || "").toUpperCase().includes("GK"));
  const dfs = starters.filter((p) => (p.position || "").toUpperCase().includes("DF"));
  const mfs = starters.filter((p) => (p.position || "").toUpperCase().includes("MF"));
  const fws = starters.filter((p) => (p.position || "").toUpperCase().includes("FW") || (p.position || "").toUpperCase().includes("ST") || (p.position || "").toUpperCase().includes("ATT"));

  const finalGks = gks.length > 0 ? gks : starters.slice(0, 1);
  const remaining = starters.filter((p) => !finalGks.includes(p));
  const finalDfs = dfs.length > 0 ? dfs : remaining.slice(0, 4);
  const remaining2 = remaining.filter((p) => !finalDfs.includes(p));
  const finalMfs = mfs.length > 0 ? mfs : remaining2.slice(0, 3);
  const finalFws = fws.length > 0 ? fws : remaining2.slice(3);

  return (
    <div className="space-y-6">
      {/* 3D Pitch Arena */}
      <div className="relative bg-gradient-to-b from-[#1c4d20] via-[#153e18] to-[#123315] rounded-3xl p-6 border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(20,80,30,0.4)] overflow-hidden min-h-[460px] flex flex-col justify-between select-none">
        {/* Pitch Overlay Texture */}
        <div className="absolute inset-0 border-4 border-white/20 rounded-2xl m-3 pointer-events-none" />
        <div className="absolute top-1/2 left-3 right-3 h-[2px] bg-white/20 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/20 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/30 rounded-full pointer-events-none" />

        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-t-0 border-white/20 pointer-events-none" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-b-0 border-white/20 pointer-events-none" />

        {/* Forwards Row */}
        <div className="relative z-10 flex justify-around items-center pt-2">
          {finalFws.map((p, i) => (
            <div key={p.id || i} className="flex flex-col items-center group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#c3f400] text-[#131313] font-bold font-display-score text-[15px] flex items-center justify-center border-2 border-[#131313] shadow-[0_0_15px_rgba(195,244,0,0.6)] group-hover:scale-110 transition-transform">
                {p.jersey || "9"}
              </div>
              <div className="bg-[#131313]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[11px] font-bold text-white uppercase truncate max-w-[95px] text-center mt-1 shadow-md">
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {/* Midfielders Row */}
        <div className="relative z-10 flex justify-around items-center my-auto py-4">
          {finalMfs.map((p, i) => (
            <div key={p.id || i} className="flex flex-col items-center group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#00e3fd] text-[#131313] font-bold font-display-score text-[15px] flex items-center justify-center border-2 border-[#131313] shadow-[0_0_15px_rgba(0,227,253,0.6)] group-hover:scale-110 transition-transform">
                {p.jersey || "8"}
              </div>
              <div className="bg-[#131313]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[11px] font-bold text-white uppercase truncate max-w-[95px] text-center mt-1 shadow-md">
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {/* Defenders Row */}
        <div className="relative z-10 flex justify-around items-center my-auto py-4">
          {finalDfs.map((p, i) => (
            <div key={p.id || i} className="flex flex-col items-center group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white text-[#131313] font-bold font-display-score text-[15px] flex items-center justify-center border-2 border-[#131313] shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform">
                {p.jersey || "4"}
              </div>
              <div className="bg-[#131313]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[11px] font-bold text-white uppercase truncate max-w-[95px] text-center mt-1 shadow-md">
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {/* Goalkeeper Row */}
        <div className="relative z-10 flex justify-center items-center pb-2">
          {finalGks.map((p, i) => (
            <div key={p.id || i} className="flex flex-col items-center group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-[#131313] font-bold font-display-score text-[15px] flex items-center justify-center border-2 border-[#131313] shadow-[0_0_15px_rgba(251,191,36,0.6)] group-hover:scale-110 transition-transform">
                {p.jersey || "1"}
              </div>
              <div className="bg-[#131313]/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[11px] font-bold text-white uppercase truncate max-w-[95px] text-center mt-1 shadow-md">
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Substitutes Section */}
      {bench.length > 0 && (
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
          <h4 className="font-label-caps text-[12px] text-[#c3f400] uppercase tracking-wider font-bold">
            BENCH & SUBSTITUTES ({bench.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {bench.map((p, i) => (
              <div key={p.id || i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="font-label-mono font-bold text-[#c3f400] w-5 text-center">
                  {p.jersey || "-"}
                </span>
                <span className="font-body-md text-white font-medium truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<"summary" | "stats" | "lineups" | "h2h">("summary");
  const [activeTeamRosterIndex, setActiveTeamRosterIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Fallback data generators
  function getFallbackStats(): MatchStat[] {
    return [
      { label: "POSSESSION", homeValue: "45%", awayValue: "55%" },
      { label: "SHOTS ON TARGET", homeValue: "6", awayValue: "4" },
      { label: "PASS ACCURACY", homeValue: "82%", awayValue: "91%" },
      { label: "CORNERS", homeValue: "4", awayValue: "8" },
      { label: "TOTAL SHOTS", homeValue: "14", awayValue: "9" },
      { label: "FOULS", homeValue: "9", awayValue: "12" },
    ];
  }

  function getFallbackEvents(): KeyEvent[] {
    return [
      {
        id: "ev-1",
        clock: "72'",
        text: "Goal! Clinical finish into the top right corner.",
        type: "goal",
        player: "Striker",
      },
      {
        id: "ev-2",
        clock: "54'",
        text: "Yellow Card. Booking for tactical foul.",
        type: "yellow-card",
        player: "Midfielder",
      },
      {
        id: "ev-3",
        clock: "45'",
        text: "Goal! Superb header off a precision corner kick.",
        type: "goal",
        player: "Forward",
      },
    ];
  }

  function getFallbackH2h(homeName: string, awayName: string): H2hMatch[] {
    return [
      { date: "RECENT MEETING", homeTeam: homeName, awayTeam: awayName, score: "2 - 1" },
      { date: "PREVIOUS MATCH", homeTeam: awayName, awayTeam: homeName, score: "1 - 1" },
      { date: "PAST MATCH", homeTeam: homeName, awayTeam: awayName, score: "3 - 0" },
      { date: "PAST MATCH", homeTeam: awayName, awayTeam: homeName, score: "0 - 2" },
    ];
  }

  function getFallbackRosters(homeName: string, awayName: string, homeLogo?: string, awayLogo?: string): RosterTeam[] {
    return [
      {
        teamName: homeName,
        teamLogo: homeLogo,
        players: [
          { id: "h1", name: "Keeper One", jersey: "1", position: "GK", starter: true },
          { id: "h2", name: "Left Back", jersey: "3", position: "DF", starter: true },
          { id: "h3", name: "Center Back A", jersey: "4", position: "DF", starter: true },
          { id: "h4", name: "Center Back B", jersey: "5", position: "DF", starter: true },
          { id: "h5", name: "Right Back", jersey: "2", position: "DF", starter: true },
          { id: "h6", name: "Def Midfielder", jersey: "6", position: "MF", starter: true },
          { id: "h7", name: "Playmaker", jersey: "8", position: "MF", starter: true },
          { id: "h8", name: "Att Midfielder", jersey: "10", position: "MF", starter: true },
          { id: "h9", name: "Left Winger", jersey: "7", position: "FW", starter: true },
          { id: "h10", name: "Center Forward", jersey: "9", position: "FW", starter: true },
          { id: "h11", name: "Right Winger", jersey: "11", position: "FW", starter: true },
        ],
      },
      {
        teamName: awayName,
        teamLogo: awayLogo,
        players: [
          { id: "a1", name: "Keeper Two", jersey: "1", position: "GK", starter: true },
          { id: "a2", name: "Left Back", jersey: "3", position: "DF", starter: true },
          { id: "a3", name: "Center Back A", jersey: "4", position: "DF", starter: true },
          { id: "a4", name: "Center Back B", jersey: "5", position: "DF", starter: true },
          { id: "a5", name: "Right Back", jersey: "2", position: "DF", starter: true },
          { id: "a6", name: "Def Midfielder", jersey: "6", position: "MF", starter: true },
          { id: "a7", name: "Playmaker", jersey: "8", position: "MF", starter: true },
          { id: "a8", name: "Att Midfielder", jersey: "10", position: "MF", starter: true },
          { id: "a9", name: "Left Winger", jersey: "7", position: "FW", starter: true },
          { id: "a10", name: "Center Forward", jersey: "9", position: "FW", starter: true },
          { id: "a11", name: "Right Winger", jersey: "11", position: "FW", starter: true },
        ],
      },
    ];
  }

  // Load match details from API
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.match) {
          const isMock = String(id).startsWith("v-") || String(id).startsWith("m-");
          setMatch(data.match);
          setVenue(data.venue || (isMock ? "STADIUM ARENA" : null));
          setStats(data.stats && data.stats.length > 0 ? data.stats : (isMock ? getFallbackStats() : []));
          setKeyEvents(data.keyEvents && data.keyEvents.length > 0 ? data.keyEvents : (isMock ? getFallbackEvents() : []));
          setCommentary(data.commentary || []);
          setRosters(
            data.rosters && data.rosters.length > 0
              ? data.rosters
              : getFallbackRosters(data.match.teamHome, data.match.teamAway, data.match.teamHomeLogo, data.match.teamAwayLogo)
          );
          setNews(data.news || []);
          setH2h(
            data.h2h && data.h2h.length > 0
              ? data.h2h
              : getFallbackH2h(data.match.teamHome, data.match.teamAway)
          );
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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Default display match
  const displayMatch: MatchData = match || {
    id: id || "m-default",
    teamHome: "HOME TEAM",
    teamAway: "AWAY TEAM",
    matchTime: new Date().toISOString(),
    status: "live",
    statusDetail: "LIVE 75'",
    league: "SOCCER LEAGUE",
    scoreHome: 2,
    scoreAway: 1,
  };

  const isLive = displayMatch.status === "live";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-body-md selection:bg-[#c3f400] selection:text-[#161e00]">
      {/* Top App Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
        <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
          <button
            onClick={() => router.push("/")}
            className="active:scale-95 transition-transform flex items-center gap-2 cursor-pointer text-[#c4c9ac] hover:text-[#c3f400]"
          >
            <ArrowLeft className="w-5 h-5 text-[#c3f400]" />
            <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold">
              BACK
            </span>
          </button>

          <div className="font-label-caps text-[14px] text-white tracking-widest font-bold uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c3f400] animate-pulse" /> MATCH CENTER
          </div>

          <button
            onClick={handleShare}
            className="active:scale-95 transition-transform p-2 rounded-full glass-card hover:border-[#c3f400]/40 text-[#c3f400] cursor-pointer"
            title="Share Match"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Share Toast */}
      {copied && (
        <div className="fixed top-20 right-4 z-50 bg-[#c3f400] text-[#161e00] px-4 py-2 rounded-xl font-label-caps text-xs font-bold shadow-lg animate-bounce">
          Link copied to clipboard!
        </div>
      )}

      <main className="pt-20 pb-24 overflow-x-hidden">
        {loading ? (
          <div className="px-4 sm:px-6 max-w-[1200px] mx-auto">
            <MatchDetailSkeleton />
          </div>
        ) : (
          <>
            {/* Hero Header Score Board */}
            <section className="relative w-full py-10 min-h-[320px] flex flex-col items-center justify-center overflow-hidden px-4 border-b border-white/10 bg-gradient-to-b from-[#131313] via-[#0A0A0A] to-[#0e0e0e]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c3f400]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 w-full max-w-[1200px] flex items-center justify-between gap-4">
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-20 h-20 md:w-32 md:h-32 mb-4 glass-card rounded-full flex items-center justify-center p-4 shadow-[0_0_25px_rgba(255,255,255,0.05)] border border-white/15">
                    {displayMatch.teamHomeLogo ? (
                      <img
                        className="w-full h-full object-contain drop-shadow-lg"
                        src={displayMatch.teamHomeLogo}
                        alt={displayMatch.teamHome}
                      />
                    ) : (
                      <div className="font-headline-md text-2xl text-white">{displayMatch.teamHome.slice(0, 2)}</div>
                    )}
                  </div>
                  <h2 className="font-headline-md text-[18px] md:text-[24px] text-white tracking-wider uppercase leading-tight">
                    {displayMatch.teamHome}
                  </h2>
                </div>

                {/* Score Center */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="bg-[#c3f400]/10 px-3.5 py-1 rounded-full mb-3 flex items-center gap-2 border border-[#c3f400]/30 shadow-[0_0_15px_rgba(195,244,0,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-[#c3f400] live-pulse" />
                    <span className="text-[#c3f400] font-label-caps text-[11px] font-bold tracking-wider">
                      {displayMatch.statusDetail || (isLive ? "LIVE" : "FT")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-display-score text-[64px] md:text-[76px] text-white leading-none tracking-tight">
                    <span>{displayMatch.scoreHome ?? 0}</span>
                    <span className="text-[#c3f400]/30 font-normal">:</span>
                    <span>{displayMatch.scoreAway ?? 0}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[#c4c9ac] font-label-caps text-[11px]">
                    <span>{getLeagueFlag(displayMatch.league)}</span>
                    <span className="truncate max-w-[200px]">{displayMatch.league}</span>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-20 h-20 md:w-32 md:h-32 mb-4 glass-card rounded-full flex items-center justify-center p-4 shadow-[0_0_25px_rgba(255,255,255,0.05)] border border-white/15">
                    {displayMatch.teamAwayLogo ? (
                      <img
                        className="w-full h-full object-contain drop-shadow-lg"
                        src={displayMatch.teamAwayLogo}
                        alt={displayMatch.teamAway}
                      />
                    ) : (
                      <div className="font-headline-md text-2xl text-white">{displayMatch.teamAway.slice(0, 2)}</div>
                    )}
                  </div>
                  <h2 className="font-headline-md text-[18px] md:text-[24px] text-white tracking-wider uppercase leading-tight">
                    {displayMatch.teamAway}
                  </h2>
                </div>
              </div>

              {/* Stadium Venue Footer Pill */}
              {venue && (
                <div className="relative z-10 mt-8 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-label-mono text-[#c4c9ac]">
                  <MapPin className="w-3.5 h-3.5 text-[#c3f400]" />
                  <span>{venue}</span>
                </div>
              )}
            </section>

            {/* Match Detail Tabs */}
            <nav className="border-b border-white/10 sticky top-16 z-40 backdrop-blur-xl bg-[#131313]/90">
              <div className="max-w-[1200px] mx-auto px-4 flex gap-6 overflow-x-auto hide-scrollbar">
                {(["summary", "stats", "lineups", "h2h"] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 font-headline-md text-[16px] tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "text-[#c3f400] border-b-2 border-[#c3f400] font-bold"
                          : "text-[#c4c9ac] hover:text-white"
                      }`}
                    >
                      {tab === "summary" ? "TIMELINE" : tab}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Main Content Grid */}
            <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Primary Tab Content */}
              <div className="md:col-span-7 flex flex-col gap-6">
                {/* SUMMARY / TIMELINE TAB */}
                {activeTab === "summary" && (
                  <div className="space-y-6">
                    <h3 className="font-headline-md text-[20px] text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#c3f400]" /> MATCH TIMELINE
                    </h3>

                    <div className="space-y-4">
                      {keyEvents.length === 0 ? (
                        <div className="glass-card p-8 rounded-2xl text-center text-[#c4c9ac]">
                          <Activity className="w-8 h-8 text-[#c3f400] mx-auto mb-2 opacity-60 animate-pulse" />
                          <p className="font-body-lg text-white">No timeline events recorded yet.</p>
                        </div>
                      ) : (
                        keyEvents.map((ev, idx) => (
                          <div key={ev.id || idx} className="flex gap-4 group">
                            <div className="flex flex-col items-center w-9 shrink-0">
                              <div className="w-9 h-9 rounded-full bg-[#c3f400] text-[#161e00] flex items-center justify-center font-label-mono font-bold text-[12px] shadow-[0_0_12px_rgba(195,244,0,0.3)]">
                                {ev.clock}
                              </div>
                              {idx < keyEvents.length - 1 && (
                                <div className="w-[2px] flex-1 bg-white/10 mt-2 min-h-[30px]" />
                              )}
                            </div>

                            <div className="flex-1 glass-card p-4 rounded-xl active:scale-[0.98] transition-transform border border-white/10 hover:border-[#c3f400]/40">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-body-lg text-[18px] text-white font-medium">
                                  {ev.player || ev.text.split(" ")[1] || "Key Play"}
                                </span>
                                {(() => {
                                  const t = (ev.type || "").toLowerCase();
                                  const txt = (ev.text || "").toLowerCase();
                                  if (t.includes("goal") || txt.includes("goal")) {
                                    return <span className="w-6 h-6 rounded-full bg-[#c3f400]/20 flex items-center justify-center text-[#c3f400] font-bold text-xs">⚽</span>;
                                  }
                                  if (t.includes("red") || txt.includes("red card")) {
                                    return <span className="w-3.5 h-5 bg-rose-500 rounded-sm inline-block shadow-[0_0_8px_rgba(244,63,94,0.4)]" title="Red Card" />;
                                  }
                                  if (t.includes("yellow") || txt.includes("yellow card") || txt.includes("booking") || txt.includes("cautioned")) {
                                    return <span className="w-3.5 h-5 bg-amber-400 rounded-sm inline-block shadow-[0_0_8px_rgba(251,191,36,0.4)]" title="Yellow Card" />;
                                  }
                                  if (t.includes("sub") || txt.includes("substitution") || txt.includes("replaced")) {
                                    return <span className="w-6 h-6 rounded-full bg-[#00e3fd]/20 flex items-center justify-center text-[#00e3fd] text-xs font-bold">🔄</span>;
                                  }
                                  if (t.includes("corner") || txt.includes("corner")) {
                                    return <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">🚩</span>;
                                  }
                                  return <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c3f400] text-xs font-bold">⚡</span>;
                                })()}
                              </div>
                              <p className="text-[#c4c9ac] font-body-md text-[15px]">{ev.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* STATS TAB */}
                {activeTab === "stats" && (
                  <div className="space-y-6">
                    <h3 className="font-headline-md text-[20px] text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-[#c3f400]" /> MATCH STATS
                    </h3>

                    <div className="glass-card p-6 rounded-2xl flex flex-col gap-6 border border-white/10">
                      {stats.map((st, i) => {
                        const hNum = parseFloat(st.homeValue) || 0;
                        const aNum = parseFloat(st.awayValue) || 0;
                        const total = hNum + aNum || 1;
                        const hPct = Math.round((hNum / total) * 100);

                        return (
                          <div key={i} className="flex flex-col gap-2">
                            <div className="flex justify-between font-label-caps text-[12px] tracking-wider text-white">
                              <span>{st.label}</span>
                              <span className="font-bold">
                                {st.homeValue}{" "}
                                <span className="text-[#c3f400]/40 mx-1.5">/</span>{" "}
                                {st.awayValue}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[#201f1f] rounded-full flex overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-[#c3f400] transition-all duration-500 shadow-[0_0_8px_#c3f400]"
                                style={{ width: `${hPct}%` }}
                              />
                              <div
                                className="h-full bg-[#00e3fd] transition-all duration-500 shadow-[0_0_8px_#00e3fd]"
                                style={{ width: `${100 - hPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LINEUPS TAB - STADIUM PITCH BUILDER */}
                {activeTab === "lineups" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-headline-md text-[20px] text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#c3f400]" /> STADIUM PITCH LINEUP BUILDER
                      </h3>
                    </div>

                    {/* Team Roster Switcher Tabs */}
                    <div className="flex gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                      {rosters.map((r, idx) => {
                        const isSelected = activeTeamRosterIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveTeamRosterIndex(idx)}
                            className={`flex-1 py-3 px-4 rounded-xl font-headline-md text-[15px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              isSelected
                                ? "bg-[#c3f400] text-[#161e00] font-bold shadow-[0_0_20px_rgba(195,244,0,0.3)]"
                                : "text-[#c4c9ac] hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {r.teamLogo && (
                              <img src={r.teamLogo} alt={r.teamName} className="w-5 h-5 object-contain" />
                            )}
                            <span className="truncate">{r.teamName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Render Tactical Stadium Pitch Builder */}
                    {rosters[activeTeamRosterIndex] ? (
                      <TacticalStadiumPitch roster={rosters[activeTeamRosterIndex]} />
                    ) : (
                      <div className="glass-card p-8 rounded-2xl text-center text-[#c4c9ac]">
                        No roster squad details available for this match.
                      </div>
                    )}
                  </div>
                )}

                {/* H2H TAB */}
                {activeTab === "h2h" && (
                  <div className="space-y-6">
                    <h3 className="font-headline-md text-[20px] text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-[#c3f400]" /> HEAD TO HEAD HISTORY
                    </h3>

                    <div className="space-y-3">
                      {h2h.map((h, i) => (
                        <div key={i} className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/10">
                          <span className="font-label-mono text-[11px] text-[#c4c9ac]">{h.date}</span>
                          <div className="flex items-center gap-3 font-body-lg text-white text-[16px] font-bold">
                            <span>{h.homeTeam}</span>
                            <span className="bg-[#c3f400]/20 text-[#c3f400] px-3 py-1 rounded-lg border border-[#c3f400]/40 font-display-score text-[18px]">
                              {h.score}
                            </span>
                            <span>{h.awayTeam}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Promotional & Token Challenge Cards */}
              <div className="md:col-span-5 space-y-6">
                {/* Promo Card: Predict Next Goal Scorer */}
                <div
                  onClick={() => router.push("/games/trivia")}
                  className="relative glass-card rounded-2xl overflow-hidden aspect-video group cursor-pointer border border-[#c3f400]/30 shadow-[0_0_30px_rgba(195,244,0,0.15)]"
                >
                  <img
                    className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg2SNB0aiyRAffA-fjLBeW_ME0SB3qTgRf89xuATb6ZPtpkbEas61RrSZGwODrsPDPk64kV4iSCYb_Qd5h9wfLLZxT29l816TfJ0xGLIOAo9tXly6ah01gtBn6GSxxFG1blA3-Wjv65EbohPn3t1YG2skRzr-a79_H9o1bZOjlNFU0RgA8ziM77yNiEzpeUZgtGQxAmHc1iGkTJEY9x30xjjRku1l2EuRtlm6UenSfXDW-iosn3yuNJRepwfoNHgnO-Bq2l1YuiBI"
                    alt="Stadium Arena"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="font-label-caps text-[10px] bg-[#c3f400] text-[#161e00] px-2.5 py-1 rounded-full font-bold inline-block mb-2 shadow-md">
                      PRO CHALLENGE
                    </span>
                    <p className="font-headline-md text-[20px] text-white leading-tight uppercase tracking-wider">
                      PREDICT NEXT GOAL SCORER
                    </p>
                    <p className="font-body-md text-[#c3f400] mt-1 font-bold flex items-center gap-1.5">
                      <Gift className="w-4 h-4" /> Earn 500 Tokens
                    </p>
                  </div>
                </div>

                {/* Quick Interactive Mini-Games Card */}
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#c3f400]/20 border border-[#c3f400]/40 flex items-center justify-center text-[#c3f400]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline-md text-[18px] text-white uppercase tracking-wider">
                        Football Mini-Games
                      </h4>
                      <p className="font-label-mono text-[11px] text-[#c4c9ac]">Test your knowledge during half-time!</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => router.push("/games/penalty")}
                      className="p-3 rounded-xl bg-white/5 hover:bg-[#c3f400]/10 hover:border-[#c3f400]/40 border border-white/10 text-left cursor-pointer transition-all"
                    >
                      <p className="font-headline-md text-[14px] text-white">PENALTY</p>
                      <p className="font-label-mono text-[10px] text-[#c3f400]">Shootout Game</p>
                    </button>
                    <button
                      onClick={() => router.push("/games/trivia")}
                      className="p-3 rounded-xl bg-white/5 hover:bg-[#c3f400]/10 hover:border-[#c3f400]/40 border border-white/10 text-left cursor-pointer transition-all"
                    >
                      <p className="font-headline-md text-[14px] text-white">TRIVIA</p>
                      <p className="font-label-mono text-[10px] text-[#c3f400]">Soccer Quiz</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
