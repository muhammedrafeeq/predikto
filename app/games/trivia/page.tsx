"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Clock, CheckCircle, XCircle, Zap, Flame } from "lucide-react";
import AdBanner from "@/components/AdBanner";

interface TriviaQuestion {
  id: number;
  question: string;
  question_ml: string;
  options: string[];
  options_ml: string[];
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
      }, 2200);
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
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
        <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-slide{animation:fadeSlide 0.4s cubic-bezier(0.16,1,0.3,1) forwards}`}</style>
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-black text-base">Football Trivia</h1>
          <button
            onClick={() => setLang(l => l === "en" ? "ml" : "en")}
            className="text-xs font-black px-2.5 py-1 rounded-full border transition-all"
            style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)" }}
          >
            {lang === "en" ? "മല" : "EN"}
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto w-full fade-slide">
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-2xl font-black text-white text-center mb-1">
            {lang === "en" ? "Choose Difficulty" : "ബുദ്ധിമുട്ട് തിരഞ്ഞെടുക്കുക"}
          </h2>
          <p className="text-white/40 text-sm text-center mb-8">
            {lang === "en" ? "Harder = higher point multiplier" : "ബുദ്ധിമുട്ടുള്ളത് = ഉയർന്ന പോയിന്റ് ഗുണകം"}
          </p>

          <div className="flex flex-col gap-3 w-full mb-6">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const c = DIFFICULTY_CONFIG[d];
              const selected = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                  style={{
                    background: selected ? c.bg : "rgba(255,255,255,0.02)",
                    borderColor: selected ? c.border : "rgba(255,255,255,0.08)",
                    boxShadow: selected ? `0 0 20px ${c.bg}` : "none",
                  }}
                >
                  <div className="text-left">
                    <p className="font-black text-base" style={{ color: selected ? c.color : "rgba(255,255,255,0.6)" }}>
                      {lang === "en" ? c.label : c.label_ml}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {lang === "en"
                        ? `${c.time}s per question`
                        : `ഓരോ ചോദ്യത്തിനും ${c.time} സെക്കൻഡ്`}
                    </p>
                  </div>
                  <span className="font-black text-lg" style={{ color: c.color }}>{c.mult}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl p-3 mb-6 w-full text-center border border-amber-400/15 bg-amber-400/5">
            <p className="text-amber-400 text-xs font-bold">
              <Flame className="w-3 h-3 inline mr-1" />
              {lang === "en"
                ? "3+ correct in a row = streak bonus (+1 pt each)"
                : "3+ ഒന്നിനു ശേഷം ശരിയുത്തരം = സ്ട്രീക്ക് ബോണസ് (+1 pt)"}
            </p>
          </div>

          <button
            onClick={() => loadQuestions(difficulty)}
            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}88)` }}
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
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="min-h-screen pb-10 overflow-y-auto" style={{ background: "#0a0a0f" }}>
        <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-slide{animation:fadeSlide 0.4s cubic-bezier(0.16,1,0.3,1) forwards}`}</style>
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
                <div className="text-5xl mb-3">{totalPoints >= 60 ? "🏆" : totalPoints >= 30 ? "🧠" : "📚"}</div>
                <h2 className="text-3xl font-black text-white mb-1">Quiz Complete!</h2>
                <p className="text-white/40 text-sm">{correctCount}/10 correct · <span style={{ color: cfg.color }}>{cfg.label}</span></p>
              </div>

              <div className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-sky-400/10 border border-sky-400/20 mb-3">
                <Trophy className="w-6 h-6 text-sky-400" />
                <span className="text-sky-400 font-black text-2xl">{totalPoints} pts</span>
              </div>

              {streakBonus > 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 mb-4">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold text-sm">+{streakBonus} streak bonus included!</span>
                </div>
              )}

              {/* Q by Q breakdown with explanation */}
              <div className="space-y-3 mb-6">
                {results.map((r, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${r.correct ? "border-green-400/20 bg-green-400/5" : "border-red-400/20 bg-red-400/5"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {r.correct
                          ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                        <span className="text-white/60 text-sm">Q{i + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.correct && r.points >= 6 && <Zap className="w-3 h-3 text-amber-400" />}
                        <span className={`font-black text-sm ${r.correct ? "text-green-400" : "text-red-400"}`}>
                          {r.correct ? `+${r.points} pts` : "0 pts"}
                        </span>
                      </div>
                    </div>
                    {r.explanation && (
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {lang === "en" ? r.explanation : (r.explanation_ml || r.explanation)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center mb-6">
                <p className="text-white/40 text-xs">
                  <Zap className="w-3 h-3 text-amber-400 inline mr-1" />
                  Speed bonus: &lt;10s = ×3 · 10-20s = ×2 · &gt;20s = ×1 · multiplied by difficulty
                </p>
              </div>

              <button onClick={() => { setPhase("select"); setAnswers([]); setResults([]); }} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all mb-3">
                Play Again
              </button>
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
        @keyframes fadeSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fade-slide{animation:fadeSlide 0.3s cubic-bezier(0.16,1,0.3,1) forwards}
        @keyframes optionIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}.option-in{animation:optionIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards}
        @keyframes streakPop{0%{transform:scale(0.7)}70%{transform:scale(1.15)}100%{transform:scale(1)}}.streak-pop{animation:streakPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards}
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {lang === "en" ? cfg.label : DIFFICULTY_CONFIG[difficulty].label_ml}
          </span>
          <span className="text-white/50 text-sm font-bold">
            Q <span className="text-white font-black">{currentIdx + 1}</span> / 10
          </span>
        </div>
        <div className="flex items-center gap-2">
          {currentStreak >= 3 && (
            <span className="streak-pop text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Flame className="w-3 h-3" />{currentStreak}
            </span>
          )}
          <button
            onClick={() => setLang(l => l === "en" ? "ml" : "en")}
            className="text-xs font-black px-2 py-0.5 rounded-full border transition-all"
            style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)" }}
          >
            {lang === "en" ? "മല" : "EN"}
          </button>
          <div className="flex items-center gap-1.5 text-white/60 text-sm font-mono font-bold">
            <Clock className={`w-4 h-4 ${timeLeft <= 8 ? "text-red-400" : ""}`} style={{ color: timeLeft > 8 ? cfg.color : undefined }} />
            <span className={timeLeft <= 8 ? "text-red-400" : ""}>{timeLeft}s</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-4">
          {questions.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i < currentIdx ? cfg.color : i === currentIdx ? `${cfg.color}60` : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>

        {/* Timer bar */}
        <div className="mb-5">
          <TimerBar timeLeft={timeLeft} total={DIFFICULTY_CONFIG[difficulty].time} color={cfg.color} />
        </div>

        {/* Question */}
        <div key={currentIdx} className="fade-slide rounded-2xl border border-white/8 p-5 mb-5" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${cfg.color}99` }}>Question {currentIdx + 1}</div>
          <p className="text-white font-bold text-base leading-relaxed">
            {lang === "en" ? currentQ.question : (currentQ.question_ml || currentQ.question)}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {(lang === "en" ? currentQ.options : currentQ.options_ml.length ? currentQ.options_ml : currentQ.options).map((opt, i) => {
            let borderColor = "rgba(255,255,255,0.1)";
            let bgColor = "rgba(255,255,255,0.05)";
            let textColor = "rgba(255,255,255,0.8)";

            if (phase === "answered" && selectedOption !== null) {
              if (i === selectedOption) {
                borderColor = `${cfg.color}99`;
                bgColor = `${cfg.color}22`;
                textColor = "#fff";
              } else {
                borderColor = "rgba(255,255,255,0.05)";
                bgColor = "rgba(255,255,255,0.02)";
                textColor = "rgba(255,255,255,0.3)";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={phase === "answered"}
                className="w-full text-left rounded-xl px-4 py-3.5 border font-semibold text-sm transition-all duration-200 option-in disabled:cursor-not-allowed"
                style={{ borderColor, background: bgColor, color: textColor, animationDelay: `${i * 0.05}s` }}
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

        {/* Ad banner under options */}
        <div className="mt-4 flex justify-center">
          <AdBanner adKey="753405b7f38e29d2a92c4475af5f639c" width={320} height={50} placement="ad_trivia_320x50" />
        </div>

        {/* Explanation shown after answering */}
        {phase === "answered" && shownResult && (
          <div className={`mt-4 rounded-xl px-4 py-3 border fade-slide ${shownResult.correct ? "border-green-400/25 bg-green-400/5" : "border-red-400/25 bg-red-400/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              {shownResult.correct
                ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span className={`text-xs font-black ${shownResult.correct ? "text-green-400" : "text-red-400"}`}>
                {shownResult.correct ? `Correct! +${shownResult.points} pts` : "Wrong!"}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              {lang === "en" ? shownResult.explanation : (shownResult.explanation_ml || shownResult.explanation)}
            </p>
          </div>
        )}

        {phase === "answered" && !shownResult && (
          <p className="text-center text-white/30 text-xs mt-4 fade-slide">
            {currentIdx + 1 < questions.length ? "Next question loading..." : "Submitting your answers..."}
          </p>
        )}

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </main>
    </div>
  );
}
