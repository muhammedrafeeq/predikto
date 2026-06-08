"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Zap, CheckCircle, XCircle, Flag } from "lucide-react";
import CardReveal from "@/components/cards/CardReveal";

type Difficulty = "easy" | "medium" | "hard";
type Phase = "pick" | "loading" | "playing" | "result";

interface Question {
  id: number;
  flagEmoji: string;
  options: string[];
  correctAnswer: string;
}

interface AnswerRecord {
  flagId: number;
  answer: string;
  correctAnswer: string;
  timeSpent: number;
  correct: boolean;
}

interface ResultItem {
  flagId: number;
  correct: boolean;
  points: number;
  timeSpent: number;
}

const DIFF_META: Record<Difficulty, { label: string; time: number; mult: number; color: string; bg: string }> = {
  easy:   { label: "Easy",   time: 20, mult: 1, color: "text-emerald-400", bg: "border-emerald-500/40 bg-emerald-900/20" },
  medium: { label: "Medium", time: 15, mult: 2, color: "text-amber-400",   bg: "border-amber-500/40 bg-amber-900/20"   },
  hard:   { label: "Hard",   time: 10, mult: 3, color: "text-red-400",     bg: "border-red-500/40 bg-red-900/20"       },
};

export default function FlagQuizPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [resultItems, setResultItems] = useState<ResultItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Card drop states
  const [revealQueue, setRevealQueue] = useState<any[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);

  const handleRevealComplete = () => {
    if (currentRevealIndex < revealQueue.length - 1) {
      setCurrentRevealIndex(currentRevealIndex + 1);
    } else {
      setRevealQueue([]);
      setCurrentRevealIndex(-1);
    }
  };

  const meta = DIFF_META[difficulty];
  const question = questions[currentIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const advanceOrEnd = useCallback((record: AnswerRecord, allAnswers: AnswerRecord[]) => {
    clearTimer();
    setSelected(record.answer || "__timeout__");
    setTimeout(() => {
      setSelected(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        // Submit
        setSubmitting(true);
        setPhase("loading");
        fetch("/api/games/flag-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: allAnswers, difficulty }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              setTotalPoints(data.totalPoints);
              setStreakBonus(data.streakBonus);
              setResultItems(data.results);
              setCorrectCount(data.correctCount);
              if (data.droppedCard) {
                setRevealQueue([data.droppedCard]);
                setCurrentRevealIndex(0);
              }
              setPhase("result");
            } else {
              setError(data.error ?? "Submit failed");
              setPhase("result");
            }
          })
          .catch(() => { setError("Network error"); setPhase("result"); })
          .finally(() => setSubmitting(false));
      }
    }, 900);
  }, [clearTimer, currentIndex, questions.length, difficulty]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || selected !== null) return;
    setTimeLeft(meta.time);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          const timeSpent = meta.time;
          const record: AnswerRecord = { flagId: question.id, answer: "", correctAnswer: question.correctAnswer, timeSpent, correct: false };
          const allAnswers = [...answers, record];
          setAnswers(allAnswers);
          advanceOrEnd(record, allAnswers);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, currentIndex, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (option: string) => {
    if (selected !== null || phase !== "playing") return;
    clearTimer();
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const correct = option === question.correctAnswer;
    const record: AnswerRecord = { flagId: question.id, answer: option, correctAnswer: question.correctAnswer, timeSpent, correct };
    const allAnswers = [...answers, record];
    setAnswers(allAnswers);
    advanceOrEnd(record, allAnswers);
  };

  const startGame = async () => {
    setPhase("loading");
    setError("");
    setAnswers([]);
    setCurrentIndex(0);
    setSelected(null);
    try {
      const res = await fetch(`/api/games/flag-quiz?difficulty=${difficulty}`);
      const data = await res.json();
      if (data.played) {
        setAlreadyPlayed(true);
        setTodayPoints(data.points);
        setPhase("pick");
        return;
      }
      if (data.questions) {
        setQuestions(data.questions);
        setPhase("playing");
      } else {
        setError(data.error ?? "Failed to load questions");
        setPhase("pick");
      }
    } catch {
      setError("Network error");
      setPhase("pick");
    }
  };

  // DIFFICULTY PICK SCREEN
  if (phase === "pick") {
    return (
      <div className="min-h-screen bg-base-bg text-on-surface flex flex-col pb-24">
        <header className="flex items-center gap-3 px-5 py-4 pt-safe">
          <button onClick={() => router.push("/games")} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-lg tracking-tight">Flag Quiz</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <div className="text-center">
            <div className="text-7xl mb-4">🏳️</div>
            <h2 className="text-2xl font-black text-white mb-1">Flag Quiz</h2>
            <p className="text-white/40 text-sm">Identify WC 2026 nation flags. Faster = more points!</p>
          </div>

          {alreadyPlayed && (
            <div className="w-full max-w-sm bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-emerald-300 font-bold text-sm">Already played {DIFF_META[difficulty].label} today</p>
              <p className="text-white/50 text-xs mt-1">You scored <span className="text-white font-bold">{todayPoints} pts</span></p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="w-full max-w-sm space-y-3">
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest text-center mb-4">Select Difficulty</p>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const m = DIFF_META[d];
              return (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setAlreadyPlayed(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    difficulty === d ? m.bg + " " + m.color : "border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  <span className="font-bold text-sm">{m.label}</span>
                  <div className="flex items-center gap-3 text-xs font-semibold opacity-70">
                    <span>⏱ {m.time}s</span>
                    <span>×{m.mult} pts</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={startGame}
            className="w-full max-w-sm py-4 bg-primary text-on-primary rounded-2xl font-black text-base tracking-wide active:scale-95 transition-transform"
          >
            Start Quiz
          </button>

          <div className="text-center text-xs text-white/30 space-y-1">
            <p>10 flags · Speed-based scoring · Daily limit per difficulty</p>
            <p>Max <span className="text-white/50 font-bold">90 pts</span> (Hard, all fast + streak)</p>
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // PLAYING
  if (phase === "playing" && question) {
    const progress = (currentIndex / questions.length) * 100;
    const timerProgress = (timeLeft / meta.time) * 100;
    const timerColor = timerProgress > 50 ? "bg-emerald-500" : timerProgress > 25 ? "bg-amber-500" : "bg-red-500";

    return (
      <div className="min-h-screen bg-base-bg text-on-surface flex flex-col pb-24">
        <header className="flex items-center justify-between px-5 py-4 pt-safe">
          <button onClick={() => router.push("/games")} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
          <span className="text-white/40 text-xs font-bold">{currentIndex + 1} / {questions.length}</span>
        </header>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 mx-5 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 pt-4">
          {/* Timer */}
          <div className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-1.5 text-xs text-white/40 font-semibold">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Time</span>
              <span className={timeLeft <= 5 ? "text-red-400 font-black animate-pulse" : ""}>{timeLeft}s</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${timerColor} transition-all duration-1000 rounded-full`} style={{ width: `${timerProgress}%` }} />
            </div>
          </div>

          {/* Flag */}
          <div className="text-center">
            <div className="text-[100px] leading-none select-none drop-shadow-2xl">{question.flagEmoji}</div>
            <p className="text-white/30 text-xs mt-3 font-semibold uppercase tracking-widest">Which country?</p>
          </div>

          {/* Options */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            {question.options.map((option) => {
              let btnClass = "border-white/10 bg-white/5 text-white hover:bg-white/10 active:scale-95";
              if (selected !== null) {
                if (option === question.correctAnswer) btnClass = "border-emerald-500 bg-emerald-900/40 text-emerald-300";
                else if (option === selected) btnClass = "border-red-500 bg-red-900/40 text-red-300";
                else btnClass = "border-white/5 bg-white/3 text-white/30";
              }
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={selected !== null}
                  className={`py-3.5 px-2 rounded-2xl border font-bold text-xs sm:text-sm transition-all ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // RESULT
  if (phase === "result") {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-base-bg text-on-surface flex flex-col pb-24">
        <header className="flex items-center gap-3 px-5 py-4 pt-safe">
          <button onClick={() => router.push("/games")} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-lg tracking-tight">Results</h1>
        </header>

        <div className="flex-1 flex flex-col items-center px-6 gap-6 pt-4">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-400 font-bold">{error}</p>
              <button onClick={() => router.push("/games")} className="mt-4 text-primary text-sm underline">Back to Games</button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="text-6xl mb-3">{percentage >= 80 ? "🏆" : percentage >= 50 ? "⚽" : "🏳️"}</div>
                <p className="text-4xl font-black text-white">{totalPoints} <span className="text-white/40 text-2xl">pts</span></p>
                {streakBonus > 0 && <p className="text-amber-400 text-sm font-bold mt-1">+{streakBonus} streak bonus 🔥</p>}
                <p className="text-white/50 text-sm mt-2">{correctCount}/{questions.length} correct · {percentage}%</p>
              </div>

              <div className="w-full max-w-sm space-y-2">
                {answers.map((a, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
                    a.correct ? "border-emerald-500/30 bg-emerald-900/20" : "border-red-500/20 bg-red-900/10"
                  }`}>
                    <div className="flex items-center gap-3">
                      {a.correct
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      <span className="text-white/70 text-xs">{a.correctAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{a.timeSpent}s</span>
                      <span className={a.correct ? "text-emerald-400 font-bold" : "text-white/20"}>
                        +{resultItems[i]?.points ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full max-w-sm flex flex-col gap-3 pt-2">
                <button
                  onClick={() => { setPhase("pick"); setAnswers([]); setCurrentIndex(0); }}
                  className="w-full py-3 border border-white/10 bg-white/5 rounded-2xl font-bold text-sm text-white/70 hover:bg-white/10 transition-colors"
                >
                  Try Another Difficulty
                </button>
                <button
                  onClick={() => router.push("/games")}
                  className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm"
                >
                  Back to Games
                </button>
              </div>
            </>
          )}
        </div>

        {/* Inline Card Reveal Overlay Modal */}
        {revealQueue.length > 0 && currentRevealIndex >= 0 && (
          <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-6">
              <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase animate-pulse">
                Card Reward {currentRevealIndex + 1} of {revealQueue.length}
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                Flip the Card to Reveal Your Player!
              </h2>
            </div>

            <CardReveal
              card={revealQueue[currentRevealIndex]}
              onComplete={handleRevealComplete}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
