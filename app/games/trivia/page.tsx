"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Clock, CheckCircle, XCircle, Zap, Flame } from "lucide-react";

interface TriviaQuestion {
  id: number;
  question: string;
  question_ml: string;
  options: string[];
  options_ml: string[];
  correct_index: number;
}

interface QuestionResult {
  correct: boolean;
  correctIndex: number;
  points: number;
  explanation: string;
  explanation_ml: string;
}

type GamePhase = "loading" | "select" | "playing" | "answered" | "complete" | "already_played";
type Difficulty = "easy" | "medium" | "hard";
type Lang = "en" | "ml";

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; label_ml: string; color: string; bg: string; border: string; time: number; mult: string }> = {
  easy:   { label: "Easy",   label_ml: "എളുപ്പം",   color: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.25)",   time: 30, mult: "×1" },
  medium: { label: "Medium", label_ml: "മധ്യം",     color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.25)",   time: 25, mult: "×2" },
  hard:   { label: "Hard",   label_ml: "ബുദ്ധിമുട്ട്", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", time: 20, mult: "×3" },
};

function TimerBar({ timeLeft, total, color }: { timeLeft: number; total: number; color: string }) {
  const pct = (timeLeft / total) * 100;
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000 linear" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function TriviaPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [answers, setAnswers] = useState<{ questionId: number; answerIndex: number; timeSpent: number }[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [shownResult, setShownResult] = useState<QuestionResult | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [alreadyScore, setAlreadyScore] = useState<{ points: number; correct: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStreak, setCurrentStreak] = useState(0);

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const answeredRef = useRef(false);

  const cfg = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    setPhase("select");
  }, []);

  const loadQuestions = useCallback(async (diff: Difficulty) => {
    setPhase("loading");
    try {
      const res = await fetch(`/api/games/trivia?difficulty=${diff}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions ?? []);
        if (data.played) {
          setAlreadyScore({ points: data.points, correct: data.score });
          setPhase("already_played");
        } else {
          setCurrentIdx(0);
          setAnswers([]);
          setResults([]);
          setCurrentStreak(0);
          setPhase("playing");
        }
      }
    } catch {
      setError("Failed to load. Please refresh.");
      setPhase("playing");
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(DIFFICULTY_CONFIG[difficulty].time);
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
  }, [difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "playing") startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoTimeout = useCallback(() => {
    const q = questions[currentIdx];
    if (!q) return;
    const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const newAnswers = [...answers, { questionId: q.id, answerIndex: -1, timeSpent: spent }];
    setAnswers(newAnswers);
    setSelectedOption(-1);
    setCurrentStreak(0);
    setPhase("answered");

    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        submitAllAnswers(newAnswers);
      } else {
        setCurrentIdx((i) => i + 1);
        setSelectedOption(null);
        setShownResult(null);
        setPhase("playing");
      }
    }, 2200);
  }, [questions, currentIdx, answers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      if (phase !== "playing" || answeredRef.current) return;
      answeredRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const q = questions[currentIdx];
      const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
      setSelectedOption(optionIdx);
      setPhase("answered");

      const newAnswers = [...answers, { questionId: q.id, answerIndex: optionIdx, timeSpent: spent }];
      setAnswers(newAnswers);

      const isCorrect = optionIdx === -1 ? false : true; // actual correctness revealed in result
      setCurrentStreak((s) => isCorrect ? s + 1 : 0);

      setTimeout(() => {
        if (currentIdx + 1 >= questions.length) {
          submitAllAnswers(newAnswers);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelectedOption(null);
          setShownResult(null);
          setPhase("playing");
        }
      }, 1200);
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
          body: JSON.stringify({ answers: allAnswers, difficulty }),
        });
        const data = await res.json();
        if (data.alreadyPlayed) { setPhase("already_played"); return; }
        setResults(data.results);
        setTotalPoints(data.totalPoints);
        setStreakBonus(data.streakBonus ?? 0);

        if (data.cardDrops && data.cardDrops.length > 0) {
          setRevealQueue(data.cardDrops);
          setCurrentRevealIndex(0);
        }
      } catch {
        setError("Failed to submit. Please refresh.");
      }
      setSubmitting(false);
    },
    [difficulty]
  );

  // ── Difficulty selector ─────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 selection:bg-[#c3f400] selection:text-[#161e00]">
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
            <div className="font-label-caps text-[14px] text-white tracking-widest font-bold uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#c3f400]" />
              FOOTBALL TRIVIA
            </div>
            <button
              onClick={() => setLang(l => l === "en" ? "ml" : "en")}
              className="text-xs font-label-caps font-bold px-2.5 py-1 rounded-full border border-[#00e3fd]/30 text-[#00e3fd] bg-[#00e3fd]/10"
            >
              {lang === "en" ? "മല" : "EN"}
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto w-full">
          <div className="text-6xl mb-4 drop-shadow-[0_0_20px_rgba(0,227,253,0.3)]">🧠</div>
          <h2 className="font-headline-md text-2xl text-white text-center mb-1 uppercase tracking-wider">
            {lang === "en" ? "Choose Difficulty" : "ബുദ്ധിമുട്ട് തിരഞ്ഞെടുക്കുക"}
          </h2>
          <p className="text-[#c4c9ac] text-xs text-center mb-8">
            {lang === "en" ? "Harder mode = higher point multiplier" : "ബുദ്ധിമുട്ടുള്ളത് = ഉയർന്ന പോയിന്റ് ഗുണകം"}
          </p>

          <div className="flex flex-col gap-3 w-full mb-6">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const c = DIFFICULTY_CONFIG[d];
              const selected = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    selected
                      ? "border-[#c3f400] bg-[#c3f400]/10 text-white shadow-[0_0_15px_rgba(195,244,0,0.15)]"
                      : "border-white/10 glass-card text-[#c4c9ac] hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-label-caps font-bold text-sm uppercase text-white">
                      {lang === "en" ? c.label : c.label_ml}
                    </p>
                    <p className="text-xs font-label-mono text-[#c4c9ac] mt-0.5">
                      {lang === "en"
                        ? `${c.time}s per question`
                        : `ഓരോ ചോദ്യത്തിനും ${c.time} സെക്കൻഡ്`}
                    </p>
                  </div>
                  <span className="font-display-score text-lg text-[#c3f400]">{c.mult}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl p-3.5 mb-6 w-full text-center border border-amber-400/20 bg-amber-400/10 glass-card">
            <p className="text-amber-400 text-xs font-bold font-label-caps">
              <Flame className="w-4 h-4 inline mr-1" />
              {lang === "en"
                ? "3+ correct in a row = streak bonus (+1 pt each)"
                : "3+ ഒന്നിനു ശേഷം ശരിയുത്തരം = സ്ട്രീക്ക് ബോണസ് (+1 pt)"}
            </p>
          </div>

          <button
            onClick={() => loadQuestions(difficulty)}
            className="w-full py-4 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_25px_rgba(195,244,0,0.3)]"
          >
            {lang === "en" ? `Start ${cfg.label}` : `${cfg.label_ml} ആരംഭിക്കുക`}
          </button>
        </main>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#c3f400] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(195,244,0,0.5)]" />
        <span className="mt-4 font-label-caps text-xs text-[#c3f400] tracking-widest uppercase">LOADING TRIVIA...</span>
      </div>
    );
  }

  // ── Already played ────────────────────────────────────────────────────────
  if (phase === "already_played" && alreadyScore) {
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
            <span className="font-label-caps text-sm text-white font-bold tracking-widest uppercase">TRIVIA RESULT</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="w-full max-w-sm glass-card border border-white/15 p-6 rounded-3xl text-center shadow-2xl">
          <div className="text-5xl mb-3">🧠</div>
          <h2 className="font-headline-md text-2xl text-white mb-1 uppercase tracking-wider">Already Played Today!</h2>
          <p className="text-[#c4c9ac] text-xs mb-6">Come back tomorrow for fresh questions.</p>
          <div className="font-display-score text-5xl text-[#c3f400] mb-1">{alreadyScore.correct}/10</div>
          <p className="text-[#c4c9ac] text-xs font-label-mono mb-4">Correct Answers</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c3f400]/10 border border-[#c3f400]/30 text-[#c3f400]">
            <Trophy className="w-4 h-4 text-[#c3f400]" />
            <span className="font-label-caps font-bold text-sm">{alreadyScore.points} PTS EARNED</span>
          </div>

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

  const currentQ = questions[currentIdx];

  // ── Complete screen ───────────────────────────────────────────────────────
  if (phase === "complete") {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 selection:bg-[#c3f400] selection:text-[#161e00]">
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
            <span className="font-label-caps text-sm text-white font-bold tracking-widest uppercase">QUIZ COMPLETE</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="max-w-sm mx-auto px-4 w-full">
          {submitting ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-[#c3f400] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#c4c9ac] text-xs font-label-caps">Calculating score...</p>
            </div>
          ) : (
            <div>
              <div className="text-center glass-card p-6 rounded-3xl border border-white/15 mb-6">
                <div className="text-5xl mb-3">{totalPoints >= 60 ? "🏆" : totalPoints >= 30 ? "🧠" : "📚"}</div>
                <h2 className="font-headline-md text-3xl text-white mb-1 uppercase tracking-wider">Quiz Complete!</h2>
                <p className="text-[#c4c9ac] text-xs font-label-mono">{correctCount}/10 Correct · <span className="text-[#c3f400] font-bold">{cfg.label}</span></p>
              </div>

              <div className="flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-[#c3f400]/10 border border-[#c3f400]/30 mb-4">
                <Trophy className="w-6 h-6 text-[#c3f400]" />
                <span className="text-[#c3f400] font-display-score text-3xl">{totalPoints} PTS</span>
              </div>

              {streakBonus > 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 mb-4">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-label-caps font-bold text-xs">+{streakBonus} STREAK BONUS INCLUDED!</span>
                </div>
              )}

              {/* Q by Q breakdown */}
              <div className="space-y-3 mb-6">
                {results.map((r, i) => (
                  <div key={i} className={`rounded-2xl border p-3.5 glass-card ${r.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {r.correct
                          ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        <span className="text-white text-xs font-bold">Q{i + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.correct && r.points >= 6 && <Zap className="w-3.5 h-3.5 text-[#c3f400]" />}
                        <span className={`font-label-mono font-bold text-xs ${r.correct ? "text-[#c3f400]" : "text-rose-400"}`}>
                          {r.correct ? `+${r.points} pts` : "0 pts"}
                        </span>
                      </div>
                    </div>
                    {r.explanation && (
                      <p className="text-xs text-[#c4c9ac] leading-relaxed font-medium">
                        {lang === "en" ? r.explanation : (r.explanation_ml || r.explanation)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="w-full flex flex-col gap-3">
                <button onClick={() => { setPhase("select"); setAnswers([]); setResults([]); }} className="w-full py-3.5 glass-card border border-white/15 rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider text-white hover:border-[#c3f400]/40 transition-colors">
                  Play Again
                </button>
                <button onClick={() => router.push("/games")} className="w-full py-4 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(195,244,0,0.3)]">
                  Back to Games Hub
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col pt-20 pb-24 selection:bg-[#c3f400] selection:text-[#161e00]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
        <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
          <button onClick={() => router.push("/games")} className="active:scale-95 transition-transform flex items-center gap-2 cursor-pointer text-[#c4c9ac] hover:text-[#c3f400]">
            <ArrowLeft className="w-5 h-5 text-[#c3f400]" />
            <span className="font-label-caps text-[12px] uppercase tracking-widest font-bold">
              QUIT
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-label-caps font-bold px-2.5 py-0.5 rounded-full border border-[#c3f400]/30 text-[#c3f400] bg-[#c3f400]/10">
              {lang === "en" ? cfg.label : DIFFICULTY_CONFIG[difficulty].label_ml}
            </span>
            <span className="text-[#c4c9ac] text-xs font-label-mono font-bold">
              Q <span className="text-white font-bold">{currentIdx + 1}</span> / 10
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentStreak >= 3 && (
              <span className="text-xs font-label-caps font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/30">
                <Flame className="w-3 h-3" />{currentStreak}
              </span>
            )}
            <button
              onClick={() => setLang(l => l === "en" ? "ml" : "en")}
              className="text-xs font-label-caps font-bold px-2.5 py-1 rounded-full border border-[#00e3fd]/30 text-[#00e3fd] bg-[#00e3fd]/10"
            >
              {lang === "en" ? "മല" : "EN"}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-label-mono font-bold text-[#c3f400]">
              <Clock className="w-4 h-4 text-[#c3f400]" />
              <span>{timeLeft}s</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-4">
          {questions.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i < currentIdx ? "bg-[#c3f400] shadow-[0_0_8px_rgba(195,244,0,0.5)]" : i === currentIdx ? "bg-[#c3f400]/50" : "bg-white/10"
            }`} />
          ))}
        </div>

        {/* Question */}
        <div className="glass-card rounded-3xl border border-white/15 p-6 mb-5 shadow-xl">
          <div className="text-[10px] font-label-caps font-bold text-[#c3f400] uppercase tracking-widest mb-2">Question {currentIdx + 1}</div>
          <p className="text-white font-headline-md text-lg leading-relaxed">
            {lang === "en" ? currentQ.question : (currentQ.question_ml || currentQ.question)}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {(lang === "en" ? currentQ.options : currentQ.options_ml.length ? currentQ.options_ml : currentQ.options).map((opt, i) => {
            let btnClass = "border-white/10 glass-card text-white hover:border-[#c3f400]/40 active:scale-95";

            if (phase === "answered" && selectedOption !== null) {
              const isCorrect = i === currentQ.correct_index;
              const isSelected = i === selectedOption;
              if (isCorrect) {
                btnClass = "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
              } else if (isSelected && !isCorrect) {
                btnClass = "border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
              } else {
                btnClass = "border-white/5 bg-white/5 opacity-40 text-white/40";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={phase === "answered"}
                className={`w-full text-left rounded-2xl px-4 py-4 border font-bold text-sm transition-all shadow-md ${btnClass}`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl border border-white/20 flex items-center justify-center text-xs font-label-mono font-bold shrink-0 bg-white/5">
                    {["A", "B", "C", "D"][i]}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation shown after answering */}
        {phase === "answered" && shownResult && (
          <div className={`mt-4 rounded-2xl p-4 border glass-card ${shownResult.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
            <div className="flex items-center gap-2 mb-1">
              {shownResult.correct
                ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span className={`text-xs font-label-caps font-bold ${shownResult.correct ? "text-emerald-400" : "text-rose-400"}`}>
                {shownResult.correct ? `Correct! +${shownResult.points} pts` : "Wrong!"}
              </span>
            </div>
            <p className="text-xs text-[#c4c9ac] leading-relaxed font-medium">
              {lang === "en" ? shownResult.explanation : (shownResult.explanation_ml || shownResult.explanation)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
