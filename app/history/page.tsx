"use client";

import React, { useState, useEffect } from "react";
import { Award, Trophy, Shield, ArrowRight, Clock, History, LayoutGrid, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface HistoryCard {
  id: string;
  matchName: string;
  date: string;
  stadium: string;
  earnedPoints?: number;
  totalPoints: number;
  isPending?: boolean;
  questions: ("correct" | "incorrect" | "pending")[];
  resultRoute?: string;
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

export default function PredictionHistory() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; points: number; role?: string } | null>(null);
  const [history, setHistory] = useState<HistoryCard[]>([]);
  const [stats, setStats] = useState({ points: 0, predictions: 0, accuracy: 0 });
  const [loading, setLoading] = useState(true);
  const [multiplier, setMultiplier] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setUser(userData.user);
          }
        }

        const historyRes = await fetch("/api/history");
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.success) {
            setStats({
              points: historyData.stats.totalPoints,
              predictions: historyData.stats.predictionsCount,
              accuracy: historyData.stats.accuracy,
            });

            // Map backend data to history cards
            const mapped = historyData.history.filter((m: any) => m.status === "resulted").map((m: any) => {
              const kickoff = new Date(m.matchTime);
              const dateText = kickoff.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
              const isPending = m.status !== "resulted";

              const qWinner = m.predictions.winner;
              const qScore = m.predictions.score;
              const qScorer = m.predictions.scorer;

              const questions: ("correct" | "incorrect" | "pending")[] = [
                qWinner ? (qWinner.isCorrect === null ? "pending" : qWinner.isCorrect ? "correct" : "incorrect") : "pending",
                qScore ? (qScore.isCorrect === null ? "pending" : qScore.isCorrect ? "correct" : "incorrect") : "pending",
                qScorer ? (qScorer.isCorrect === null ? "pending" : qScorer.isCorrect ? "correct" : "incorrect") : "pending"
              ];

              return {
                id: m.matchId.toString(),
                matchName: `${m.teamHome} vs ${m.teamAway}`,
                date: dateText,
                stadium: "Arena",
                earnedPoints: m.pointsEarned !== null ? m.pointsEarned : undefined,
                totalPoints: 11,
                isPending,
                questions,
                resultRoute: `/matches/${m.matchId}/result?contestId=${m.contestId}`,
              };
            });
            setHistory(mapped);
          }
        }
      } catch (err) {
        console.error("Error loading history page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Synchronized count-up animation over 1.5 seconds on mount
  useEffect(() => {
    if (loading) return;
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
    }, 450);

    return () => clearTimeout(delay);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface bg-pitch">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Prediction Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 md:pb-8 bg-pitch overflow-x-hidden">
      
      {/* CSS keyframe animations for progress ring and cards rise */}
      <style>{`
        .stagger-in {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.6s forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .progress-ring__circle {
          transition: stroke-dashoffset 0.8s ease-in-out;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
      `}</style>

      {/* TopAppBar Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-surface/80 backdrop-blur-xl border-b border-white/10 h-16">
        <div className="flex items-center gap-2">
          <SoccerBallIcon className="w-7 h-7 text-primary" />
          <h1 className="headline-md font-extrabold tracking-tighter text-primary select-none">
            SKORIO
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors label-md" href="/matches">Matches</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors label-md" href="/leaderboard">Rankings</a>
            <a className="text-primary font-bold label-md" href="/history">History</a>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 select-none">
            <img
              alt="Profile Avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP8lJw8ALFixkH-EjSGFL0Zrn3B2sXjjhJiBFS_BdIvH1HvPsQ0bv-alUicuh1Js8juYlaHRyx57lRKt2qsDLFaRqWm6pewsS4E9aA7CrnRYK9XDk2pXSLm3cwzcKHkqyOuF8mm8xAt_16nTFwqx-GdH_utatVkr-UZcOjiOgppF4EawItJdkmlFg4NLfrrVG0peAg0HyFbqoNHtp_jgRFteFFBoz8UNizq79qJShPjRpjBL0Srk9FKg-5qvn-v45TBIMn4O5HTCAX"
            />
          </div>
        </div>
      </header>

      {/* Main fixtures lists */}
      <main className="container mx-auto px-6 pt-24 pb-8 max-w-3xl">
        
        {/* Header Section */}
        <div className="mb-8 text-left select-none animate-fade-in">
          <h1 className="headline-lg text-on-surface text-2xl font-extrabold tracking-tight">Prediction History</h1>
          <p className="body-md text-on-surface-variant mt-1 text-sm">Review your performance and track your growth.</p>
        </div>

        {/* Stats Strip Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 select-none">
          
          {/* Total Points Card */}
          <div className="stagger-in surface-glass-1 rounded-lg p-6 flex flex-col justify-between shadow-md" style={{ animationDelay: "0.1s" }}>
            <span className="label-md text-on-surface-variant uppercase tracking-wider font-bold text-xs">Total Points</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="font-display-lg text-primary font-mono text-3xl md:text-4xl font-bold">
                {Math.floor(stats.points * multiplier).toLocaleString()}
              </span>
              <span className="label-md text-primary/60 font-semibold text-xs">PTS</span>
            </div>
          </div>

          {/* Predictions Made Card */}
          <div className="stagger-in surface-glass-1 rounded-lg p-6 flex flex-col justify-between shadow-md" style={{ animationDelay: "0.2s" }}>
            <span className="label-md text-on-surface-variant uppercase tracking-wider font-bold text-xs">Predictions Made</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="font-display-lg text-on-surface font-mono text-3xl md:text-4xl font-bold">
                {Math.floor(stats.predictions * multiplier)}
              </span>
              <span className="label-md text-on-surface-variant font-semibold text-xs">TOTAL</span>
            </div>
          </div>

          {/* Accuracy % Circular Card */}
          <div className="stagger-in surface-glass-1 rounded-lg p-6 flex items-center justify-between shadow-md" style={{ animationDelay: "0.3s" }}>
            <div>
              <span className="label-md text-on-surface-variant uppercase tracking-wider font-bold text-xs">Accuracy %</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="font-display-lg text-secondary font-mono text-3xl md:text-4xl font-bold">
                  {Math.floor(stats.accuracy * multiplier)}
                </span>
                <span className="label-md text-secondary/60 font-semibold text-xs">%</span>
              </div>
            </div>
            
            {/* SVG Circular Progress Ring */}
            <div className="relative h-16 w-16">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  className="stroke-surface-variant"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="3"
                />
                <path
                  className="progress-ring__circle stroke-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  id="accuracy-ring"
                  strokeWidth="3"
                  strokeDasharray={`${stats.accuracy * multiplier}, 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

        </div>

        {/* History List Header */}
        <div className="flex items-center justify-between mb-6 select-none">
          <h2 className="headline-md text-on-surface font-bold text-left text-lg">Match History</h2>
          <div className="flex gap-2">
            <span className="bg-surface-variant/40 text-on-surface-variant px-3 py-1 rounded label-sm uppercase font-semibold border border-white/5 text-xs">
              All Competitions
            </span>
          </div>
        </div>

        {/* Match History List Card Containers */}
        <div className="space-y-4">
          {history.length === 0 && (
            <div className="text-center py-12 surface-glass-1 rounded-lg text-on-surface-variant text-sm select-none">
              No historical predictions found. Submit predictions to get started!
            </div>
          )}

          {history.map((card, idx) => {
            const delay = `${(idx + 4) * 0.1}s`;
            return (
              <div
                key={card.id}
                style={{ animationDelay: delay }}
                className="stagger-in surface-glass-1 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md hover:border-white/15 transition-all duration-base text-left"
              >
                
                {/* Header Fixture Info */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-md bg-surface-container flex items-center justify-center border border-white/5 select-none text-on-surface-variant">
                    <SoccerBallIcon className="w-6 h-6 text-on-surface-variant" />
                  </div>
                  <div>
                    <h3 className="body-lg font-bold text-white text-sm md:text-base">{card.matchName}</h3>
                    <p className="label-sm text-on-surface-variant uppercase font-medium mt-0.5 text-xs">
                      {card.date} • {card.stadium}
                    </p>
                  </div>
                </div>

                {/* Score and status indicators */}
                <div className="flex flex-wrap items-center gap-8 justify-between md:justify-end">
                  
                  {/* Points Earned display */}
                  <div className="flex flex-col items-start md:items-end">
                    <span className="label-sm text-on-surface-variant uppercase font-semibold text-xs">Earned</span>
                    <span className={`headline-md font-bold text-sm ${card.isPending ? "text-on-surface-variant" : "text-primary"}`}>
                      {card.isPending ? `-- / ${card.totalPoints} pts` : `${card.earnedPoints} / ${card.totalPoints} pts`}
                    </span>
                  </div>

                  {/* Dot status indicators */}
                  <div className="flex flex-col items-center gap-1.5 select-none">
                    <span className="label-sm text-on-surface-variant uppercase font-semibold text-xs">Questions</span>
                    <div className="flex gap-2">
                      {card.questions.map((status, qIdx) => (
                        <div
                          key={qIdx}
                          className={`w-3 h-3 rounded-full ${
                            status === "correct"
                              ? "bg-secondary shadow-[0_0_8px_rgba(67,223,158,0.5)]"
                              : status === "incorrect"
                              ? "bg-error shadow-[0_0_8px_rgba(255,180,171,0.5)]"
                              : "bg-outline-variant"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Link button */}
                  {card.isPending ? (
                    <div className="flex items-center gap-1 label-md text-on-surface-variant cursor-not-allowed select-none text-xs">
                      Pending
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push(card.resultRoute || "#")}
                      className="text-primary hover:text-primary-container transition-colors flex items-center gap-1 label-md font-bold cursor-pointer text-xs"
                    >
                      View details
                      <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      </main>

      {/* Responsive Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10 md:hidden">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary gap-0.5" href="/contests">
          <LayoutGrid className="w-5 h-5 text-on-surface-variant" />
          <span className="label-sm select-none text-xs">My Contests</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-violet-400 gap-0.5 transition-colors" href="/games">
          <Gamepad2 className="w-5 h-5 text-on-surface-variant" />
          <span className="label-sm select-none text-xs">Games</span>
        </a>
        <a className="flex flex-col items-center justify-center text-primary font-bold gap-0.5" href="/history">
          <History className="w-5 h-5 text-primary" />
          <span className="label-sm select-none text-xs">History</span>
        </a>
        {user?.role === "admin" && (
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary gap-0.5 transition-colors" href="/admin">
            <Shield className="w-5 h-5" />
            <span className="label-sm select-none text-xs">Admin</span>
          </a>
        )}
      </nav>
    </div>
  );
}
