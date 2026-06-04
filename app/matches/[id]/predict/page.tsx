"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Timer, CheckCircle2, Search, Plus, Minus, Send, Check, User, Trophy } from "lucide-react";
import AdsterraInterstitial from "@/components/ads/AdsterraInterstitial";

interface PredictPageProps {
  params: Promise<{ id: string }>;
}

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

const COUNTRY_FLAGS: Record<string, string> = {
  // Group A
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  // Group B
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch",
  // Group C
  "brazil": "br", "morocco": "ma", "haiti": "ht", "scotland": "gb-sct",
  // Group D
  "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  // Group E
  "germany": "de", "curaçao": "cw", "curacao": "cw",
  "ivory coast": "ci", "ecuador": "ec",
  // Group F
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn",
  // Group G
  "belgium": "be", "egypt": "eg", "iran": "ir", "new zealand": "nz",
  // Group H
  "spain": "es", "cape verde": "cv", "saudi arabia": "sa", "uruguay": "uy",
  // Group I
  "france": "fr", "senegal": "sn", "iraq": "iq", "norway": "no",
  // Group J
  "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  // Group K
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co",
  // Group L
  "england": "gb-eng", "croatia": "hr", "ghana": "gh", "panama": "pa",
  "korea republic": "kr", "czechia": "cz",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

interface Question {
  id: number;
  type: "winner" | "score" | "scorer";
  label: string;
  points: number;
}

export default function PredictPage({ params }: PredictPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Loaded states
  const [match, setMatch] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<{ name: string; points: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [squadPlayers, setSquadPlayers] = useState<{ name: string; teamName: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Form selections and counters states
  const [winner, setWinner] = useState<"home" | "draw" | "away" | null>(null);
  const [topScorer, setTopScorer] = useState("");
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  
  // Submit animation states
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Countdown timer state
  const [countdown, setCountdown] = useState<number | null>(null);

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

        const matchRes = await fetch(`/api/matches/${id}`);
        if (!matchRes.ok) {
          throw new Error("Failed to fetch match");
        }
        const matchData = await matchRes.json();
        if (matchData.success) {
          setMatch(matchData.match);
          setQuestions(matchData.questions);
          setSquadPlayers(matchData.players || []);
          
          const deadlineTime = new Date(matchData.match.deadline).getTime();
          const secondsLeft = Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000));
          setCountdown(secondsLeft);
        }

        // Fetch predictions if any
        const predRes = await fetch(`/api/matches/${id}/my-prediction`);
        if (predRes.ok) {
          const predData = await predRes.json();
          if (predData.success && predData.predictions) {
            const preds = predData.predictions;
            if (preds.winner) {
              setWinner(preds.winner.answer as "home" | "draw" | "away");
            }
            if (preds.scorer) {
              setTopScorer(preds.scorer.answer);
            }
            if (preds.score) {
              const parts = preds.score.answer.split("-");
              if (parts.length === 2) {
                setScoreHome(parseInt(parts[0], 10) || 0);
                setScoreAway(parseInt(parts[1], 10) || 0);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading prediction page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Countdown timer interval logic
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Format countdown into HH:MM:SS
  const formatCountdown = (secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Stepper handlers for home/away scores
  const handleScoreStep = (team: "home" | "away", delta: number) => {
    if (team === "home") {
      setScoreHome((prev) => Math.max(0, Math.min(9, prev + delta)));
    } else {
      setScoreAway((prev) => Math.max(0, Math.min(9, prev + delta)));
    }
  };

  // Autocomplete chip selection handler
  const handleScorerChipClick = (name: string) => {
    setTopScorer(name);
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Only exact scoreline is mandatory
    const scoreQ = questions.find(q => q.type === "score");
    if (!scoreQ) {
      setErrorMessage("Score question not found for this match.");
      return;
    }

    setSubmitStatus("submitting");

    try {
      // Build predictions array — score is mandatory, winner & scorer are optional
      const preds: { questionId: number; answer: string }[] = [];

      // Always include exact scoreline
      preds.push({ questionId: scoreQ.id, answer: `${scoreHome}-${scoreAway}` });

      // Include winner only if selected — store actual team name, not "home"/"away"
      if (winner) {
        const winnerQ = questions.find(q => q.type === "winner");
        if (winnerQ) {
          const winnerAnswer =
            winner === "home" ? match.teamHome :
            winner === "away" ? match.teamAway :
            "Draw";
          preds.push({ questionId: winnerQ.id, answer: winnerAnswer });
        }
      }

      // Include top scorer only if filled
      if (topScorer.trim()) {
        const scorerQ = questions.find(q => q.type === "scorer");
        if (scorerQ) preds.push({ questionId: scorerQ.id, answer: topScorer.trim() });
      }

      const payload = { predictions: preds };

      const res = await fetch(`/api/matches/${id}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Submission failed");
      }

      setSubmitStatus("success");
      setTimeout(() => {
        setShowInterstitial(true);
      }, 800);
    } catch (err: any) {
      console.error("Prediction submission error:", err);
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setSubmitStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface bg-pitch">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Fixture Setup...
        </p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface bg-pitch p-6 text-center">
        <p className="text-lg text-error font-semibold">Fixture not found or invalid ID.</p>
        <button onClick={() => router.push("/matches")} className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold">
          Return to Arena
        </button>
      </div>
    );
  }

  const homeStyle = getTeamStyle(match.teamHome);
  const awayStyle = getTeamStyle(match.teamAway);
  const kickoff = new Date(match.matchTime);
  const kickoffText =
    kickoff.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" }) +
    ", " +
    kickoff.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) +
    " IST";

  const hasClosed = countdown !== null && countdown <= 0;

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-32 bg-pitch overflow-x-hidden">
      {showInterstitial && (
        <AdsterraInterstitial onClose={() => router.push("/matches")} />
      )}
      
      {/* Fixed Navigation App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 py-3 h-16">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-primary"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-headline-md font-extrabold tracking-tighter text-primary select-none">
            SKORIO
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-on-surface-variant font-bold font-mono">{user.points} pts</span>
          )}
          <div className="w-8 h-8 rounded-full bg-primary-container overflow-hidden border border-primary/20 select-none">
            <img
              alt="Profile avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP8lJw8ALFixkH-EjSGFL0Zrn3B2sXjjhJiBFS_BdIvH1HvPsQ0bv-alUicuh1Js8juYlaHRyx57lRKt2qsDLFaRqWm6pewsS4E9aA7CrnRYK9XDk2pXSLm3cwzcKHkqyOuF8mm8xAt_16nTFwqx-GdH_utatVkr-UZcOjiOgppF4EawItJdkmlFg4NLfrrVG0peAg0HyFbqoNHtp_jgRFteFFBoz8UNizq79qJShPjRpjBL0Srk9FKg-5qvn-v45TBIMn4O5HTCAX"
            />
          </div>
        </div>
      </header>

      {/* Fixtures predict controls content */}
      <main className="container mx-auto px-6 pt-24 max-w-3xl flex flex-col gap-8">
        
        {/* Match Header Information Card */}
        <section className="animate-fade-in stagger-1">
          <div className="surface-glass-1 rounded-lg p-5 flex flex-col items-center gap-5 relative overflow-hidden text-center shadow-lg">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--color-primary),transparent_70%)]" />
            
            {/* Teams Grid */}
            <div className="flex justify-between items-center w-full max-w-md z-10">
              <div className="flex flex-col items-center gap-1.5 w-1/3">
                {getFlag(match.teamHome) ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg select-none border-2 border-white/10">
                    <img src={getFlag(match.teamHome)!} alt={match.teamHome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center headline-md font-extrabold shadow-lg select-none ${homeStyle.bgClass} ${homeStyle.textClass}`}>
                    {homeStyle.code}
                  </div>
                )}
                <span className="label-md uppercase tracking-wider text-white text-center mt-1.5 break-words w-full">{match.teamHome}</span>
              </div>

              <div className="flex flex-col items-center gap-1 w-1/3">
                <span className="font-headline-lg text-headline-lg text-primary font-bold">VS</span>
                <div className="px-3 py-1 bg-surface-container rounded-md text-label-sm text-on-surface-variant font-bold border border-white/5 select-none text-center text-xs">
                  {kickoffText}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 w-1/3">
                {getFlag(match.teamAway) ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg select-none border-2 border-white/10">
                    <img src={getFlag(match.teamAway)!} alt={match.teamAway} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center headline-md font-extrabold shadow-lg select-none ${awayStyle.bgClass} ${awayStyle.textClass}`}>
                    {awayStyle.code}
                  </div>
                )}
                <span className="label-md uppercase tracking-wider text-white text-center mt-1.5 break-words w-full">{match.teamAway}</span>
              </div>
            </div>

            {/* Countdown Urgency Strip */}
            <div className={`w-full max-w-md px-4 py-2.5 rounded-md border-2 flex items-center justify-between z-10 select-none ${
              hasClosed ? "border-white/10 bg-white/5" : "border-error/80 pulse-red bg-error-container/10"
            }`}>
              <span className={`font-label-md flex items-center gap-1.5 uppercase font-bold text-xs ${hasClosed ? "text-on-surface-variant" : "text-error"}`}>
                <Timer className="w-4.5 h-4.5" />
                {hasClosed ? "Predictions Closed" : "Closes in"}
              </span>
              <span className={`headline-md font-bold font-mono tracking-wide ${hasClosed ? "text-on-surface-variant" : "text-error"}`}>
                {hasClosed ? "00:00" : (countdown !== null ? formatCountdown(countdown) : "--:--")}
              </span>
            </div>
          </div>
        </section>

        {/* Prediction Questions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* 1. Winner Selection widget */}
          <div className="animate-fade-in stagger-2 md:col-span-12 lg:col-span-4 flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant px-1 flex items-center gap-1.5 font-semibold text-left select-none text-xs">
              <SoccerBallIcon className="w-4 h-4 text-outline" />
              MATCH WINNER <span className="text-white/25 font-normal">(Optional)</span>
            </label>
            <div className="surface-glass-1 rounded-lg p-4 flex flex-col gap-3 h-full justify-between">
              <button
                type="button"
                disabled={hasClosed}
                onClick={() => setWinner("home")}
                className={`w-full p-4 rounded-md flex items-center justify-between group transition-all duration-base cursor-pointer ${
                  winner === "home" ? "bg-primary/10 border border-primary" : "surface-glass-1 hover:bg-surface-variant/40"
                } ${hasClosed ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="headline-md font-semibold text-sm">{match.teamHome}</span>
                <CheckCircle2 className={`w-5 h-5 text-primary transition-opacity ${winner === "home" ? "opacity-100" : "opacity-0"}`} />
              </button>

              <button
                type="button"
                disabled={hasClosed}
                onClick={() => setWinner("draw")}
                className={`w-full p-4 rounded-md flex items-center justify-between group transition-all duration-base cursor-pointer ${
                  winner === "draw" ? "bg-primary/10 border border-primary" : "surface-glass-1 hover:bg-surface-variant/40"
                } ${hasClosed ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="headline-md font-semibold text-on-surface-variant text-sm">Draw</span>
                <CheckCircle2 className={`w-5 h-5 text-primary transition-opacity ${winner === "draw" ? "opacity-100" : "opacity-0"}`} />
              </button>

              <button
                type="button"
                disabled={hasClosed}
                onClick={() => setWinner("away")}
                className={`w-full p-4 rounded-md flex items-center justify-between group transition-all duration-base cursor-pointer ${
                  winner === "away" ? "bg-primary/10 border border-primary" : "surface-glass-1 hover:bg-surface-variant/40"
                } ${hasClosed ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="headline-md font-semibold text-sm">{match.teamAway}</span>
                <CheckCircle2 className={`w-5 h-5 text-primary transition-opacity ${winner === "away" ? "opacity-100" : "opacity-0"}`} />
              </button>
            </div>
          </div>

          {/* 2. Top Scorer widget */}
          <div className={`animate-fade-in stagger-3 md:col-span-12 lg:col-span-4 flex flex-col gap-2 relative ${dropdownOpen ? "z-30" : "z-10"}`}>
            <label className="text-label-md text-on-surface-variant px-1 flex items-center gap-1.5 font-semibold text-left select-none text-xs">
              <User className="w-4 h-4 text-outline" />
              MAN OF THE MATCH <span className="text-white/25 font-normal">(Optional)</span>
            </label>
            <div className="surface-glass-1 rounded-lg p-4 flex flex-col gap-4 h-full relative">
              <div className="relative">
                <input
                  type="text"
                  disabled={hasClosed}
                  value={topScorer}
                  onChange={(e) => {
                    setTopScorer(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (!hasClosed) setDropdownOpen(true);
                  }}
                  onBlur={() => {
                    // Slight delay to allow clicking items in dropdown
                    setTimeout(() => setDropdownOpen(false), 200);
                  }}
                  placeholder="Type or select player..."
                  className={`w-full bg-surface-container-lowest border border-outline-variant rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary outline-none body-lg placeholder:text-on-surface-variant/40 transition-all text-left text-sm ${
                    hasClosed ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              {/* Squad suggestion helper info */}
              <p className="text-[10px] text-white/30 text-left -mt-2">
                Type any player name directly if they aren't shown in the suggestions.
              </p>

              {/* Squad Dropdown Autocomplete */}
              {dropdownOpen && squadPlayers.length > 0 && !hasClosed && (
                <div
                  className="absolute left-4 right-4 top-[102px] bg-[#101015] border border-white/10 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto"
                  style={{ backdropFilter: "blur(20px)" }}
                >
                  {/* Option to use custom typed text if not empty */}
                  {topScorer.trim() !== "" && (
                    <div
                      onMouseDown={() => {
                        setTopScorer(topScorer.trim());
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 border-b border-white/5 cursor-pointer transition-colors text-left"
                    >
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white/95">Use "{topScorer.trim()}"</span>
                        <span className="text-[10px] text-white/40 font-medium">Predict custom player name</span>
                      </div>
                    </div>
                  )}

                  {squadPlayers.filter(p => p.name.toLowerCase().includes(topScorer.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-xs text-white/40 text-center select-none">
                      No matching squad players. Press Enter or click the "Use" button above to submit this custom name.
                    </div>
                  ) : (
                    squadPlayers
                      .filter(p => p.name.toLowerCase().includes(topScorer.toLowerCase()))
                      .map((player) => {
                        const flag = getFlag(player.teamName);
                        return (
                          <div
                            key={player.name}
                            onMouseDown={() => {
                              setTopScorer(player.name);
                              setDropdownOpen(false);
                            }}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors text-left"
                          >
                            <span className="text-sm font-semibold text-white/95">{player.name}</span>
                            <div className="flex items-center gap-1.5">
                              {flag && (
                                <img
                                  src={flag}
                                  alt={player.teamName}
                                  className="w-4 h-3.5 object-cover rounded-sm opacity-80"
                                />
                              )}
                              <span className="text-[10px] text-white/40 uppercase font-medium">{player.teamName}</span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* Suggestions Chips (using top star players from the squad) */}
              <div className="flex flex-wrap gap-2 pt-1 select-none">
                {squadPlayers.slice(0, 5).map((player) => (
                  <button
                    type="button"
                    key={player.name}
                    disabled={hasClosed}
                    onClick={() => handleScorerChipClick(player.name)}
                    className={`px-3 py-1 bg-surface-container rounded-full text-xs border border-outline-variant/30 cursor-pointer hover:border-primary hover:text-primary transition-all duration-base text-on-surface ${
                      hasClosed ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Exact Score line counter steppers */}
          <div className="animate-fade-in stagger-4 md:col-span-12 lg:col-span-4 flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant px-1 flex items-center gap-1.5 font-semibold text-left select-none text-xs">
              <Trophy className="w-4 h-4 text-outline" />
              EXACT SCORELINE <span className="text-primary font-bold">*</span>
            </label>
            <div className="surface-glass-1 rounded-lg p-4 flex items-center justify-center gap-6 h-full min-h-[160px]">
              
              {/* Home Team Score Counter */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={hasClosed}
                  onClick={() => handleScoreStep("home", 1)}
                  className={`w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 cursor-pointer text-on-surface ${
                    hasClosed ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <span className="font-display-lg text-display-lg tabular-nums text-white select-none text-3xl font-bold">{scoreHome}</span>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-1">{match.teamHome.substring(0, 3)}</span>
                <button
                  type="button"
                  disabled={hasClosed}
                  onClick={() => handleScoreStep("home", -1)}
                  className={`w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 cursor-pointer text-on-surface ${
                    hasClosed ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>

              <div className="font-display-lg text-display-lg text-on-surface-variant/20 select-none text-3xl">-</div>

              {/* Away Team Score Counter */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  disabled={hasClosed}
                  onClick={() => handleScoreStep("away", 1)}
                  className={`w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 cursor-pointer text-on-surface ${
                    hasClosed ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <span className="font-display-lg text-display-lg tabular-nums text-white select-none text-3xl font-bold">{scoreAway}</span>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-1">{match.teamAway.substring(0, 3)}</span>
                <button
                  type="button"
                  disabled={hasClosed}
                  onClick={() => handleScoreStep("away", -1)}
                  className={`w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 cursor-pointer text-on-surface ${
                    hasClosed ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        </section>

        {errorMessage && (
          <div className="bg-error/15 border border-error/30 text-error px-4 py-3 rounded-lg text-center text-sm font-semibold animate-shake">
            {errorMessage}
          </div>
        )}
      </main>

      {/* Bottom Floating Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-t border-white/10 p-6 flex justify-center items-center h-24">
        {hasClosed ? (
          <div className="w-full max-w-md h-14 bg-white/5 border border-white/10 text-on-surface-variant rounded-md flex items-center justify-center font-bold text-sm">
            Predictions closed for this fixture
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitStatus !== "idle"}
            className={`group relative w-full max-w-md h-14 bg-gradient-to-r from-primary-container to-inverse-primary rounded-md overflow-hidden transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg select-none ${
              submitStatus !== "idle" ? "pointer-events-none" : "hover:brightness-105"
            }`}
          >
            {submitStatus === "idle" && (
              <>
                <span className="font-headline-md text-on-primary-container text-base font-bold">Submit Prediction</span>
                <Send className="w-5 h-5 text-on-primary-container" />
              </>
            )}

            {submitStatus === "submitting" && (
              <div className="flex items-center gap-2">
                <span className="font-headline-md text-on-primary-container text-base font-bold">Submitting...</span>
                <div className="w-5 h-5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Success morphing overlay */}
            <div
              className={`absolute inset-0 bg-secondary flex items-center justify-center transition-all duration-500 rounded-md ${
                submitStatus === "success" ? "opacity-100 scale-100" : "opacity-0 scale-150 pointer-events-none"
              }`}
            >
              <Check className="w-8 h-8 text-on-secondary font-bold" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

