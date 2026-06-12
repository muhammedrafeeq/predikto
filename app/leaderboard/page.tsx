"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, Minus, Award, User, Shield, Users, Activity, TrendingUp, Crown, Star, Sparkles, History, Gamepad2, Share2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ShareCard from "@/components/ShareCard";
import TopBar from "@/components/TopBar";

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
  const shareCardRef = useRef<HTMLDivElement>(null!);
  const leaderboardShareRef = useRef<HTMLDivElement>(null!);
  const [sharingLeaderboard, setSharingLeaderboard] = useState(false);

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

  const handleShareLeaderboard = useCallback(async () => {
    if (sharingLeaderboard || !leaderboardShareRef.current) return;
    setSharingLeaderboard(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(leaderboardShareRef.current, {
        backgroundColor: "#0a0a0f",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png", 0.95));
      const file = new File([blob], "skorio-leaderboard.png", { type: "image/png" });
      const myRank = rankings.find((p) => p.id === currentUser?.id);
      const text = myRank
        ? `🏆 Global Leaderboard — Skorio FIFA WC 2026! I'm #${myRank.rank} with ${myRank.points} pts. Join & predict! ⚽`
        : `🏆 Global Leaderboard — Skorio FIFA WC 2026! Top ${Math.min(rankings.length, 10)} players. Join & predict! ⚽`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        const myRank = rankings.find((p) => p.id === currentUser?.id);
        const text = myRank
          ? `🏆 Global Leaderboard — Skorio FIFA WC 2026! I'm #${myRank.rank} with ${myRank.points} pts. Join & predict! ⚽`
          : `🏆 Check the Global Leaderboard on Skorio FIFA WC 2026! ⚽`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } finally {
      setSharingLeaderboard(false);
    }
  }, [sharingLeaderboard, rankings, currentUser]);

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

  const getPodiumTheme = (rank: number) => {
    if (rank === 1) {
      return {
        icon: <Crown className="w-6 h-6 text-amber-400 mb-1 animate-sparkle" />,
        avatarContainer: "w-18 h-18 rounded-full border-[3px] border-amber-400 flex items-center justify-center font-black text-xl bg-amber-950/50 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] relative",
        badge: "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border border-amber-950 flex items-center justify-center text-amber-950 font-black text-[11px] shimmer-effect overflow-hidden",
        pedestal: "w-full bg-gradient-to-t from-amber-950/80 to-amber-800/40 border-t-2 border-x border-amber-500/40 rounded-t-xl h-[160px] flex flex-col items-center justify-center shadow-2xl hover:scale-[1.03] hover:border-amber-400/60 transition-all duration-300 group cursor-pointer relative shimmer-effect overflow-hidden",
        points: "text-2xl font-black text-amber-400 font-mono mt-1",
        pointsStyle: { textShadow: "0 0 15px rgba(245,158,11,0.4)" },
        tierBadge: "text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full mt-2.5",
        floatClass: "animate-float",
        hoverText: "group-hover:text-amber-300"
      };
    }
    if (rank === 2) {
      return {
        icon: <Star className="w-5 h-5 text-slate-400 mb-1" />,
        avatarContainer: "w-15 h-15 rounded-full border-2 border-slate-400 flex items-center justify-center font-black text-lg bg-slate-900 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.15)] relative",
        badge: "absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-slate-400 border border-slate-900 flex items-center justify-center text-slate-950 font-black text-[10px]",
        pedestal: "w-full bg-gradient-to-t from-slate-950/80 to-slate-800/40 border-t border-x border-slate-500/20 rounded-t-xl h-[120px] flex flex-col items-center justify-center shadow-lg hover:scale-[1.03] hover:border-slate-400/40 transition-all duration-300 group cursor-pointer relative shimmer-effect overflow-hidden",
        points: "text-lg font-black text-white font-mono mt-1",
        pointsStyle: {},
        tierBadge: "text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-400/10 border border-slate-400/20 px-2 py-0.5 rounded-full mt-2",
        floatClass: "animate-float-delayed",
        hoverText: "group-hover:text-slate-300"
      };
    }
    return {
      icon: <Sparkles className="w-4 h-4 text-amber-700 mb-1.5" />,
      avatarContainer: "w-15 h-15 rounded-full border-2 border-amber-700 flex items-center justify-center font-black text-lg bg-amber-950/30 text-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.15)] relative",
      badge: "absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-amber-700 border border-amber-950 flex items-center justify-center text-white font-black text-[10px]",
      pedestal: "w-full bg-gradient-to-t from-amber-950/40 to-amber-900/10 border-t border-x border-amber-700/20 rounded-t-xl h-[100px] flex flex-col items-center justify-center shadow-lg hover:scale-[1.03] hover:border-amber-600/40 transition-all duration-300 group cursor-pointer relative shimmer-effect overflow-hidden",
      points: "text-lg font-black text-white font-mono mt-1",
      pointsStyle: {},
      tierBadge: "text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-600/10 border border-amber-600/20 px-2 py-0.5 rounded-full mt-2",
      floatClass: "animate-float-delayed-more",
      hoverText: "group-hover:text-amber-600"
    };
  };

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

  // Statistics calculation
  const totalContenders = rankings.length;
  const highestScore = first ? first.points : 0;
  const averagePoints = totalContenders > 0
    ? Math.round(rankings.reduce((sum, p) => sum + p.points, 0) / totalContenders)
    : 0;

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 md:pb-8 bg-pitch overflow-x-hidden">
      
      {/* CSS Keyframes animations for Podium Rise, Floating Trophies, and staggered lists */}
      <style>{`
        .podium-rise {
          animation: riseUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(50px);
        }
        @keyframes riseUp {
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 4s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .animate-float-delayed-more {
          animation: float 4s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .animate-sparkle {
          animation: sparkle 2.5s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.6)); }
        }

        .stagger-in {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: shimmer 2.5s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <TopBar
        userName={currentUser?.name}
        userPoints={currentUser?.points}
        userRole={currentUser?.role}
        activeTab="rankings"
      />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-8">
        
        {/* Header Section */}
        <section className="flex flex-col items-center mb-8 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-violet-400 uppercase mb-1">
            Arena Standings
          </p>
          <h2 className="text-3xl font-black text-white tracking-tight">Global Leaderboard</h2>
          <p className="text-white/40 text-sm mt-1.5 max-w-sm">
            Top predictors across all leagues. Keep scoring exact lines to climb.
          </p>
        </section>

        {/* Dynamic Statistics Metrics Cards */}
        <section className="grid grid-cols-3 gap-3 mb-10">
          <div className="surface-glass-1 rounded-xl p-3.5 border border-white/5 flex flex-col items-center text-center">
            <Users className="w-5 h-5 text-violet-400 mb-1.5" />
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Contenders</span>
            <span className="text-xl font-black text-white mt-0.5">{totalContenders}</span>
          </div>
          <div className="surface-glass-1 rounded-xl p-3.5 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />
            <Trophy className="w-5 h-5 text-amber-400 mb-1.5" />
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">High Score</span>
            <span className="text-xl font-black text-amber-400 mt-0.5">{highestScore} pts</span>
          </div>
          <div className="surface-glass-1 rounded-xl p-3.5 border border-white/5 flex flex-col items-center text-center">
            <Activity className="w-5 h-5 text-sky-400 mb-1.5" />
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Avg Points</span>
            <span className="text-xl font-black text-white mt-0.5">{averagePoints}</span>
          </div>
        </section>

        {/* Share My Rank */}
        {currentUser && (() => {
          const myRank = rankings.find(p => p.id === currentUser.id);
          if (!myRank) return null;
          const whatsappText = `🏆 I'm ranked #${myRank.rank} with ${myRank.points} pts on Skorio FIFA WC 2026! Can you beat me? 🔥`;
          return (
            <div className="mb-10">
              {/* Hidden share card — captured by html2canvas */}
              <div
                ref={shareCardRef}
                style={{
                  position: "fixed",
                  left: "-9999px",
                  top: 0,
                  width: "360px",
                  background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%)",
                  borderRadius: "20px",
                  padding: "28px 24px",
                  fontFamily: "sans-serif",
                  color: "#fff",
                  border: "1.5px solid rgba(168,85,247,0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#a855f7", letterSpacing: "-0.5px" }}>SKO<span style={{ color: "#fff" }}>RIO</span></div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: "0.15em" }}>FIFA WC 2026</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "22px", fontWeight: 900, boxShadow: "0 0 20px rgba(168,85,247,0.4)"
                  }}>
                    {getInitials(myRank.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 900 }}>{myRank.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{getTier(myRank.points)}</div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: "38px", fontWeight: 900, color: "#a855f7", lineHeight: 1 }}>#{myRank.rank}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>RANK</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px", display: "flex", justifyContent: "center", gap: "32px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "26px", fontWeight: 900, color: "#f59e0b" }}>{myRank.points}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Points</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "26px", fontWeight: 900 }}>{rankings.length}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Players</div>
                  </div>
                </div>
                <div style={{ marginTop: "16px", textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                  skorio.app • Join & predict the World Cup 🌍
                </div>
              </div>

              <div className="flex justify-center">
                <ShareCard
                  cardRef={shareCardRef}
                  whatsappText={whatsappText}
                  label="Share My Rank"
                />
              </div>
            </div>
          );
        })()}

        {/* Premium Interactive 3D Podium */}
        <section className="flex items-end justify-center gap-3.5 md:gap-6 mb-14 max-w-xl mx-auto h-[320px] select-none px-2">
          
          {/* 2nd Place */}
          {second && (() => {
            const theme = getPodiumTheme(second.rank ?? 2);
            return (
              <div className="podium-rise flex flex-col items-center w-1/3" style={{ animationDelay: "0.2s" }}>
                <div className={`relative mb-3.5 flex flex-col items-center ${theme.floatClass}`}>
                  {theme.icon}
                  <div className={theme.avatarContainer}>
                    {getInitials(second.name)}
                    <div className={theme.badge}>
                      {second.rank ?? 2}
                    </div>
                  </div>
                </div>

                {/* Pedestal block */}
                <div
                  onClick={() => router.push(currentUser && currentUser.id === second.id ? "/collection" : `/users/${second.id}/collection`)}
                  className={theme.pedestal}
                >
                  <span className={`text-white font-bold text-xs truncate w-11/12 text-center ${theme.hoverText}`}>{second.name}</span>
                  <span className={theme.points} style={theme.pointsStyle}>
                    {Math.floor(multiplier * second.points).toLocaleString()}
                  </span>
                  <span className={theme.tierBadge}>
                    {getTier(second.points)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 1st Place */}
          {first && (() => {
            const theme = getPodiumTheme(first.rank ?? 1);
            return (
              <div className="podium-rise flex flex-col items-center w-1/3 z-10" style={{ animationDelay: "0.1s" }}>
                <div className={`relative mb-4 flex flex-col items-center ${theme.floatClass}`}>
                  {theme.icon}
                  <div className={theme.avatarContainer}>
                    {getInitials(first.name)}
                    <div className={theme.badge}>
                      {first.rank ?? 1}
                    </div>
                  </div>
                </div>

                {/* Pedestal block */}
                <div
                  onClick={() => router.push(currentUser && currentUser.id === first.id ? "/collection" : `/users/${first.id}/collection`)}
                  className={theme.pedestal}
                >
                  <span className={`text-white font-black text-sm truncate w-11/12 text-center ${theme.hoverText}`}>{first.name}</span>
                  <span className={theme.points} style={theme.pointsStyle}>
                    {Math.floor(multiplier * first.points).toLocaleString()}
                  </span>
                  <span className={theme.tierBadge}>
                    {getTier(first.points)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 3rd Place */}
          {third && (() => {
            const theme = getPodiumTheme(third.rank ?? 3);
            return (
              <div className="podium-rise flex flex-col items-center w-1/3" style={{ animationDelay: "0.3s" }}>
                <div className={`relative mb-3.5 flex flex-col items-center ${theme.floatClass}`}>
                  {theme.icon}
                  <div className={theme.avatarContainer}>
                    {getInitials(third.name)}
                    <div className={theme.badge}>
                      {third.rank ?? 3}
                    </div>
                  </div>
                </div>

                {/* Pedestal block */}
                <div
                  onClick={() => router.push(currentUser && currentUser.id === third.id ? "/collection" : `/users/${third.id}/collection`)}
                  className={theme.pedestal}
                >
                  <span className={`text-white font-bold text-xs truncate w-11/12 text-center ${theme.hoverText}`}>{third.name}</span>
                  <span className={theme.points} style={theme.pointsStyle}>
                    {Math.floor(multiplier * third.points).toLocaleString()}
                  </span>
                  <span className={theme.tierBadge}>
                    {getTier(third.points)}
                  </span>
                </div>
              </div>
            );
          })()}
        </section>



        {/* Off-screen leaderboard share card */}
        <div
          ref={leaderboardShareRef}
          style={{
            position: "fixed", left: "-9999px", top: 0,
            width: "380px",
            background: "linear-gradient(145deg, #0a0a0f 0%, #0f0a1e 100%)",
            borderRadius: "20px",
            padding: "24px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Header bar */}
          <div style={{ height: "3px", borderRadius: "2px", background: "linear-gradient(90deg, #a855f7, #f59e0b, #a855f7)", marginBottom: "20px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                SKO<span style={{ color: "#a855f7" }}>RIO</span>
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "2px", marginTop: "2px" }}>
                FIFA World Cup 2026
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px" }}>
                🏆 Leaderboard
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
                {rankings.length} players
              </div>
            </div>
          </div>

          {/* Top players */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {rankings.slice(0, 10).map((player) => {
              const isMe = currentUser?.id === player.id;
              const medal = player.rank === 1 ? "#f59e0b" : player.rank === 2 ? "#94a3b8" : player.rank === 3 ? "#b45309" : null;
              return (
                <div key={player.id} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  background: isMe ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)",
                  borderRadius: "10px", padding: "8px 12px",
                  border: isMe ? "1px solid rgba(168,85,247,0.25)" : "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    background: medal ? `${medal}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${medal ? `${medal}44` : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 900,
                    color: medal ?? "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                  }}>
                    {player.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12px", fontWeight: 700,
                      color: isMe ? "#c084fc" : "#fff",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {player.name}{isMe ? " 👈" : ""}
                    </div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {getTier(player.points)}
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: medal ?? (isMe ? "#c084fc" : "rgba(255,255,255,0.7)"), flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {player.points}
                    <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.25)", marginLeft: "2px" }}>pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.18)", fontWeight: 600 }}>
            ⚽ Join at skorio.app · Predict the World Cup
          </div>
        </div>

        {/* Ranking List Table Grid */}
        <section className="flex flex-col gap-3">

          {/* Share leaderboard button */}
          <div className="flex justify-end mb-1">
            <button
              onClick={handleShareLeaderboard}
              disabled={sharingLeaderboard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {sharingLeaderboard
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Share2 className="w-4 h-4 text-[#25D366]" />}
              Share Leaderboard
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-white/30 label-sm uppercase tracking-wider font-bold select-none text-[10px] border-b border-white/5">
            <div className="col-span-2 text-left">Pos</div>
            <div className="col-span-6 text-left">Competitor</div>
            <div className="col-span-4 text-right">Points</div>
          </div>

          {rankings.length === 0 ? (
            <div className="text-center py-10 text-white/20 text-sm">No competitors recorded in standings.</div>
          ) : (
            rankings.map((player, idx) => {
              const isMe = currentUser && currentUser.id === player.id;
              
              // Custom badge mapping for rank number
              const renderRankBadge = (rank: number) => {
                if (rank === 1) return <Trophy className="w-4 h-4 text-amber-400 inline" />;
                if (rank === 2) return <Star className="w-4 h-4 text-slate-400 fill-slate-400 inline" />;
                if (rank === 3) return <Award className="w-4 h-4 text-amber-700 inline" />;
                return <span className="font-mono text-xs">{rank}</span>;
              };

              return (
                <div
                  key={player.id}
                  onClick={() => router.push(isMe ? "/collection" : `/users/${player.id}/collection`)}
                  className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:bg-white/[0.04] hover:border-white/15 stagger-in cursor-pointer ${
                    isMe
                      ? "bg-primary-container/10 border-primary shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                      : "bg-white/[0.02] border-white/5"
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Position Badge */}
                  <div className="col-span-2 text-left flex items-center justify-start h-full">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                      player.rank === 1 ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                      player.rank === 2 ? "bg-slate-400/10 text-slate-400 border border-slate-400/20" :
                      player.rank === 3 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" :
                      "text-white/40"
                    }`}>
                      {renderRankBadge(player.rank)}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="col-span-6 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs select-none shrink-0 ${
                      isMe
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-white/5 border border-white/5 text-white/50"
                    }`}>
                      {getInitials(player.name)}
                    </div>
                    <div className="text-left min-w-0">
                      <div className={`text-xs font-bold truncate ${isMe ? "text-primary" : "text-white"}`}>
                        {player.name} {isMe && <span className="text-[10px] text-white/30 font-medium">(You)</span>}
                      </div>
                      <div className="text-[9px] text-white/35 font-bold uppercase tracking-wider mt-0.5">
                        {getTier(player.points)}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="col-span-4 text-right flex items-center justify-end gap-1.5">
                    <span className="font-mono font-black text-sm text-white">
                      {Math.floor(multiplier * player.points).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/20 font-medium">pts</span>
                  </div>

                </div>
              );
            })
          )}
        </section>

      </main>

      {/* Responsive Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
        style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <a className="flex flex-col items-center justify-center text-white/40 hover:text-primary gap-0.5 transition-colors" href="/matches">
          <SoccerBallIcon className="w-5 h-5 text-white/40" />
          <span className="text-[10px] font-semibold">Matches</span>
        </a>
        <a className="flex flex-col items-center justify-center text-primary font-bold gap-0.5" href="/leaderboard">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-semibold">Rankings</span>
        </a>
        <a className="flex flex-col items-center justify-center text-white/40 hover:text-violet-400 gap-0.5 transition-colors" href="/games">
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Games</span>
        </a>
        <a className="flex flex-col items-center justify-center text-white/40 hover:text-sky-400 gap-0.5 transition-colors" href="/history">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold">History</span>
        </a>
        {currentUser?.role === "admin" && (
          <a className="flex flex-col items-center justify-center text-white/40 hover:text-violet-400 gap-0.5 transition-colors" href="/admin">
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Admin</span>
          </a>
        )}
      </nav>
    </div>
  );
}
