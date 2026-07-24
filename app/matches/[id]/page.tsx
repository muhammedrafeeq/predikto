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
  period?: number;
  player?: string;
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
  const [activeTab, setActiveTab] = useState<"summary" | "stats" | "lineups" | "h2h">("summary");
  const [copied, setCopied] = useState(false);

  // Load match details from API
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.match) {
          const isMock = String(id).startsWith("v-") || String(id).startsWith("m-");
          setMatch(data.match);
          setVenue(data.venue || (isMock ? "SANTIAGO BERNABÉU" : null));
          setStats(data.stats && data.stats.length > 0 ? data.stats : (isMock ? getFallbackStats() : []));
          setKeyEvents(data.keyEvents && data.keyEvents.length > 0 ? data.keyEvents : (isMock ? getFallbackEvents() : []));
          setCommentary(data.commentary || []);
          setRosters(data.rosters && data.rosters.length > 0 ? data.rosters : (isMock ? getFallbackRosters() : []));
          setNews(data.news || []);
          setH2h(data.h2h && data.h2h.length > 0 ? data.h2h : (isMock ? getFallbackH2h() : []));
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

  // Fallback enriched data generator for match details
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
        text: "Goal! Vinícius Júnior scores a spectacular long-range strike into the top corner.",
        type: "goal",
        player: "Vinícius Júnior",
      },
      {
        id: "ev-2",
        clock: "54'",
        text: "Yellow Card. Rodri receives a booking for a tactical foul on Jude Bellingham.",
        type: "yellow-card",
        player: "Rodri",
      },
      {
        id: "ev-3",
        clock: "45'",
        text: "Goal! Erling Haaland finishes clinically after a precise cross from De Bruyne.",
        type: "goal",
        player: "Erling Haaland",
      },
    ];
  }

  function getFallbackH2h(): H2hMatch[] {
    return [
      { date: "17 MAY 2024", homeTeam: "MAN CITY", awayTeam: "REAL MADRID", score: "4 - 0" },
      { date: "09 MAY 2024", homeTeam: "REAL MADRID", awayTeam: "MAN CITY", score: "1 - 1" },
      { date: "04 MAY 2023", homeTeam: "REAL MADRID", awayTeam: "MAN CITY", score: "3 - 1" },
    ];
  }

  function getFallbackRosters(): RosterTeam[] {
    return [
      {
        teamName: "REAL MADRID",
        teamLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVtpgAn5jC4fERyPVxxlv4F9Soz6en7KE02RwyN7-Ri1rebwWWJBsRRVprQNUASPNq2h8kuvz_1YZb2rm4-xeoBjn-EKu76pOiRG2j55rOz9UKlafuFAC7lyZzGh08dGBCb3J7uBrUueoVj46DeMb4_nKh6FnfnYo_c_wM6soxTE-v1BuiFnf0l6Ma1WJ6ePY-ZGB5NoGtuIKy6-LA-wP-7KO5D9ZjdLzYbNJxtdD61ksvgbihkQ8vpFzNcLx9tLWv_6HiGPTm02o",
        players: [
          { id: "p1", name: "Thibaut Courtois", jersey: "1", position: "GK", starter: true },
          { id: "p2", name: "Dani Carvajal", jersey: "2", position: "DF", starter: true },
          { id: "p3", name: "Antonio Rüdiger", jersey: "22", position: "DF", starter: true },
          { id: "p4", name: "Éder Militão", jersey: "3", position: "DF", starter: true },
          { id: "p5", name: "Jude Bellingham", jersey: "5", position: "MF", starter: true },
          { id: "p6", name: "Federico Valverde", jersey: "15", position: "MF", starter: true },
          { id: "p7", name: "Luka Modrić", jersey: "10", position: "MF", starter: true },
          { id: "p8", name: "Vinícius Júnior", jersey: "7", position: "FW", starter: true },
          { id: "p9", name: "Rodrygo", jersey: "11", position: "FW", starter: true },
        ],
      },
      {
        teamName: "MAN CITY",
        teamLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdsF8Lw5CumtrZAHoGd4ZkkYFJ1M-bI6VrFncQfrDWXfzPRy3cQyIAH9xsuHsmv0HOrprnLA3hUVCZzhhlBL00J6wuWlM6idBw6w5JHKkHIra47C67whWoRmHwWfKHkMmNLmGdYeYQcwCPMO-q89FadtzZfJ5WhUvdBj2u5n5E1fgTn9o3v7VmEXfjq-aqzgjX2RGeb57BznWq8rnJ1kNy1iA4Le_vfejVbI-S2bUBAb1FWhPqpaS3GHIjrBtXYN8PwOMJRbbipS0",
        players: [
          { id: "p10", name: "Ederson", jersey: "31", position: "GK", starter: true },
          { id: "p11", name: "Kyle Walker", jersey: "2", position: "DF", starter: true },
          { id: "p12", name: "Rúben Dias", jersey: "3", position: "DF", starter: true },
          { id: "p13", name: "John Stones", jersey: "5", position: "DF", starter: true },
          { id: "p14", name: "Rodri", jersey: "16", position: "MF", starter: true },
          { id: "p15", name: "Kevin De Bruyne", jersey: "17", position: "MF", starter: true },
          { id: "p16", name: "Bernardo Silva", jersey: "20", position: "MF", starter: true },
          { id: "p17", name: "Phil Foden", jersey: "47", position: "FW", starter: true },
          { id: "p18", name: "Erling Haaland", jersey: "9", position: "FW", starter: true },
        ],
      },
    ];
  }

  // Display default match info if match is null
  const displayMatch: MatchData = match || {
    id: id || "m-default",
    teamHome: "REAL MADRID",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVtpgAn5jC4fERyPVxxlv4F9Soz6en7KE02RwyN7-Ri1rebwWWJBsRRVprQNUASPNq2h8kuvz_1YZb2rm4-xeoBjn-EKu76pOiRG2j55rOz9UKlafuFAC7lyZzGh08dGBCb3J7uBrUueoVj46DeMb4_nKh6FnfnYo_c_wM6soxTE-v1BuiFnf0l6Ma1WJ6ePY-ZGB5NoGtuIKy6-LA-wP-7KO5D9ZjdLzYbNJxtdD61ksvgbihkQ8vpFzNcLx9tLWv_6HiGPTm02o",
    teamAway: "MAN CITY",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdsF8Lw5CumtrZAHoGd4ZkkYFJ1M-bI6VrFncQfrDWXfzPRy3cQyIAH9xsuHsmv0HOrprnLA3hUVCZzhhlBL00J6wuWlM6idBw6w5JHKkHIra47C67whWoRmHwWfKHkMmNLmGdYeYQcwCPMO-q89FadtzZfJ5WhUvdBj2u5n5E1fgTn9o3v7VmEXfjq-aqzgjX2RGeb57BznWq8rnJ1kNy1iA4Le_vfejVbI-S2bUBAb1FWhPqpaS3GHIjrBtXYN8PwOMJRbbipS0",
    matchTime: new Date().toISOString(),
    status: "live",
    statusDetail: "LIVE 75'",
    league: "UCL QUARTER FINAL",
    scoreHome: 2,
    scoreAway: 2,
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
            <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold truncate max-w-[150px] sm:max-w-xs">
              {displayMatch.league || "CHAMPIONS LEAGUE"}
            </span>
          </button>

          <div
            onClick={() => router.push("/")}
            className="font-headline-lg-mobile text-[22px] sm:text-[24px] text-[#c3f400] tracking-wider cursor-pointer"
          >
            SKORIO
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

      <main className="pt-16 pb-24 overflow-x-hidden">
        {/* Hero Header Score Board */}
        <section className="relative w-full py-10 min-h-[320px] flex flex-col items-center justify-center overflow-hidden px-4 border-b border-white/10 bg-gradient-to-b from-[#131313] via-[#0A0A0A] to-[#0e0e0e]">
          {/* Subtle Ambient Radial Lighting */}
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

              <div className="mt-2 font-label-caps text-[11px] text-[#c4c9ac]/70 tracking-[0.2em] uppercase font-bold text-center">
                {venue}
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
        </section>

        {/* Tab Navigation */}
        <nav className="sticky top-16 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#c3f400]/10">
          <div className="max-w-[1200px] mx-auto px-4 flex gap-8 overflow-x-auto hide-scrollbar">
            {(["summary", "stats", "lineups", "h2h"] as const).map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-label-caps text-[12px] whitespace-nowrap transition-all uppercase tracking-widest cursor-pointer ${
                    isActive
                      ? "text-[#c3f400] border-b-2 border-[#c3f400] font-bold"
                      : "text-[#c4c9ac] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content Grid */}
        <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Primary Tab Content */}
          <div className="md:col-span-7 flex flex-col gap-6">
            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <div className="space-y-6">
                <h3 className="font-headline-md text-[20px] text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#c3f400]" /> MATCH TIMELINE
                </h3>

                <div className="space-y-4">
                  {keyEvents.map((ev, idx) => (
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
                          {ev.type === "goal" || ev.text.toLowerCase().includes("goal") ? (
                            <span className="w-6 h-6 rounded-full bg-[#c3f400]/20 flex items-center justify-center text-[#c3f400] font-bold text-xs">
                              ⚽
                            </span>
                          ) : (
                            <span className="w-3.5 h-5 bg-amber-400 rounded-sm inline-block shadow-sm" />
                          )}
                        </div>
                        <p className="text-[#c4c9ac] font-body-md text-[15px]">{ev.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATS TAB (or Stats subview) */}
            {(activeTab === "stats" || activeTab === "summary") && (
              <div className="space-y-6 mt-4">
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

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <p className="font-label-caps text-[11px] text-[#c4c9ac]">TOTAL SHOTS</p>
                      <p className="font-headline-lg text-[32px] text-white">14</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5">
                      <p className="font-label-caps text-[11px] text-[#c4c9ac]">FOULS</p>
                      <p className="font-headline-lg text-[32px] text-white">9</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LINEUPS TAB */}
            {activeTab === "lineups" && (
              <div className="space-y-6">
                <h3 className="font-headline-md text-[20px] text-[#c3f400] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#c3f400]" /> STARTING LINEUPS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {rosters.map((r, idx) => (
                    <div key={idx} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        {r.teamLogo && <img src={r.teamLogo} alt={r.teamName} className="w-8 h-8 object-contain" />}
                        <h4 className="font-headline-md text-[18px] text-white uppercase">{r.teamName}</h4>
                      </div>

                      <div className="space-y-2">
                        {r.players.map((p) => (
                          <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 text-xs">
                            <div className="flex items-center gap-2.5">
                              {p.jersey && (
                                <span className="font-label-mono font-bold text-[#c3f400] w-5 text-center">
                                  {p.jersey}
                                </span>
                              )}
                              <span className="font-body-md text-white font-medium text-[15px]">{p.name}</span>
                            </div>
                            {p.position && (
                              <span className="font-label-caps text-[10px] text-[#c4c9ac] px-2 py-0.5 rounded bg-white/5">
                                {p.position}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
                alt="Santiago Bernabeu Stadium"
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
      </main>

      <Footer />
      <BottomNav activeTab="matches" />
    </div>
  );
}
