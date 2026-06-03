"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Timer, CheckCircle2, XCircle, Trophy, User, Shield, ArrowLeft } from "lucide-react";

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

interface ConfettiParticle {
  id: number;
  left: string;
  color: string;
  delay: string;
  duration: string;
  xDist: string;
  rotateDest: string;
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

const COUNTRY_FLAGS: Record<string, string> = {
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch",
  "brazil": "br", "morocco": "ma", "haiti": "ht", "scotland": "gb-sct",
  "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  "germany": "de", "curaçao": "cw", "curacao": "cw", "ivory coast": "ci", "ecuador": "ec",
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn",
  "belgium": "be", "egypt": "eg", "iran": "ir", "new zealand": "nz",
  "spain": "es", "cape verde": "cv", "saudi arabia": "sa", "uruguay": "uy",
  "france": "fr", "senegal": "sn", "iraq": "iq", "norway": "no",
  "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co",
  "england": "gb-eng", "croatia": "hr", "ghana": "gh", "panama": "pa",
  "korea republic": "kr", "czechia": "cz",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

const teamStyles: Record<string, { code: string; bgClass: string; textClass: string }> = {
  "man united": { code: "MUN", bgClass: "bg-red-600 shadow-red-900/20", textClass: "text-white" },
  "man city": { code: "MCI", bgClass: "bg-blue-600 shadow-blue-900/20", textClass: "text-white" },
  "real madrid": { code: "RMA", bgClass: "bg-white border border-gray-200", textClass: "text-black" },
  "barcelona": { code: "BAR", bgClass: "bg-red-700", textClass: "text-white" },
  "liverpool": { code: "LIV", bgClass: "bg-red-800", textClass: "text-white" },
  "arsenal": { code: "ARS", bgClass: "bg-yellow-400", textClass: "text-black" },
  "chelsea": { code: "CHE", bgClass: "bg-blue-900", textClass: "text-white" },
  "tottenham": { code: "TH", bgClass: "bg-white border border-gray-200", textClass: "text-black" },
};

const getTeamStyle = (name: string) => {
  const key = name.toLowerCase().trim();
  if (teamStyles[key]) return teamStyles[key];
  return {
    code: name.substring(0, 3).toUpperCase(),
    bgClass: "bg-surface-container border border-white/10",
    textClass: "text-white",
  };
};

export default function ResultPage({ params }: ResultPageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  // Loaded states
  const [match, setMatch] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [user, setUser] = useState<{ name: string; points: number; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Staggered reveal row count
  const [revealedCount, setRevealedCount] = useState(0);
  
  // Points count-up state
  const [pointsCounter, setPointsCounter] = useState(0);
  
  // Confetti particles list
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

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

        const res = await fetch(`/api/matches/${id}/result`);
        if (!res.ok) {
          throw new Error("Failed to fetch result details");
        }
        const data = await res.json();
        if (data.success) {
          setMatch(data.match);
          setBreakdown(data.breakdown);
        }
      } catch (err) {
        console.error("Error loading result details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Trigger staggered reveal of cards
  useEffect(() => {
    if (!breakdown) return;
    const intervals = [300, 650, 1000, 1350];
    const timers = intervals.map((delay, idx) =>
      setTimeout(() => {
        setRevealedCount(idx + 1);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [breakdown]);

  // Trigger count-up animation when final summary card (index 4) is revealed
  useEffect(() => {
    if (revealedCount < 4 || !breakdown) return;

    let startTimestamp: number | null = null;
    const duration = 1200;
    const target = breakdown.totalPoints;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentVal = Math.floor(progress * target);
      setPointsCounter(currentVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        if (target > 0) {
          triggerConfettiBlast();
        }
      }
    };

    const delayTimer = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [revealedCount, breakdown]);

  // Confetti particle generator
  const triggerConfettiBlast = () => {
    const colors = ["#c6c0ff", "#43df9e", "#ffb955", "#ffffff"];
    const particlesList: ConfettiParticle[] = [];
    for (let i = 0; i < 80; i++) {
      particlesList.push({
        id: i,
        left: `${Math.random() * 100}vw`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: `${Math.random() * 200}ms`,
        duration: `${Math.random() * 2000 + 2500}ms`,
        xDist: `${(Math.random() - 0.5) * 200}px`,
        rotateDest: `${Math.random() * 720}deg`,
      });
    }
    setConfetti(particlesList);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface bg-pitch">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Result Breakdown...
        </p>
      </div>
    );
  }

  if (!match || !breakdown) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface bg-pitch p-6 text-center">
        <p className="text-lg text-error font-semibold">Results details not found or not finalized yet.</p>
        <button onClick={() => router.push("/matches")} className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold">
          Return to Arena
        </button>
      </div>
    );
  }

  const homeStyle = getTeamStyle(match.teamHome);
  const awayStyle = getTeamStyle(match.teamAway);

  // Parse correct score to display
  const scoreAnswer = breakdown.score?.correctAnswer || "0-0";
  const scoreParts = scoreAnswer.split("-");
  const displayScoreHome = scoreParts[0] ? scoreParts[0].trim() : "-";
  const displayScoreAway = scoreParts[1] ? scoreParts[1].trim() : "-";

  // Dynamic breakdown rows
  const predictionRows = [
    {
      id: "winner",
      label: "Match Winner",
      question: "Who will win the match?",
      bet: breakdown.winner?.userAnswer || "No prediction",
      correct: breakdown.winner?.correctAnswer || "Not set",
      isCorrect: breakdown.winner?.isCorrect || false,
      points: breakdown.winner?.isCorrect ? `+${breakdown.winner.pointsPossible} pts` : "0 pts",
    },
    {
      id: "score",
      label: "Exact Scoreline",
      question: "What is the final scoreline?",
      bet: breakdown.score?.userAnswer || "No prediction",
      correct: breakdown.score?.correctAnswer || "Not set",
      isCorrect: breakdown.score?.isCorrect || false,
      points: breakdown.score?.isCorrect ? `+${breakdown.score.pointsPossible} pts` : "0 pts",
    },
    {
      id: "scorer",
      label: "Man of the Match",
      question: "Who is the man of the match?",
      bet: breakdown.scorer?.userAnswer || "No prediction",
      correct: breakdown.scorer?.correctAnswer || "Not set",
      isCorrect: breakdown.scorer?.isCorrect || false,
      points: breakdown.scorer?.isCorrect ? `+${breakdown.scorer.pointsPossible} pts` : "0 pts",
    },
  ];

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 md:pb-8 bg-pitch overflow-x-hidden">
      
      {/* CSS Confetti keyframes styling injection */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate3d(0, -10px, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--xDist), 100vh, 0) rotate(var(--rotateDest)); opacity: 0; }
        }
        .confetti-particle {
          animation: confetti-fall var(--duration) cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--delay) forwards;
        }
      `}</style>

      {/* Confetti Elements Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="confetti-particle absolute w-2 h-2 rounded-sm"
            style={
              {
                left: particle.left,
                backgroundColor: particle.color,
                "--delay": particle.delay,
                "--duration": particle.duration,
                "--xDist": particle.xDist,
                "--rotateDest": particle.rotateDest,
                top: "-10px",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* TopAppBar Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-surface/80 backdrop-blur-xl border-b border-white/10 h-16">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/matches")}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-primary"
            aria-label="Back to Matches"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="headline-md font-extrabold tracking-tighter text-primary select-none">
            PREDIKTO
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-on-surface-variant font-bold font-mono">{user.points} pts</span>
          )}
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 select-none">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP8lJw8ALFixkH-EjSGFL0Zrn3B2sXjjhJiBFS_BdIvH1HvPsQ0bv-alUicuh1Js8juYlaHRyx57lRKt2qsDLFaRqWm6pewsS4E9aA7CrnRYK9XDk2pXSLm3cwzcKHkqyOuF8mm8xAt_16nTFwqx-GdH_utatVkr-UZcOjiOgppF4EawItJdkmlFg4NLfrrVG0peAg0HyFbqoNHtp_jgRFteFFBoz8UNizq79qJShPjRpjBL0Srk9FKg-5qvn-v45TBIMn4O5HTCAX"
            />
          </div>
        </div>
      </header>

      {/* Main fixtures lists */}
      <main className="container mx-auto px-6 pt-24 pb-8 max-w-2xl relative z-10 flex flex-col gap-8">
        
        {/* Full-time Hero Scoreboard Section */}
        <section className="flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/20 text-error mb-4 border border-error/20 select-none">
            <Timer className="w-4 h-4" />
            <span className="label-sm font-bold tracking-widest uppercase text-xs">Full Time</span>
          </div>

          <div className="flex items-center justify-center gap-8 md:gap-12 w-full">
            {/* Home Team */}
            <div className="flex flex-col items-center w-1/3">
              {getFlag(match.teamHome) ? (
                <img
                  src={getFlag(match.teamHome)!}
                  alt={match.teamHome}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover shadow-lg mb-2 select-none border border-white/10"
                />
              ) : (
                <div className={`h-20 w-20 md:h-24 md:w-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-extrabold shadow-lg mb-2 select-none ${homeStyle.bgClass} ${homeStyle.textClass}`}>
                  {homeStyle.code}
                </div>
              )}
              <span className="headline-md font-bold text-white text-sm md:text-base text-center wrap-break-word w-full">{match.teamHome}</span>
            </div>

            {/* Score Center */}
            <div className="flex flex-col items-center select-none w-1/3">
              <span className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white font-mono leading-none">
                {displayScoreHome} - {displayScoreAway}
              </span>
              <span className="label-md text-on-surface-variant/60 uppercase tracking-[0.2em] mt-2 text-xs">Score</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center w-1/3">
              {getFlag(match.teamAway) ? (
                <img
                  src={getFlag(match.teamAway)!}
                  alt={match.teamAway}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover shadow-lg mb-2 select-none border border-white/10"
                />
              ) : (
                <div className={`h-20 w-20 md:h-24 md:w-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-extrabold shadow-lg mb-2 select-none ${awayStyle.bgClass} ${awayStyle.textClass}`}>
                  {awayStyle.code}
                </div>
              )}
              <span className="headline-md font-bold text-white text-sm md:text-base text-center wrap-break-word w-full">{match.teamAway}</span>
            </div>
          </div>
        </section>

        {/* Prediction Comparison Rows Section */}
        <section className="flex flex-col gap-4">
          <h3 className="label-md text-on-surface-variant uppercase tracking-widest text-center mb-2 font-bold select-none text-xs">
            Prediction Breakdown
          </h3>

          {predictionRows.map((row, index) => {
            const isRevealed = revealedCount > index;
            return (
              <div
                key={row.id}
                className={`surface-glass-1 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-500 shadow-md ${
                  isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="label-sm text-on-surface-variant/70 mb-0.5 text-xs">{row.label}</span>
                  <span className="body-md font-semibold text-on-surface text-sm">{row.question}</span>
                  <span className="text-xs text-on-surface-variant/50 mt-1">Correct answer: {row.correct}</span>
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="flex flex-col items-start md:items-end">
                    <span className="label-sm text-on-surface-variant/50 text-xs">Your Bet</span>
                    <span className={`body-md font-bold text-sm ${row.isCorrect ? "text-secondary" : "text-error"}`}>
                      {row.bet}
                    </span>
                  </div>

                  {/* Status Checked Icon */}
                  {row.isCorrect ? (
                    <div className="h-10 w-10 rounded-full bg-secondary-container/10 border border-secondary/20 flex items-center justify-center animate-bounce-short">
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-error-container/15 border border-error/25 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-error" />
                    </div>
                  )}

                  <div className="flex flex-col items-end min-w-[60px]">
                    <span className={`label-md font-semibold text-sm ${row.isCorrect ? "text-secondary" : "text-on-surface-variant/50"}`}>
                      {row.points}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Points Summary Performance Card */}
        <section className={`transition-all duration-500 ${revealedCount >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
          <div className="relative overflow-hidden surface-glass-1 rounded-lg p-6 border border-primary/20 shadow-2xl flex flex-col items-center">
            {/* Background Glow Accents */}
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-secondary/5 blur-[60px] rounded-full pointer-events-none" />
            
            <span className="label-md text-on-surface-variant/80 uppercase tracking-[0.2em] mb-1.5 font-bold select-none text-xs">
              Total Performance
            </span>
            
            <div className="flex items-baseline gap-1 select-none">
              <span className="font-display-lg text-primary text-5xl md:text-6xl font-bold font-mono">
                {pointsCounter}
              </span>
              <span className="headline-md text-primary/60 text-lg">/ 11</span>
            </div>
            
            <span className="body-md text-on-surface-variant mt-2 font-medium text-sm">Points Earned This Match</span>
            
            <div className="mt-6 w-full flex items-center justify-center gap-8 select-none">
              <div className="flex flex-col items-center">
                <span className="label-sm text-on-surface-variant/50 uppercase font-semibold text-xs">Efficiency</span>
                <span className="headline-md font-bold text-lg">
                  {Math.round((breakdown.correctCount / 3) * 100)}%
                </span>
              </div>
              
              <div className="w-px h-8 bg-white/10" />
              
              <div className="flex flex-col items-center">
                <span className="label-sm text-on-surface-variant/50 uppercase font-semibold text-xs">Bonus Points</span>
                <span className="headline-md text-tertiary font-bold text-lg">
                  +{breakdown.bonusPoints} pts
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/leaderboard")}
              className="mt-8 w-full max-w-md py-3.5 rounded-md bg-gradient-to-r from-primary-container to-primary text-on-primary-container font-label-md label-md uppercase tracking-widest shadow-lg shadow-primary/10 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer text-xs font-bold"
            >
              View Leaderboard
            </button>
          </div>
        </section>
      </main>

      {/* Responsive Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-surface/80 backdrop-blur-xl border-t border-white/10 md:hidden">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary gap-0.5" href="/matches">
          <SoccerBallIcon className="w-5 h-5 text-on-surface-variant" />
          <span className="label-sm select-none text-xs">Matches</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary gap-0.5 transition-transform hover:scale-105" href="/leaderboard">
          <Trophy className="w-5 h-5 animate-pulse" />
          <span className="label-sm select-none text-xs">Rankings</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary gap-0.5 transition-transform hover:scale-105" href="/history">
          <User className="w-5 h-5" />
          <span className="label-sm select-none text-xs">Profile</span>
        </a>
        {user?.role === "admin" && (
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary gap-0.5 transition-transform hover:scale-105" href="/admin">
            <Shield className="w-5 h-5" />
            <span className="label-sm select-none text-xs">Admin</span>
          </a>
        )}
      </nav>
    </div>
  );
}

