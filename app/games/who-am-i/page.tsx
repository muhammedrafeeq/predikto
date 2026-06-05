"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, User, ChevronDown, HelpCircle } from "lucide-react";

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
      className={`rounded-xl border px-4 py-3 transition-all duration-500 ${
        active
          ? "border-teal-400/40 bg-teal-400/8 scale-[1.01]"
          : revealed
          ? "border-white/10 bg-white/4"
          : "border-white/5 bg-white/2 opacity-30"
      }`}
      style={{
        transform: active ? "scale(1.01)" : "scale(1)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
          active ? "bg-teal-400/20 text-teal-400 border border-teal-400/30" : revealed ? "bg-white/8 text-white/40 border border-white/10" : "bg-white/4 text-white/20 border border-white/8"
        }`}>
          {number}
        </div>
        <p className={`text-sm leading-relaxed font-medium ${active ? "text-white" : revealed ? "text-white/70" : "text-white/30"}`}>
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
  const [cluesRevealed, setCluesRevealed] = useState(1);
  const [guess, setGuess] = useState("");
  const [guessError, setGuessError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [alreadyData, setAlreadyData] = useState<{ points: number; cluesRevealed: number; correct: boolean; playerName: string } | null>(null);
  const [requestingClue, setRequestingClue] = useState(false);
  const [clueCooldown, setClueCooldown] = useState(0); // seconds remaining before next clue allowed
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games/who-am-i");
        if (res.ok) {
          const data = await res.json();
          setClues(data.clues ?? []);
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
    setGuessError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/games/who-am-i", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: guess.trim(), cluesRevealed }),
      });
      const data = await res.json();

      if (data.alreadyPlayed) {
        setPhase("already_played");
        return;
      }

      if (data.correct) {
        setPointsEarned(data.points);
        setPlayerName(data.playerName);
        setPhase("correct");
        return;
      }

      if (data.gameOver) {
        setPlayerName(data.playerName);
        setPhase("gameover");
        return;
      }

      // Wrong but more clues available — auto-reveal next if they chose to guess
      setGuessError("Not quite! You can request the next clue or try again.");
      setGuess("");
    } catch {
      setGuessError("Network error, please try again.");
    }
    setSubmitting(false);
  };

  const startCooldown = (seconds: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setClueCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setClueCooldown((t) => {
        if (t <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleRequestClue = async () => {
    if (requestingClue || cluesRevealed >= 6 || clueCooldown > 0) return;
    setRequestingClue(true);
    setGuessError("");

    const nextClue = cluesRevealed + 1;
    if (nextClue > 6) { setRequestingClue(false); return; }

    setTimeout(() => {
      setCluesRevealed(nextClue);
      setRequestingClue(false);
      startCooldown(5); // 5-second cooldown before another clue can be revealed
      setTimeout(() => inputRef.current?.focus(), 200);
    }, 300);
  };

  // cleanup on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleGuess();
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Already played ────────────────────────────────────────────────────────
  if (phase === "already_played" && alreadyData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-sm">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>
          <div className="rounded-2xl border border-teal-400/20 p-6 text-center" style={{ background: "rgba(45,212,191,0.04)" }}>
            <div className="w-16 h-16 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">
              {alreadyData.correct ? "Great guess earlier!" : "Already Played Today"}
            </h2>
            <p className="text-white/40 text-sm mb-3">Today&apos;s mystery player was:</p>
            <p className="text-2xl font-black text-teal-400 mb-4">{alreadyData.playerName}</p>
            <p className="text-white/30 text-xs mb-4">Clues revealed: {alreadyData.cluesRevealed} of 6</p>
            {alreadyData.points > 0 ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-400/10 border border-teal-400/20">
                <Trophy className="w-4 h-4 text-teal-400" />
                <span className="text-teal-400 font-black">{alreadyData.points} pts earned</span>
              </div>
            ) : (
              <p className="text-white/30 text-sm">Better luck tomorrow!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Correct answer ────────────────────────────────────────────────────────
  if (phase === "correct") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden" style={{ background: "#0a0a0f" }}>
        <style>{`
          @keyframes fadeSlide { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
          .fade-slide { animation: fadeSlide 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
          @keyframes pop { 0%{transform:scale(0.5);opacity:0;} 70%{transform:scale(1.1);} 100%{transform:scale(1);opacity:1;} }
          .pop { animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity:1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
          }
          .confetti-piece { position:fixed; animation: confettiFall linear forwards; pointer-events:none; }
        `}</style>

        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              top: "-10px",
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              background: ["#2dd4bf", "#4ade80", "#60a5fa", "#f59e0b", "#a78bfa"][Math.floor(Math.random() * 5)],
              animationDuration: `${1.5 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 0.8}s`,
            }}
          />
        ))}

        <div className="w-full max-w-sm fade-slide text-center">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>

          <div className="w-20 h-20 rounded-full bg-teal-400/15 border-2 border-teal-400/50 flex items-center justify-center mx-auto mb-5 pop">
            <User className="w-10 h-10 text-teal-400" />
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Correct! 🎉</h2>
          <p className="text-teal-400 text-xl font-black mb-1">{playerName}</p>
          <p className="text-white/30 text-sm mb-6">Identified with {cluesRevealed} clue{cluesRevealed > 1 ? "s" : ""}</p>

          <div className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-teal-400/10 border border-teal-400/20 mb-6">
            <Trophy className="w-6 h-6 text-teal-400" />
            <span className="text-teal-400 font-black text-2xl">{pointsEarned} pts</span>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center mb-6">
            <p className="text-white/30 text-xs">Max 15 pts for clue 1 · 12 for clue 2 · 9 for clue 3 · 6 for 4 · 3 for 5 · 1 for 6</p>
          </div>

          <button onClick={() => router.push("/games")} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all">
            Back to Games Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Game over (all clues used, wrong) ─────────────────────────────────────
  if (phase === "gameover") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
        <style>{`
          @keyframes fadeSlide { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
          .fade-slide { animation: fadeSlide 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        `}</style>
        <div className="w-full max-w-sm fade-slide text-center">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>

          <div className="w-20 h-20 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-5">
            <HelpCircle className="w-10 h-10 text-red-400" />
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Not this time!</h2>
          <p className="text-white/40 text-sm mb-5">Today&apos;s mystery player was:</p>
          <p className="text-2xl font-black text-teal-400 mb-6">{playerName}</p>

          <p className="text-white/30 text-sm mb-6">You used all 6 clues without the correct answer.</p>

          <button onClick={() => router.push("/games")} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all">
            Back to Games Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fade-slide { animation: fadeSlide 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes clueReveal { from{opacity:0;transform:translateY(8px) scale(0.98);} to{opacity:1;transform:translateY(0) scale(1);} }
        .clue-reveal { animation: clueReveal 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes shakeBad { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-6px);} 40%,80%{transform:translateX(6px);} }
        .shake { animation: shakeBad 0.4s ease; }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-base">Who Am I?</h1>
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 text-xs font-bold">Clue</span>
          <span className="text-teal-400 font-black text-sm">{cluesRevealed}</span>
          <span className="text-white/20 text-xs">/6</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full overflow-y-auto pb-10">
        {/* Mystery silhouette */}
        <div className="flex flex-col items-center mb-6 fade-slide">
          <div className="w-20 h-20 rounded-full border-2 border-teal-400/30 bg-teal-400/8 flex items-center justify-center mb-2 relative">
            <User className="w-10 h-10 text-teal-400/40" />
            <div className="absolute inset-0 rounded-full border border-teal-400/20 animate-ping opacity-20" />
          </div>
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Mystery Player</p>
        </div>

        {/* Points preview */}
        <div className="flex gap-1.5 mb-5 justify-center">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className={`flex flex-col items-center px-2 py-1.5 rounded-lg border transition-all ${
                n === cluesRevealed
                  ? "border-teal-400/50 bg-teal-400/10"
                  : n < cluesRevealed
                  ? "border-white/10 bg-white/5 opacity-50"
                  : "border-white/5 bg-white/3 opacity-30"
              }`}
            >
              <span className="text-[9px] text-white/40 font-bold">C{n}</span>
              <span className={`text-xs font-black ${n === cluesRevealed ? "text-teal-400" : "text-white/30"}`}>
                {POINTS_BY_CLUE[n]}pt
              </span>
            </div>
          ))}
        </div>

        {/* Clue cards */}
        <div className="space-y-2 mb-5">
          {clues.slice(0, 6).map((clue, i) => (
            <div key={i} className={i === cluesRevealed - 1 ? "clue-reveal" : ""}>
              <ClueCard
                clue={clue}
                number={i + 1}
                revealed={i < cluesRevealed}
                active={i === cluesRevealed - 1}
              />
            </div>
          ))}
        </div>

        {/* Guess input */}
        <div className="sticky bottom-4 bg-[#0a0a0f] pt-2">
          <div className={`flex gap-2 ${guessError ? "shake" : ""}`}>
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={(e) => { setGuess(e.target.value); setGuessError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a player name..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm font-medium outline-none focus:border-teal-400/40 focus:ring-1 focus:ring-teal-400/20 transition-all"
              disabled={submitting}
            />
            <button
              onClick={handleGuess}
              disabled={!guess.trim() || submitting}
              className="px-5 py-3 rounded-xl bg-teal-400/15 border border-teal-400/30 text-teal-400 font-black text-sm hover:bg-teal-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? "..." : "Guess"}
            </button>
          </div>

          {guessError && (
            <p className="text-amber-400 text-xs mt-2 px-1 fade-slide">{guessError}</p>
          )}

          {cluesRevealed < 6 && (
            <button
              onClick={handleRequestClue}
              disabled={requestingClue || submitting || clueCooldown > 0}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/3 text-white/40 text-xs font-bold hover:bg-white/8 hover:text-white/60 disabled:opacity-40 transition-all relative overflow-hidden"
            >
              {clueCooldown > 0 ? (
                <>
                  <span className="font-black text-teal-400">{clueCooldown}s</span>
                  <span className="text-white/30">before next clue...</span>
                  {/* cooldown progress bar */}
                  <span className="absolute bottom-0 left-0 h-0.5 bg-teal-400/50 transition-all duration-1000"
                    style={{ width: `${((5 - clueCooldown) / 5) * 100}%` }} />
                </>
              ) : (
                <>
                  <ChevronDown className={`w-4 h-4 ${requestingClue ? "animate-bounce" : ""}`} />
                  Reveal next clue
                  <span className="text-white/20">(−{POINTS_BY_CLUE[cluesRevealed] - (POINTS_BY_CLUE[cluesRevealed + 1] ?? 0)} pts max)</span>
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
