"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, User, ChevronDown, HelpCircle, Search } from "lucide-react";

type GamePhase = "loading" | "playing" | "correct" | "gameover" | "already_played";

interface ClueCardProps {
  clue: string;
  number: number;
  revealed: boolean;
  active: boolean;
}

function ClueCard({ clue, number, revealed, active }: ClueCardProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 transition-all duration-500 ${
        active
          ? "border-[#c3f400]/60 bg-[#c3f400]/10 shadow-[0_0_20px_rgba(195,244,0,0.15)] scale-[1.01]"
          : revealed
          ? "border-white/15 glass-card"
          : "border-white/5 bg-white/2 opacity-30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-label-mono font-bold shrink-0 mt-0.5 ${
          active ? "bg-[#c3f400] text-[#161e00] shadow-[0_0_10px_rgba(195,244,0,0.5)]" : revealed ? "bg-white/10 text-[#c3f400] border border-white/10" : "bg-white/5 text-white/20"
        }`}>
          {number}
        </div>
        <p className={`text-sm leading-relaxed font-medium ${active ? "text-white font-bold" : revealed ? "text-[#c4c9ac]" : "text-white/30"}`}>
          {revealed ? clue : "???"}
        </p>
      </div>
    </div>
  );
}

const POINTS_BY_CLUE: Record<number, number> = { 1: 15, 2: 12, 3: 9, 4: 6, 5: 3, 6: 1 };

export default function WhoAmIPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [clues, setClues] = useState<string[]>([]);
  const [cluesMl, setCluesMl] = useState<string[]>([]);
  const [lang, setLang] = useState<"en" | "ml">("en");
  const [cluesRevealed, setCluesRevealed] = useState(1);
  const [guess, setGuess] = useState("");
  const [guessError, setGuessError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [alreadyData, setAlreadyData] = useState<{ points: number; cluesRevealed: number; correct: boolean; playerName: string } | null>(null);
  const [requestingClue, setRequestingClue] = useState(false);
  const [clueCooldown, setClueCooldown] = useState(0);
  const [playerSuggestions, setPlayerSuggestions] = useState<{ name: string; teamName: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games/who-am-i");
        if (res.ok) {
          const data = await res.json();
          setClues(data.clues ?? []);
          setCluesMl(data.cluesMl ?? []);
          if (data.played) {
            setAlreadyData({
              points: data.points,
              cluesRevealed: data.cluesRevealed,
              correct: data.correct,
              playerName: data.playerName,
            });
            setPhase("already_played");
          } else {
            setCluesRevealed(1);
            setPhase("playing");
          }
        }
      } catch {
        setPhase("playing");
      }
    })();
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [phase, cluesRevealed]);

  const handleGuess = async () => {
    if (!guess.trim() || submitting) return;
    setSubmitting(true);
    setGuessError("");
    try {
      const res = await fetch("/api/games/who-am-i", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: guess.trim(), cluesRevealed }),
      });
      const data = await res.json();
      setPlayerName(data.playerName ?? guess.trim());

      if (data.correct) {
        setPointsEarned(data.pointsEarned ?? POINTS_BY_CLUE[cluesRevealed] ?? 1);
        setPhase("correct");
      } else {
        if (cluesRevealed >= 6) {
          setPhase("gameover");
        } else {
          setGuessError(data.error ?? "Incorrect! Try another clue or guess again.");
          setGuess("");
        }
      }
    } catch {
      setGuessError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startCooldown = () => {
    setClueCooldown(5);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setClueCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestClue = () => {
    if (cluesRevealed >= 6 || clueCooldown > 0) return;
    setRequestingClue(true);
    setGuessError("");
    setGuess("");
    setTimeout(() => {
      setCluesRevealed((c) => Math.min(6, c + 1));
      setRequestingClue(false);
      startCooldown();
    }, 300);
  };

  // cleanup on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleGuessChange = (val: string) => {
    setGuess(val);
    setGuessError("");
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (val.trim().length < 2) {
      setPlayerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/players?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setPlayerSuggestions(data.players || []);
          setShowSuggestions((data.players || []).length > 0);
        }
      } catch {}
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      handleGuess();
    }
  };

  // LOADING
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#c3f400] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(195,244,0,0.5)]" />
        <span className="mt-4 font-label-caps text-xs text-[#c3f400] tracking-widest uppercase">LOADING MYSTERY PLAYER...</span>
      </div>
    );
  }

  // ALREADY PLAYED
  if (phase === "already_played" && alreadyData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 items-center justify-center px-4">
        <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
          <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
            <button
              onClick={() => router.push("/games")}
              className="active:scale-95 transition-transform flex items-center gap-2 cursor-pointer text-[#c4c9ac] hover:text-[#c3f400]"
            >
              <ArrowLeft className="w-5 h-5 text-[#c3f400]" />
              <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold">
                BACK
              </span>
            </button>
            <span className="font-label-caps text-sm text-white font-bold tracking-widest uppercase">WHO AM I?</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="w-full max-w-sm glass-card border border-white/15 p-6 rounded-3xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#c3f400]/15 border border-[#c3f400]/30 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#c3f400]" />
          </div>
          <h2 className="font-headline-md text-2xl text-white mb-1 uppercase tracking-wider">
            {alreadyData.correct ? "Great guess earlier!" : "Already Played Today"}
          </h2>
          <p className="text-[#c4c9ac] text-xs mb-2">Today&apos;s mystery player was:</p>
          <p className="text-2xl font-black text-[#c3f400] mb-4 uppercase font-label-caps">{alreadyData.playerName}</p>
          <p className="text-[#c4c9ac] text-xs font-label-mono mb-4">Clues revealed: {alreadyData.cluesRevealed} of 6</p>
          {alreadyData.points > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c3f400]/10 border border-[#c3f400]/30 text-[#c3f400]">
              <Trophy className="w-4 h-4 text-[#c3f400]" />
              <span className="font-label-caps font-bold text-sm">{alreadyData.points} PTS EARNED</span>
            </div>
          ) : (
            <p className="text-[#c4c9ac] text-sm">Better luck tomorrow!</p>
          )}

          <button
            onClick={() => router.push("/games")}
            className="w-full mt-6 py-3.5 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(195,244,0,0.3)]"
          >
            Back to Games Hub
          </button>
        </div>
      </div>
    );
  }

  // CORRECT ANSWER
  if (phase === "correct") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 items-center justify-center px-4 overflow-hidden">
        <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
          <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
            <button
              onClick={() => router.push("/games")}
              className="active:scale-95 transition-transform flex items-center gap-2 cursor-pointer text-[#c4c9ac] hover:text-[#c3f400]"
            >
              <ArrowLeft className="w-5 h-5 text-[#c3f400]" />
              <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold">
                BACK
              </span>
            </button>
            <span className="font-label-caps text-sm text-white font-bold tracking-widest uppercase">CORRECT ANSWER</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="w-full max-w-sm glass-card border border-[#c3f400]/30 p-6 rounded-3xl text-center shadow-[0_0_40px_rgba(195,244,0,0.2)]">
          <div className="w-20 h-20 rounded-full bg-[#c3f400]/20 border-2 border-[#c3f400] flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(195,244,0,0.4)] animate-bounce">
            <User className="w-10 h-10 text-[#c3f400]" />
          </div>

          <h2 className="font-headline-md text-3xl text-white mb-2 uppercase tracking-wider">Correct! 🎉</h2>
          <p className="text-[#c3f400] text-2xl font-black mb-1 uppercase font-label-caps">{playerName}</p>
          <p className="text-[#c4c9ac] text-xs font-label-mono mb-6">Identified with {cluesRevealed} clue{cluesRevealed > 1 ? "s" : ""}</p>

          <div className="flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-[#c3f400]/10 border border-[#c3f400]/30 mb-6">
            <Trophy className="w-6 h-6 text-[#c3f400]" />
            <span className="text-[#c3f400] font-display-score text-3xl">{pointsEarned} PTS</span>
          </div>

          <button onClick={() => router.push("/games")} className="w-full py-4 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(195,244,0,0.3)]">
            Back to Games Hub
          </button>
        </div>
      </div>
    );
  }

  // GAME OVER
  if (phase === "gameover") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 items-center justify-center px-4">
        <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
          <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
            <button
              onClick={() => router.push("/games")}
              className="active:scale-95 transition-transform flex items-center gap-2 cursor-pointer text-[#c4c9ac] hover:text-[#c3f400]"
            >
              <ArrowLeft className="w-5 h-5 text-[#c3f400]" />
              <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold">
                BACK
              </span>
            </button>
            <span className="font-label-caps text-sm text-white font-bold tracking-widest uppercase">GAME OVER</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="w-full max-w-sm glass-card border border-rose-500/30 p-6 rounded-3xl text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5">
            <HelpCircle className="w-10 h-10 text-rose-400" />
          </div>

          <h2 className="font-headline-md text-3xl text-white mb-2 uppercase tracking-wider">Not this time!</h2>
          <p className="text-[#c4c9ac] text-xs mb-2">Today&apos;s mystery player was:</p>
          <p className="text-2xl font-black text-[#c3f400] mb-6 uppercase font-label-caps">{playerName}</p>

          <button onClick={() => router.push("/games")} className="w-full py-4 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(195,244,0,0.3)]">
            Back to Games Hub
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE PLAYING GAME
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 selection:bg-[#c3f400] selection:text-[#161e00]">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
        <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
          <button onClick={() => router.push("/games")} className="active:scale-95 transition-transform flex items-center gap-2 cursor-pointer text-[#c4c9ac] hover:text-[#c3f400]">
            <ArrowLeft className="w-5 h-5 text-[#c3f400]" />
            <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold">
              QUIT
            </span>
          </button>

          <div className="font-label-caps text-[14px] text-white tracking-widest font-bold uppercase flex items-center gap-2">
            <User className="w-4 h-4 text-[#c3f400]" />
            WHO AM I?
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === "en" ? "ml" : "en")}
              className="text-xs font-label-caps font-bold px-2.5 py-1 rounded-full border border-[#00e3fd]/30 text-[#00e3fd] bg-[#00e3fd]/10"
            >
              {lang === "en" ? "മല" : "EN"}
            </button>
            <div className="bg-[#c3f400]/10 px-3 py-1 rounded-full border border-[#c3f400]/30 text-[#c3f400] font-label-caps text-xs font-bold">
              {cluesRevealed}/6 CLUES
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Mystery Silhouette */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-[#c3f400]/40 bg-[#c3f400]/10 flex items-center justify-center mb-2 relative shadow-[0_0_25px_rgba(195,244,0,0.2)]">
            <User className="w-10 h-10 text-[#c3f400]" />
            <div className="absolute inset-0 rounded-full border border-[#c3f400]/30 animate-ping opacity-30" />
          </div>
          <p className="text-[#c4c9ac] text-xs font-label-caps uppercase tracking-widest">Mystery Player</p>
        </div>

        {/* Points preview */}
        <div className="flex gap-1.5 mb-5 justify-center">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border transition-all ${
                n === cluesRevealed
                  ? "border-[#c3f400] bg-[#c3f400]/15 shadow-[0_0_10px_rgba(195,244,0,0.2)]"
                  : n < cluesRevealed
                  ? "border-white/10 glass-card opacity-60"
                  : "border-white/5 bg-white/2 opacity-30"
              }`}
            >
              <span className="text-[9px] text-[#c4c9ac] font-bold font-label-mono">C{n}</span>
              <span className={`text-xs font-bold font-label-mono ${n === cluesRevealed ? "text-[#c3f400]" : "text-white/30"}`}>
                {POINTS_BY_CLUE[n]}pt
              </span>
            </div>
          ))}
        </div>

        {/* Clue cards */}
        <div className="space-y-3.5 mb-6">
          {clues.slice(0, 6).map((clue, i) => {
            const mlClue = cluesMl[i];
            const displayClue = lang === "ml" && mlClue ? mlClue : clue;
            return (
              <div key={i}>
                <ClueCard
                  clue={displayClue}
                  number={i + 1}
                  revealed={i < cluesRevealed}
                  active={i === cluesRevealed - 1}
                />
              </div>
            );
          })}
        </div>

        {/* Guess input */}
        <div className="sticky bottom-4 bg-[#0A0A0A] pt-2 border-t border-white/10">
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c3f400] pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => handleGuessChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (guess.length >= 2) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search player name..."
                className="w-full glass-card border border-white/15 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder-[#c4c9ac]/50 text-sm font-medium outline-none focus:border-[#c3f400] focus:ring-1 focus:ring-[#c3f400]/40 transition-all"
                disabled={submitting}
              />
              {/* Autocomplete dropdown */}
              {showSuggestions && playerSuggestions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 right-0 glass-card border border-white/15 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto bg-[#131313]">
                  {playerSuggestions.map((p) => (
                    <div
                      key={p.name}
                      onMouseDown={() => { setGuess(p.name); setShowSuggestions(false); setGuessError(""); }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="text-sm font-bold text-white">{p.name}</span>
                      <span className="text-[10px] text-[#c3f400] uppercase font-label-mono font-bold">{p.teamName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowSuggestions(false); handleGuess(); }}
              disabled={!guess.trim() || submitting}
              className="px-5 py-3.5 rounded-2xl bg-[#c3f400] text-[#161e00] font-label-caps font-bold text-xs uppercase tracking-wider hover:bg-[#b5e300] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(195,244,0,0.3)]"
            >
              {submitting ? "..." : "Guess"}
            </button>
          </div>

          {guessError && (
            <p className="text-rose-400 font-bold text-xs mt-2 px-1 text-center bg-rose-500/10 border border-rose-500/20 py-1.5 rounded-xl">{guessError}</p>
          )}

          {cluesRevealed < 6 && (
            <button
              onClick={handleRequestClue}
              disabled={requestingClue || submitting || clueCooldown > 0}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl glass-card border border-white/15 text-[#c4c9ac] text-xs font-label-caps font-bold hover:border-[#c3f400]/40 hover:text-white disabled:opacity-40 transition-all relative overflow-hidden"
            >
              {clueCooldown > 0 ? (
                <>
                  <span className="font-bold text-[#c3f400]">{clueCooldown}s</span>
                  <span className="text-[#c4c9ac]">COOLDOWN FOR NEXT CLUE...</span>
                </>
              ) : (
                <>
                  <ChevronDown className={`w-4 h-4 text-[#c3f400] ${requestingClue ? "animate-bounce" : ""}`} />
                  REVEAL NEXT CLUE
                  <span className="text-[#c3f400]">(−{POINTS_BY_CLUE[cluesRevealed] - (POINTS_BY_CLUE[cluesRevealed + 1] ?? 0)} PTS)</span>
                </>
              )}
            </button>
          )}

          {cluesRevealed >= 6 && (
            <p className="text-white/25 text-xs text-center mt-2">All clues revealed — this is your final guess!</p>
          )}
        </div>
      </main>
    </div>
  );
}
