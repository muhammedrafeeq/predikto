"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Clock, CheckCircle, XCircle, Zap } from "lucide-react";

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuestionResult {
  correct: boolean;
  correctIndex: number;
  points: number;
}

type GamePhase = "loading" | "playing" | "answered" | "complete" | "already_played";

const TIME_LIMIT = 30;

function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = (timeLeft / total) * 100;
  const color = pct > 60 ? "#4ade80" : pct > 30 ? "#f59e0b" : "#f87171";
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 linear"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export default function TriviaPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [timeSpent, setTimeSpent] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; answerIndex: number; timeSpent: number }[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [alreadyScore, setAlreadyScore] = useState<{ points: number; correct: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const answeredRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games/trivia");
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions ?? []);
          if (data.played) {
            setAlreadyScore({ points: data.points, correct: data.score });
            setPhase("already_played");
          } else {
            setPhase("playing");
          }
        }
      } catch {
        setError("Failed to load. Please refresh.");
        setPhase("playing");
      }
    })();
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIME_LIMIT);
    questionStartRef.current = Date.now();
    answeredRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!answeredRef.current) {
            answeredRef.current = true;
            handleAutoTimeout();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start timer when entering playing phase or moving to next question
  useEffect(() => {
    if (phase === "playing") {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoTimeout = useCallback(() => {
    const q = questions[currentIdx];
    if (!q) return;
    const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const newAnswers = [...answers, { questionId: q.id, answerIndex: -1, timeSpent: spent }];
    setAnswers(newAnswers);
    setSelectedOption(-1);
    setPhase("answered");

    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        submitAllAnswers(newAnswers);
      } else {
        setCurrentIdx((i) => i + 1);
        setSelectedOption(null);
        setPhase("playing");
      }
    }, 1800);
  }, [questions, currentIdx, answers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      if (phase !== "playing" || answeredRef.current) return;
      answeredRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const q = questions[currentIdx];
      const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
      setTimeSpent(spent);
      setSelectedOption(optionIdx);
      setPhase("answered");

      const newAnswers = [...answers, { questionId: q.id, answerIndex: optionIdx, timeSpent: spent }];
      setAnswers(newAnswers);

      setTimeout(() => {
        if (currentIdx + 1 >= questions.length) {
          submitAllAnswers(newAnswers);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelectedOption(null);
          setPhase("playing");
        }
      }, 1600);
    },
    [phase, questions, currentIdx, answers] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const submitAllAnswers = useCallback(
    async (allAnswers: { questionId: number; answerIndex: number; timeSpent: number }[]) => {
      setSubmitting(true);
      setPhase("complete");
      try {
        const res = await fetch("/api/games/trivia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: allAnswers }),
        });
        const data = await res.json();
        if (data.alreadyPlayed) {
          setPhase("already_played");
          return;
        }
        setResults(data.results);
        setTotalPoints(data.totalPoints);
      } catch {
        setError("Failed to submit. Please refresh.");
      }
      setSubmitting(false);
    },
    []
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Already played ────────────────────────────────────────────────────────
  if (phase === "already_played" && alreadyScore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-sm">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>
          <div className="rounded-2xl border border-sky-400/20 p-6 text-center" style={{ background: "rgba(56,189,248,0.04)" }}>
            <div className="text-4xl mb-3">🧠</div>
            <h2 className="text-xl font-black text-white mb-1">Already Played Today!</h2>
            <p className="text-white/40 text-sm mb-6">Come back tomorrow for fresh questions.</p>
            <div className="text-5xl font-black text-sky-400 mb-1">{alreadyScore.correct}/10</div>
            <p className="text-white/50 text-sm mb-4">Correct answers</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-400/10 border border-sky-400/20">
              <Trophy className="w-4 h-4 text-sky-400" />
              <span className="text-sky-400 font-black">{alreadyScore.points} pts earned</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  // ── Complete screen ───────────────────────────────────────────────────────
  if (phase === "complete") {
    return (
      <div className="min-h-screen pb-10 overflow-y-auto" style={{ background: "#0a0a0f" }}>
        <style>{`
          @keyframes fadeSlide { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
          .fade-slide { animation: fadeSlide 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        `}</style>
        <div className="max-w-sm mx-auto px-4 pt-8">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {submitting ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-white/40 text-sm">Calculating your score...</p>
            </div>
          ) : (
            <div className="fade-slide">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">
                  {totalPoints >= 25 ? "🏆" : totalPoints >= 15 ? "🧠" : "📚"}
                </div>
                <h2 className="text-3xl font-black text-white mb-1">Quiz Complete!</h2>
                <p className="text-white/40 text-sm">{results.filter((r) => r.correct).length}/10 correct answers</p>
              </div>

              <div className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-sky-400/10 border border-sky-400/20 mb-6">
                <Trophy className="w-6 h-6 text-sky-400" />
                <span className="text-sky-400 font-black text-2xl">{totalPoints} pts</span>
              </div>

              {/* Q by Q breakdown */}
              <div className="space-y-2 mb-6">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${r.correct ? "border-green-400/20 bg-green-400/5" : "border-red-400/20 bg-red-400/5"}`}>
                    <div className="flex items-center gap-2">
                      {r.correct
                        ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      <span className="text-white/60 text-sm">Q{i + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.correct && r.points === 3 && <Zap className="w-3 h-3 text-amber-400" />}
                      <span className={`font-black text-sm ${r.correct ? "text-green-400" : "text-red-400"}`}>
                        {r.correct ? `+${r.points} pts` : "0 pts"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center mb-6">
                <p className="text-white/40 text-xs">
                  <Zap className="w-3 h-3 text-amber-400 inline mr-1" />
                  Answering in &lt;10s earns 3pts — 10-20s earns 2pts — &gt;20s earns 1pt
                </p>
              </div>

              <button onClick={() => router.push("/games")} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all">
                Back to Games Hub
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        .fade-slide { animation: fadeSlide 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes optionIn { from{opacity:0;transform:translateX(-10px);} to{opacity:1;transform:translateX(0);} }
        .option-in { animation: optionIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-white/50 text-sm font-bold">
          Q <span className="text-white font-black">{currentIdx + 1}</span> / 10
        </span>
        <div className="flex items-center gap-1.5 text-white/60 text-sm font-mono font-bold">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? "text-red-400" : "text-sky-400"}`} />
          <span className={timeLeft <= 10 ? "text-red-400" : ""}>{timeLeft}s</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i < currentIdx ? "bg-sky-400" : i === currentIdx ? "bg-sky-400/60" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Timer bar */}
        <div className="mb-5">
          <TimerBar timeLeft={timeLeft} total={TIME_LIMIT} />
        </div>

        {/* Question */}
        <div
          key={currentIdx}
          className="fade-slide rounded-2xl border border-white/8 p-5 mb-5"
          style={{ background: "rgba(255,255,255,0.025)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400/60 mb-2">Question {currentIdx + 1}</div>
          <p className="text-white font-bold text-base leading-relaxed">{currentQ.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {currentQ.options.map((opt, i) => {
            let style = "border-white/10 bg-white/5 text-white/80 hover:border-sky-400/40 hover:bg-sky-400/8";
            if (phase === "answered" && selectedOption !== null) {
              // We don't have correct answer client-side — show selected as pending
              if (i === selectedOption) {
                style = "border-sky-400/60 bg-sky-400/15 text-white";
              } else {
                style = "border-white/5 bg-white/2 text-white/30";
              }
              if (selectedOption === -1 && i === -1) {
                // timeout — no highlight
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={phase === "answered"}
                className={`w-full text-left rounded-xl px-4 py-3.5 border font-semibold text-sm transition-all duration-200 option-in ${style} disabled:cursor-not-allowed`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg border border-current/30 flex items-center justify-center text-[11px] font-black shrink-0">
                    {["A", "B", "C", "D"][i]}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {phase === "answered" && (
          <p className="text-center text-white/30 text-xs mt-4 fade-slide">
            {currentIdx + 1 < questions.length ? "Next question loading..." : "Submitting your answers..."}
          </p>
        )}

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </main>
    </div>
  );
}
