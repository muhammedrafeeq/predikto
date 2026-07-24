"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Zap, CheckCircle, XCircle, Flag } from "lucide-react";

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

const COUNTRY_TO_CODE: Record<string, string> = {
  "Argentina": "ar", "Brazil": "br", "France": "fr", "Germany": "de", "Spain": "es",
  "England": "gb-eng", "Portugal": "pt", "Netherlands": "nl", "Italy": "it", "United States": "us",
  "Mexico": "mx", "Canada": "ca", "Japan": "jp", "Uruguay": "uy", "Croatia": "hr",
  "Belgium": "be", "Colombia": "co", "South Korea": "kr", "Morocco": "ma", "Australia": "au",
  "Sweden": "se", "Switzerland": "ch", "Poland": "pl", "Denmark": "dk", "Nigeria": "ng",
  "Egypt": "eg", "India": "in", "Chile": "cl", "Peru": "pe", "Ecuador": "ec",
  "Paraguay": "py", "Venezuela": "ve", "Ghana": "gh", "Ivory Coast": "ci", "Cameroon": "cm",
  "Senegal": "sn", "Algeria": "dz", "Tunisia": "tn", "Iran": "ir", "Qatar": "qa",
  "Saudi Arabia": "sa", "United Arab Emirates": "ae", "Turkey": "tr", "Ukraine": "ua", "Serbia": "rs",
  "Scotland": "gb-sct", "Wales": "gb-wls", "Austria": "at", "Greece": "gr", "Norway": "no",
  "Czechia": "cz", "Romania": "ro", "South Africa": "za", "Mali": "ml", "Costa Rica": "cr",
  "Jamaica": "jm", "Panama": "pa", "Honduras": "hn", "Iceland": "is", "Republic of Ireland": "ie",
  "Finland": "fi", "Iraq": "iq", "Uzbekistan": "uz", "China": "cn", "New Zealand": "nz",
  "Cape Verde": "cv", "Georgia": "ge", "Albania": "al", "Slovakia": "sk", "Slovenia": "si",
  "Bosnia and Herzegovina": "ba", "Montenegro": "me", "North Macedonia": "mk", "Luxembourg": "lu",
  "Cyprus": "cy", "Armenia": "am", "Azerbaijan": "az", "Kazakhstan": "kz", "Jordan": "jo",
  "Bahrain": "bh", "Oman": "om", "Palestine": "ps", "Syria": "sy", "Thailand": "th",
  "Vietnam": "vn", "Indonesia": "id", "Malaysia": "my", "Fiji": "fj", "Haiti": "ht",
  "Curaçao": "cw", "Trinidad and Tobago": "tt", "El Salvador": "sv", "Bolivia": "bo",
  "Burkina Faso": "bf", "DR Congo": "cd", "Zambia": "zm", "Angola": "ao", "Benin": "bj",
  "Mauritania": "mr", "Madagascar": "mg", "Equatorial Guinea": "gq", "Gabon": "ga", "Mozambique": "mz",
  "Northern Ireland": "gb-nir"
};

function getFlagImageUrl(countryName: string, emoji: string): string {
  const code = COUNTRY_TO_CODE[countryName];
  if (code) return `https://flagcdn.com/w320/${code}.png`;
  if (emoji && emoji.length >= 4) {
    const char1 = emoji.codePointAt(0);
    const char2 = emoji.codePointAt(2);
    if (char1 && char2 && char1 >= 0x1f1e6 && char1 <= 0x1f1ff && char2 >= 0x1f1e6 && char2 <= 0x1f1ff) {
      const c1 = String.fromCharCode(char1 - 0x1f1e6 + 97);
      const c2 = String.fromCharCode(char2 - 0x1f1e6 + 97);
      return `https://flagcdn.com/w320/${c1}${c2}.png`;
    }
  }
  return "";
}

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
              <Flag className="w-4 h-4 text-[#c3f400]" />
              FLAG QUIZ
            </div>

            <div className="bg-[#c3f400]/10 px-3 py-1 rounded-full border border-[#c3f400]/30 text-[#c3f400] font-label-caps text-xs font-bold">
              {meta.label.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-md mx-auto w-full">
          <div className="text-center space-y-2">
            <div className="text-7xl mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">🏳️</div>
            <h2 className="font-headline-md text-3xl text-white tracking-wider uppercase">Flag Quiz</h2>
            <p className="text-[#c4c9ac] text-xs font-medium">Identify WC 2026 nation flags. Faster speed = bonus multiplier!</p>
          </div>

          {alreadyPlayed && (
            <div className="w-full glass-card bg-emerald-900/20 border border-emerald-500/40 rounded-2xl p-4 text-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-emerald-300 font-bold text-sm">Already played {DIFF_META[difficulty].label} today</p>
              <p className="text-[#c4c9ac] text-xs mt-1">You scored <span className="text-[#c3f400] font-bold">{todayPoints} pts</span></p>
            </div>
          )}

          {error && <p className="text-rose-400 text-xs font-bold text-center bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">{error}</p>}

          <div className="w-full space-y-3">
            <p className="font-label-caps text-[11px] text-[#c3f400] font-bold uppercase tracking-widest text-center mb-3">Select Difficulty</p>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const m = DIFF_META[d];
              return (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setAlreadyPlayed(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    difficulty === d
                      ? "border-[#c3f400] bg-[#c3f400]/10 text-white shadow-[0_0_15px_rgba(195,244,0,0.15)]"
                      : "border-white/10 glass-card text-[#c4c9ac] hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-sm uppercase font-label-caps">{m.label}</span>
                  <div className="flex items-center gap-3 text-xs font-label-mono font-semibold">
                    <span>⏱ {m.time}s</span>
                    <span className="text-[#c3f400] font-bold">×{m.mult} pts</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-sm tracking-wider uppercase active:scale-95 transition-all shadow-[0_0_25px_rgba(195,244,0,0.3)]"
          >
            Start Quiz
          </button>

          <div className="text-center text-xs font-label-mono text-[#c4c9ac]/60 space-y-1">
            <p>10 flags · Speed-based scoring · Daily limit</p>
            <p>Max <span className="text-[#c3f400] font-bold">90 pts</span> (Hard mode)</p>
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#c3f400] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(195,244,0,0.5)]" />
        <span className="mt-4 font-label-caps text-xs text-[#c3f400] tracking-widest uppercase">LOADING QUIZ...</span>
      </div>
    );
  }

  // PLAYING
  if (phase === "playing" && question) {
    const progress = (currentIndex / questions.length) * 100;
    const timerProgress = (timeLeft / meta.time) * 100;

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
                QUIT
              </span>
            </button>

            <span className="font-label-caps text-xs text-[#c3f400] font-bold uppercase tracking-widest">{meta.label}</span>
            <span className="font-label-mono text-[#c4c9ac] text-xs font-bold">{currentIndex + 1} / {questions.length}</span>
          </div>
        </header>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 w-full">
          <div className="h-full bg-[#c3f400] transition-all duration-300 shadow-[0_0_10px_rgba(195,244,0,0.6)]" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 pt-4 max-w-md mx-auto w-full">
          {/* Timer */}
          <div className="w-full glass-card p-3 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-1.5 text-xs font-label-mono">
              <span className="flex items-center gap-1 text-[#c4c9ac]"><Zap className="w-3.5 h-3.5 text-[#c3f400]" /> TIME REMAINING</span>
              <span className={timeLeft <= 5 ? "text-rose-400 font-bold animate-pulse text-sm" : "text-[#c3f400] font-bold text-sm"}>{timeLeft}s</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c3f400] to-[#00e3fd] transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(195,244,0,0.4)]" style={{ width: `${timerProgress}%` }} />
            </div>
          </div>

          {/* Flag */}
          <div className="text-center glass-card p-6 sm:p-8 rounded-3xl border border-white/15 w-full shadow-[0_0_30px_rgba(0,0,0,0.4)] flex flex-col items-center">
            <div className="flex justify-center items-center h-32 sm:h-40 my-2 w-full">
              <img
                src={getFlagImageUrl(question.correctAnswer, question.flagEmoji)}
                alt="Country Flag"
                className="h-full max-w-full object-contain rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.7)] border border-white/20"
                onError={(e) => {
                  // Fallback to flag Emoji if image network request fails
                  (e.target as HTMLElement).style.display = 'none';
                  const fallbackEl = (e.target as HTMLElement).nextElementSibling;
                  if (fallbackEl) (fallbackEl as HTMLElement).style.display = 'block';
                }}
              />
              <span className="hidden text-[90px] sm:text-[110px] leading-none select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
                {question.flagEmoji}
              </span>
            </div>
            <p className="text-[#c4c9ac] text-xs mt-3 font-label-caps uppercase tracking-widest">Which country flag is this?</p>
          </div>

          {/* Options */}
          <div className="w-full grid grid-cols-2 gap-3">
            {question.options.map((option) => {
              let btnClass = "border-white/10 glass-card text-white hover:border-[#c3f400]/40 active:scale-95";
              if (selected !== null) {
                if (option === question.correctAnswer) btnClass = "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                else if (option === selected) btnClass = "border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                else btnClass = "border-white/5 bg-white/5 opacity-40 text-white/40";
              }
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={selected !== null}
                  className={`py-4 px-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all shadow-md ${btnClass}`}
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
            <span className="font-label-caps text-sm text-white font-bold tracking-widest uppercase">RESULTS</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center px-6 gap-6 pt-4 max-w-md mx-auto w-full">
          {error ? (
            <div className="text-center py-12">
              <p className="text-rose-400 font-bold">{error}</p>
              <button onClick={() => router.push("/games")} className="mt-4 text-[#c3f400] text-sm underline font-label-caps">Back to Games</button>
            </div>
          ) : (
            <>
              <div className="text-center glass-card p-6 rounded-3xl border border-white/15 w-full">
                <div className="text-6xl mb-3">{percentage >= 80 ? "🏆" : percentage >= 50 ? "⚽" : "🏳️"}</div>
                <p className="font-display-score text-5xl text-white">{totalPoints} <span className="text-[#c3f400] text-2xl font-label-caps font-bold">PTS</span></p>
                {streakBonus > 0 && <p className="text-amber-400 text-xs font-label-caps font-bold mt-1">+{streakBonus} STREAK BONUS 🔥</p>}
                <p className="text-[#c4c9ac] text-xs font-label-mono mt-2">{correctCount}/{questions.length} Correct · {percentage}% Accuracy</p>
              </div>

              <div className="w-full space-y-2">
                {answers.map((a, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm glass-card ${
                    a.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"
                  }`}>
                    <div className="flex items-center gap-3">
                      {a.correct
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <img
                        src={getFlagImageUrl(a.correctAnswer, "")}
                        alt={a.correctAnswer}
                        className="w-6 h-4 object-cover rounded shadow border border-white/20 shrink-0"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <span className="text-white text-xs font-medium">{a.correctAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-label-mono text-[#c4c9ac]">
                      <span>{a.timeSpent}s</span>
                      <span className={a.correct ? "text-[#c3f400] font-bold" : "text-white/20"}>
                        +{resultItems[i]?.points ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full flex flex-col gap-3 pt-2">
                <button
                  onClick={() => { setPhase("pick"); setAnswers([]); setCurrentIndex(0); }}
                  className="w-full py-3.5 glass-card border border-white/15 rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider text-white hover:border-[#c3f400]/40 transition-colors"
                >
                  Try Another Difficulty
                </button>
                <button
                  onClick={() => router.push("/games")}
                  className="w-full py-4 bg-[#c3f400] text-[#161e00] hover:bg-[#b5e300] rounded-2xl font-label-caps font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(195,244,0,0.3)]"
                >
                  Back to Games Hub
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
