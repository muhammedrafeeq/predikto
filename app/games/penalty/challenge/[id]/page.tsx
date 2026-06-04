"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

type Direction = "left" | "center" | "right";
type KickPhase = "idle" | "animating" | "result";
type GameState = "idle" | "playing" | "done";

interface KickResult {
  kick: Direction;
  goalie: Direction;
  goal: boolean;
}

interface ChallengeData {
  id: string;
  creatorName: string;
  creatorGoals: number;
  creatorPoints: number;
  creatorKicks: Direction[];
  creatorGoalieKicks: Direction[];
  status: "pending" | "completed";
  challengerName: string | null;
  challengerGoals: number | null;
  challengerPoints: number | null;
  challengerKicks: Direction[] | null;
  challengerGoalieKicks: Direction[] | null;
  expired: boolean;
}

const DIR_LABEL: Record<Direction, string> = { left: "Left", center: "Centre", right: "Right" };
const DIR_ARROW: Record<Direction, string> = { left: "←", center: "●", right: "→" };
function GoalSVG({
  ballDir,
  goalieDir,
  phase,
  goal,
}: {
  ballDir: Direction | null;
  goalieDir: Direction | null;
  phase: KickPhase;
  goal: boolean | null;
}) {
  const ballX = ballDir === "left" ? 80 : ballDir === "right" ? 220 : 150;
  const goalieX = goalieDir === "left" ? 70 : goalieDir === "right" ? 230 : 150;
  const showBall = phase === "animating" || phase === "result";
  const showGoalie = phase === "animating" || phase === "result";

  return (
    <svg viewBox="0 0 300 180" className="w-full max-w-xs mx-auto" aria-hidden="true">
      {/* Pitch */}
      <rect x="10" y="140" width="280" height="30" rx="4" fill="#1a3a1a" />
      <ellipse cx="150" cy="142" rx="60" ry="8" fill="#22502288" />
      {/* Goal posts */}
      <rect x="50" y="40" width="8" height="100" rx="4" fill="#e2e8f0" />
      <rect x="242" y="40" width="8" height="100" rx="4" fill="#e2e8f0" />
      <rect x="50" y="40" width="200" height="8" rx="4" fill="#e2e8f0" />
      {/* Net lines */}
      {[70, 90, 110, 130, 150, 170, 190, 210, 230].map((x) => (
        <line key={x} x1={x} y1="48" x2={x} y2="140" stroke="#ffffff18" strokeWidth="1" />
      ))}
      {[60, 80, 100, 120].map((y) => (
        <line key={y} x1="58" y1={y} x2="242" y2={y} stroke="#ffffff18" strokeWidth="1" />
      ))}
      {/* Goalkeeper */}
      {showGoalie && goalieDir && (
        <g
          style={{
            transform: `translateX(${goalieX - 150}px)`,
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <rect x="136" y="70" width="28" height="44" rx="6" fill="#f59e0b" />
          <circle cx="150" cy="62" r="12" fill="#f3d5a8" />
          <circle cx="132" cy="90" r="7" fill="#fbbf24" />
          <circle cx="168" cy="90" r="7" fill="#fbbf24" />
          <rect x="138" y="114" width="10" height="18" rx="4" fill="#1e40af" />
          <rect x="152" y="114" width="10" height="18" rx="4" fill="#1e40af" />
        </g>
      )}
      {/* Ball */}
      {showBall && (
        <g
          style={{
            transform: `translate(${ballX - 150}px, ${phase === "animating" ? -30 : 0}px)`,
            transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <circle cx="150" cy="125" r="12" fill="#f8fafc" />
          <circle cx="150" cy="125" r="12" fill="none" stroke="#1a1a1a" strokeWidth="1" />
          <path d="M150 113 l4 8 h-8z" fill="#1a1a1a" />
          <path d="M142 121 l4-4 v8 z" fill="#1a1a1a" />
          <path d="M158 121 l-4-4 v8 z" fill="#1a1a1a" />
        </g>
      )}
      {/* Result flash */}
      {phase === "result" && goal !== null && (
        <text
          x="150"
          y="30"
          textAnchor="middle"
          fontSize="22"
          fontWeight="900"
          fill={goal ? "#4ade80" : "#f87171"}
          style={{ fontFamily: "sans-serif" }}
        >
          {goal ? "GOAL!" : "SAVED!"}
        </text>
      )}
    </svg>
  );
}

function KickBreakdown({
  kicks,
  goalieKicks,
  label,
  goals,
  points,
}: {
  kicks: Direction[];
  goalieKicks: Direction[];
  label: string;
  goals: number;
  points: number;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 truncate">{label}</p>
      <div className="text-3xl font-black text-white mb-1">{goals}/5</div>
      <div className="flex items-center gap-1.5 mb-4">
        <Trophy className="w-3.5 h-3.5 text-green-400" />
        <span className="text-green-400 font-bold text-sm">{points} pts</span>
      </div>
      <div className="space-y-1.5">
        {kicks.map((kick, i) => {
          const goal = kick !== goalieKicks[i];
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border text-xs ${
                goal
                  ? "border-green-400/20 bg-green-400/5"
                  : "border-red-400/20 bg-red-400/5"
              }`}
            >
              <span className="text-white/40 font-bold">{i + 1}</span>
              <span className="text-white/60">{DIR_LABEL[kick]}</span>
              <span className={`font-black ${goal ? "text-green-400" : "text-red-400"}`}>
                {goal ? "GOAL" : "SAVED"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [fetchError, setFetchError] = useState("");

  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentKick, setCurrentKick] = useState(0);
  const [kicks, setKicks] = useState<Direction[]>([]);
  const [results, setResults] = useState<KickResult[]>([]);
  const [phase, setPhase] = useState<KickPhase>("idle");
  const [animBallDir, setAnimBallDir] = useState<Direction | null>(null);
  const [animGoalieDir, setAnimGoalieDir] = useState<Direction | null>(null);
  const [animGoal, setAnimGoal] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confetti, setConfetti] = useState(false);

  // Final results after POST
  const [myGoals, setMyGoals] = useState(0);
  const [myPoints, setMyPoints] = useState(0);
  const [myGoalieKicks, setMyGoalieKicks] = useState<Direction[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/games/penalty/challenge/${challengeId}`);
        if (!res.ok) {
          const data = await res.json();
          setFetchError(data.error ?? "Failed to load challenge");
        } else {
          const data: ChallengeData = await res.json();
          setChallenge(data);
          if (data.status === "completed") {
            setGameState("done");
          }
        }
      } catch {
        setFetchError("Network error. Please try again.");
      }
      setLoading(false);
    })();
  }, [challengeId]);

  const submitKicks = useCallback(
    async (allKicks: Direction[]) => {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/games/penalty/challenge/${challengeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kicks: allKicks }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error ?? "Failed to submit kicks");
          setSubmitting(false);
          return;
        }
        const { goals, goalieKicks, points } = data as {
          goals: number;
          goalieKicks: Direction[];
          points: number;
        };
        setMyGoals(goals);
        setMyPoints(points);
        setMyGoalieKicks(goalieKicks);
        if (goals >= 4) setConfetti(true);
        setGameState("done");
      } catch {
        setSubmitError("Network error. Please try again.");
      }
      setSubmitting(false);
    },
    [challengeId]
  );

  const handleKick = useCallback(
    (dir: Direction) => {
      if (phase !== "idle" || gameState !== "playing" || submitting) return;

      const newKicks = [...kicks, dir];
      setKicks(newKicks);
      setPhase("animating");
      setAnimBallDir(dir);
      setAnimGoalieDir(null);
      setAnimGoal(null);

      setTimeout(() => {
        const tempGoalie = (["left", "center", "right"] as Direction[])[
          Math.floor(Math.random() * 3)
        ];
        const tempGoal = dir !== tempGoalie;
        setAnimGoalieDir(tempGoalie);
        setAnimGoal(tempGoal);
        setPhase("result");

        setTimeout(() => {
          const kickResult: KickResult = { kick: dir, goalie: tempGoalie, goal: tempGoal };
          setResults((prev) => [...prev, kickResult]);
          setPhase("idle");
          setAnimBallDir(null);
          setAnimGoalieDir(null);
          setAnimGoal(null);

          const nextKick = currentKick + 1;
          setCurrentKick(nextKick);

          if (nextKick === 5) {
            submitKicks(newKicks);
          }
        }, 1200);
      }, 400);
    },
    [phase, gameState, submitting, kicks, currentKick, submitKicks]
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-8 h-8 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Fetch error ───────────────────────────────────────────────────────────
  if (fetchError || !challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-black text-white mb-2">Challenge Not Found</h2>
          <p className="text-white/40 text-sm mb-6">{fetchError || "This challenge does not exist."}</p>
          <button
            onClick={() => router.push("/games")}
            className="flex items-center gap-2 mx-auto text-white/40 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>
        </div>
      </div>
    );
  }

  // ── Expired ───────────────────────────────────────────────────────────────
  if (challenge.expired && challenge.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-sm">
          <button
            onClick={() => router.push("/games")}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>
          <div className="rounded-2xl border border-red-400/20 p-6 text-center" style={{ background: "rgba(248,113,113,0.04)" }}>
            <div className="text-4xl mb-3">⏰</div>
            <h2 className="text-xl font-black text-white mb-2">Challenge Expired</h2>
            <p className="text-white/40 text-sm">
              {challenge.creatorName}&apos;s challenge has expired. Challenges are only open for 48 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Results (challenge completed — either already was, or just finished) ──
  if (gameState === "done") {
    const isAlreadyCompleted = challenge.status === "completed";
    const myActualGoalieKicks = isAlreadyCompleted
      ? challenge.challengerGoalieKicks!
      : myGoalieKicks;
    const myActualGoals = isAlreadyCompleted ? challenge.challengerGoals! : myGoals;
    const myActualPoints = isAlreadyCompleted ? challenge.challengerPoints! : myPoints;
    const myActualKicks = isAlreadyCompleted ? challenge.challengerKicks! : kicks;
    const myName = isAlreadyCompleted ? challenge.challengerName! : "You";

    const creatorWins = challenge.creatorGoals > myActualGoals;
    const youWin = myActualGoals > challenge.creatorGoals;
    const draw = myActualGoals === challenge.creatorGoals;

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{ background: "#0a0a0f" }}
      >
        <style>{`
          @keyframes fadeSlide { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          .fade-slide { animation: fadeSlide 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity:1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
          }
          .confetti-piece { position:fixed; animation: confettiFall linear forwards; pointer-events:none; }
        `}</style>

        {confetti &&
          Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                background: ["#4ade80", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa"][
                  Math.floor(Math.random() * 5)
                ],
                animationDuration: `${1.5 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 0.8}s`,
              }}
            />
          ))}

        <div className="w-full max-w-md fade-slide">
          <button
            onClick={() => router.push("/games")}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>

          {/* Winner banner */}
          <div
            className={`rounded-2xl border p-4 text-center mb-6 ${
              youWin
                ? "border-green-400/30 bg-green-400/5"
                : creatorWins
                ? "border-red-400/20 bg-red-400/5"
                : "border-yellow-400/20 bg-yellow-400/5"
            }`}
          >
            <div className="text-3xl mb-1">
              {youWin ? "🏆" : creatorWins ? "😤" : "🤝"}
            </div>
            <p
              className={`text-xl font-black ${
                youWin ? "text-green-400" : creatorWins ? "text-red-400" : "text-yellow-400"
              }`}
            >
              {youWin
                ? "You Win! 🏆"
                : creatorWins
                ? `${challenge.creatorName} Wins!`
                : "Draw! 🤝"}
            </p>
          </div>

          {/* Side-by-side breakdown */}
          <div className="flex gap-3">
            <KickBreakdown
              kicks={challenge.creatorKicks}
              goalieKicks={challenge.creatorGoalieKicks}
              label={challenge.creatorName}
              goals={challenge.creatorGoals}
              points={challenge.creatorPoints}
            />
            <KickBreakdown
              kicks={myActualKicks}
              goalieKicks={myActualGoalieKicks}
              label={myName}
              goals={myActualGoals}
              points={myActualPoints}
            />
          </div>

          <button
            onClick={() => router.push("/games")}
            className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all"
          >
            Back to Games Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Idle — prompt to start ────────────────────────────────────────────────
  if (gameState === "idle") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0f" }}>
        <style>{`
          @keyframes fadeSlide { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          .fade-slide { animation: fadeSlide 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        `}</style>
        <div className="w-full max-w-sm fade-slide">
          <button
            onClick={() => router.push("/games")}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>

          <div className="rounded-2xl border border-green-400/20 p-6 text-center mb-6" style={{ background: "rgba(74,222,128,0.04)" }}>
            <div className="text-5xl mb-4">⚔️</div>
            <h2 className="text-2xl font-black text-white mb-2">
              {challenge.creatorName}&apos;s Challenge
            </h2>
            <p className="text-white/40 text-sm mb-4">
              They scored <span className="text-white font-bold">{challenge.creatorGoals}/5</span> goals
              and earned <span className="text-green-400 font-bold">{challenge.creatorPoints} pts</span>.
              Can you beat them?
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs">
              ⏳ Challenge expires 48 hours after creation
            </div>
          </div>

          <button
            onClick={() => setGameState("playing")}
            className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            ⚽ Take the Challenge
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-slide { animation: fadeSlide 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes goalFlash { 0%,100% { opacity:0; } 30%,70% { opacity:1; } }
        .goal-flash { animation: goalFlash 0.8s ease forwards; }
        .dir-btn-idle:hover { transform: scale(1.04); }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button
          onClick={() => router.push("/games")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-base">{challenge.creatorName}&apos;s Challenge</h1>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const r = results[i];
            return (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                  r === undefined
                    ? i === currentKick
                      ? "border-green-400 bg-green-400/20 text-green-400 scale-110"
                      : "border-white/20 bg-white/5 text-white/30"
                    : r.goal
                    ? "border-green-400 bg-green-400/20 text-green-400"
                    : "border-red-400 bg-red-400/10 text-red-400"
                }`}
              >
                {r === undefined ? i + 1 : r.goal ? "✓" : "✗"}
              </div>
            );
          })}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-sm mx-auto w-full">
        {/* Kick counter */}
        <div className="mb-4 text-center fade-slide">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">
            {submitting ? "Calculating..." : phase === "idle" ? `Kick ${currentKick + 1} of 5` : ""}
          </p>
          <p
            className={`text-sm font-bold ${
              phase === "result"
                ? animGoal
                  ? "text-green-400 goal-flash"
                  : "text-red-400 goal-flash"
                : "text-white/50"
            }`}
          >
            {phase === "animating"
              ? "Ball is flying..."
              : phase === "result"
              ? animGoal
                ? "⚡ GOAL!"
                : "🧤 SAVED!"
              : "Pick your direction"}
          </p>
        </div>

        {/* Goal visualization */}
        <div
          className="w-full mb-6 rounded-2xl overflow-hidden border border-white/5 p-4"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <GoalSVG
            ballDir={animBallDir}
            goalieDir={animGoalieDir}
            phase={phase}
            goal={animGoal}
          />
        </div>

        {/* Direction buttons */}
        {!submitting && phase === "idle" && currentKick < 5 && (
          <div className="grid grid-cols-3 gap-3 w-full fade-slide">
            {(["left", "center", "right"] as Direction[]).map((dir) => (
              <button
                key={dir}
                onClick={() => handleKick(dir)}
                className="dir-btn-idle flex flex-col items-center justify-center gap-2 rounded-2xl py-5 border border-green-400/20 bg-green-400/5 text-green-400 hover:bg-green-400/15 hover:border-green-400/40 transition-all duration-200 font-black select-none"
              >
                <span className="text-2xl">{DIR_ARROW[dir]}</span>
                <span className="text-xs uppercase tracking-widest">{DIR_LABEL[dir]}</span>
              </button>
            ))}
          </div>
        )}

        {submitting && (
          <div className="flex items-center gap-3 text-white/40">
            <div className="w-5 h-5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
            <span className="text-sm">Submitting result...</span>
          </div>
        )}

        {submitError && (
          <p className="text-red-400 text-sm mt-4 text-center">{submitError}</p>
        )}

        {/* Score tally */}
        {results.length > 0 && (
          <div className="mt-6 flex items-center gap-2 text-white/30 text-xs font-bold">
            <span className="text-green-400 text-base font-black">
              {results.filter((r) => r.goal).length}
            </span>
            <span>goals from</span>
            <span className="text-white/60 text-base font-black">{results.length}</span>
            <span>kicks</span>
          </div>
        )}
      </main>
    </div>
  );
}

