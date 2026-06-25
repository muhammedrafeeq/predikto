"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Timer, CheckCircle2, Search, Plus, Minus, Send, Check, User, Trophy } from "lucide-react";

interface PredictPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

const SoccerBallIcon = ({ className = "w-6 h-6 text-primary" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" /><path d="M12 22v-3" />
    <path d="M10 5 6 8.5" /><path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" /><path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" /><path d="M16.5 13 12 15" />
    <path d="M12 15v4" /><path d="M12 22 8.5 19.5" /><path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" /><path d="M16.5 13H20" />
  </svg>
);

const COUNTRY_FLAGS: Record<string, string> = {
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch", "brazil": "br", "morocco": "ma", "haiti": "ht",
  "scotland": "gb-sct", "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  "germany": "de", "curaçao": "cw", "curacao": "cw", "ivory coast": "ci", "ecuador": "ec",
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn", "belgium": "be",
  "egypt": "eg", "iran": "ir", "new zealand": "nz", "spain": "es", "cape verde": "cv",
  "saudi arabia": "sa", "uruguay": "uy", "france": "fr", "senegal": "sn", "iraq": "iq",
  "norway": "no", "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co", "england": "gb-eng",
  "croatia": "hr", "ghana": "gh", "panama": "pa", "korea republic": "kr", "czechia": "cz",
  "chile": "cl", "peru": "pe", "serbia": "rs", "cameroon": "cm", "nigeria": "ng",
  "thailand": "th", "slovakia": "sk", "venezuela": "ve", "cuba": "cu",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

interface Question {
  id: number;
  type: "winner" | "score" | "man_of_match";
  label: string;
  points: number;
}

export default function ContestPredictPage({ params }: PredictPageProps) {
  const router = useRouter();
  const { id: cid, matchId: mid } = use(params);
  const contestId = parseInt(cid, 10);
  const matchId = parseInt(mid, 10);

  // States
  const [match, setMatch] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [squadPlayers, setSquadPlayers] = useState<{ name: string; teamName: string; is_star: boolean }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Selections
  const [winner, setWinner] = useState<"home" | "draw" | "away" | null>(null);
  const [topScorer, setTopScorer] = useState("");
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);

  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/contests/${contestId}/predict/${matchId}`);
        if (!res.ok) {
          router.push(`/contests/${contestId}`);
          return;
        }

        const data = await res.json();
        if (data.success) {
          setMatch(data.match);
          setQuestions(data.questions);
          setSquadPlayers(data.players || []);

          const deadlineTime = new Date(data.match.deadline).getTime();
          const secondsLeft = Math.max(0, Math.floor((deadlineTime - Date.now()) / 1000));
          setCountdown(secondsLeft);

          // Populate existing predictions
          if (data.predictions) {
            const preds = data.predictions;
            if (preds.winner) {
              if (preds.winner.answer === data.match.teamHome) setWinner("home");
              else if (preds.winner.answer === data.match.teamAway) setWinner("away");
              else if (preds.winner.answer === "Draw") setWinner("draw");
            }
            if (preds.man_of_match) {
              setTopScorer(preds.man_of_match.answer);
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
        console.error("Error loading predictions screen:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contestId, matchId, router]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Auto-select winner based on scores
  useEffect(() => {
    if (loading) return;
    if (scoreHome > scoreAway) {
      setWinner("home");
    } else if (scoreHome < scoreAway) {
      setWinner("away");
    } else {
      setWinner("draw");
    }
  }, [scoreHome, scoreAway, loading]);

  const formatCountdown = (secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleScoreStep = (team: "home" | "away", delta: number) => {
    if (team === "home") {
      setScoreHome((prev) => Math.max(0, Math.min(9, prev + delta)));
    } else {
      setScoreAway((prev) => Math.max(0, Math.min(9, prev + delta)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const scoreQ = questions.find(q => q.type === "score");
    if (!scoreQ) {
      setErrorMessage("Score question configuration error.");
      return;
    }

    setSubmitStatus("submitting");

    try {
      const preds: { questionId: number; answer: string }[] = [];
      preds.push({ questionId: scoreQ.id, answer: `${scoreHome}-${scoreAway}` });

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

      if (topScorer.trim()) {
        const motmQ = questions.find(q => q.type === "man_of_match");
        if (motmQ) preds.push({ questionId: motmQ.id, answer: topScorer.trim() });
      }

      const res = await fetch(`/api/contests/${contestId}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, predictions: preds })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Submission failed");
      }

      setSubmitStatus("success");
      setTimeout(() => {
        router.push(`/contests/${contestId}`);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit prediction.");
      setSubmitStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-bg text-on-surface bg-pitch">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Fixture Predictor...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-bg text-on-surface p-6 text-center">
        <p className="text-lg text-red-400 font-semibold">Fixture details missing.</p>
        <button onClick={() => router.push(`/contests/${contestId}`)} className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold">
          Return to Contest
        </button>
      </div>
    );
  }

  const hasClosed = countdown !== null && countdown <= 0;

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-32 bg-pitch overflow-x-hidden">
      
      {/* AppBar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-sm tracking-wide">
          Predict Match
        </h1>
        <div className="w-16" />
      </header>

      {/* Main Grid */}
      <main className="container mx-auto px-6 pt-20 max-w-lg flex flex-col gap-6">
        
        {/* Match Card Detail */}
        <section className="mt-2">
          <div className="surface-glass-1 rounded-2xl p-5 flex flex-col items-center gap-4 border border-white/5 text-center shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-center gap-1 w-1/3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex items-center justify-center">
                  {getFlag(match.teamHome) ? (
                    <img src={getFlag(match.teamHome)!} alt={match.teamHome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-sm">{match.teamHome.substring(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <span className="label-md font-bold text-xs uppercase mt-1 truncate w-full text-center">{match.teamHome}</span>
              </div>

              <div className="flex flex-col items-center gap-1 w-1/3">
                <span className="font-headline-md text-primary font-black">VS</span>
                <span className="text-[9px] font-bold text-white/30 truncate">
                  {new Date(match.matchTime).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 w-1/3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex items-center justify-center">
                  {getFlag(match.teamAway) ? (
                    <img src={getFlag(match.teamAway)!} alt={match.teamAway} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-sm">{match.teamAway.substring(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <span className="label-md font-bold text-xs uppercase mt-1 truncate w-full text-center">{match.teamAway}</span>
              </div>
            </div>

            {/* Countdown Strip */}
            <div className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between z-10 ${
              hasClosed ? "border-white/5 bg-white/2 text-white/30" : "border-red-500/30 bg-red-500/5 text-red-400"
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-4 h-4" /> {hasClosed ? "Closed" : "Timer"}
              </span>
              <span className="text-sm font-black font-mono">
                {hasClosed ? "Closed" : (countdown !== null ? formatCountdown(countdown) : "--:--")}
              </span>
            </div>
          </div>
        </section>

        {/* 1. Scoreline */}
        <section className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-1">
            Exact Scoreline <span className="text-primary font-bold">*</span>
          </label>
          <div className="surface-glass-1 border border-white/5 rounded-2xl p-5 flex items-center justify-center gap-6">
            {/* Home score */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={hasClosed}
                onClick={() => handleScoreStep("home", 1)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-4xl font-black font-mono text-white select-none">{scoreHome}</span>
              <button
                type="button"
                disabled={hasClosed}
                onClick={() => handleScoreStep("home", -1)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            <span className="text-white/20 text-3xl font-black font-mono">–</span>

            {/* Away score */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={hasClosed}
                onClick={() => handleScoreStep("away", 1)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-4xl font-black font-mono text-white select-none">{scoreAway}</span>
              <button
                type="button"
                disabled={hasClosed}
                onClick={() => handleScoreStep("away", -1)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 2. Winner */}
        <section className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-1">
            Winner <span className="text-white/20 font-normal">(Optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "home", label: match.teamHome },
              { id: "draw", label: "Draw" },
              { id: "away", label: match.teamAway }
            ].map((opt) => {
              const active = winner === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={hasClosed}
                  onClick={() => setWinner(active ? null : opt.id as any)}
                  className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    active 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5"
                  } disabled:opacity-40`}
                >
                  {opt.label.length > 10 ? opt.label.substring(0, 8) + "." : opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Scorer */}
        <section className="flex flex-col gap-2 relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-white/40 px-1">
            Man of the Match <span className="text-white/20 font-normal">(Optional)</span>
          </label>
          <div className="surface-glass-1 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative">
            <div className="relative">
              <input
                type="text"
                disabled={hasClosed}
                placeholder="Type or select Man of the Match..."
                value={topScorer}
                onChange={(e) => { setTopScorer(e.target.value); setDropdownOpen(true); }}
                onFocus={() => { if (!hasClosed) setDropdownOpen(true); }}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-white/20"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            </div>

            {/* Suggestions Dropdown */}
            {dropdownOpen && squadPlayers.length > 0 && !hasClosed && (
              <div className="absolute left-4 right-4 top-16 bg-[#101015] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {topScorer.trim() !== "" && (
                  <div
                    onMouseDown={() => { setTopScorer(topScorer.trim()); setDropdownOpen(false); }}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer border-b border-white/5 flex items-center gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" /> Use "{topScorer.trim()}"
                  </div>
                )}
                {squadPlayers.filter(p => p.name.toLowerCase().includes(topScorer.toLowerCase())).map((p) => (
                  <div
                    key={p.name}
                    onMouseDown={() => { setTopScorer(p.name); setDropdownOpen(false); }}
                    className="px-4 py-2 hover:bg-white/5 cursor-pointer text-xs text-white/80 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1">{p.is_star && <span className="text-amber-400 text-[10px]">⭐</span>}{p.name}</span>
                    <span className="text-[8px] uppercase tracking-wider text-white/30">{p.teamName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Star player cards */}
            {(() => {
              const homePlayers = squadPlayers
                .filter(p => p.teamName.toLowerCase() === match.teamHome.toLowerCase() && p.is_star)
                .slice(0, 4);
              const awayPlayers = squadPlayers
                .filter(p => p.teamName.toLowerCase() === match.teamAway.toLowerCase() && p.is_star)
                .slice(0, 4);
              const displayPlayers = [...homePlayers, ...awayPlayers];
              if (displayPlayers.length === 0) return null;
              return (
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/70 flex items-center gap-1">⭐ Key Players</span>
                  <div className="grid grid-cols-2 gap-2">
                    {displayPlayers.map((player) => {
                      const displayName = player.name;
                      const isSelected = topScorer === player.name;
                      return (
                        <button
                          type="button"
                          key={player.name}
                          disabled={hasClosed}
                          onPointerDown={(e) => { e.preventDefault(); setTopScorer(player.name); setDropdownOpen(false); }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                            isSelected
                              ? "bg-amber-400/15 border-amber-400/40"
                              : "bg-white/3 border-white/8 hover:border-amber-400/30 hover:bg-amber-400/8"
                          } ${hasClosed ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span className={`text-xs font-bold leading-tight truncate ${isSelected ? "text-amber-300" : "text-white/90"} flex items-center gap-1 w-full`}>
                            <span className="truncate">{displayName}</span>
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-2.5 rounded-xl text-center text-xs font-semibold">
            {errorMessage}
          </div>
        )}
      </main>

      {/* Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-t border-white/10 p-5 flex justify-center items-center h-22">
        {hasClosed ? (
          <div className="w-full max-w-md h-12 bg-white/5 border border-white/10 text-white/30 rounded-xl flex items-center justify-center font-bold text-xs">
            Predictions closed
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitStatus !== "idle"}
            className="group relative w-full max-w-md h-12 bg-gradient-to-r from-primary-container to-primary text-on-primary-container rounded-xl overflow-hidden active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-black text-xs uppercase tracking-wider shadow-lg"
          >
            {submitStatus === "idle" && (
              <>
                <span>Lock In Predictions</span>
                <Send className="w-4 h-4" />
              </>
            )}
            {submitStatus === "submitting" && (
              <div className="flex items-center gap-1.5">
                <span>Submitting...</span>
                <div className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className={`absolute inset-0 bg-secondary flex items-center justify-center transition-all duration-500 rounded-xl ${
              submitStatus === "success" ? "opacity-100 scale-100" : "opacity-0 scale-150 pointer-events-none"
            }`}>
              <Check className="w-5 h-5 text-on-secondary font-black" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
