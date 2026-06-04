"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, RefreshCw } from "lucide-react";

const Icon3dPenalty = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="ball-top" cx="38%" cy="32%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ball-body" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#15803d" />
      </radialGradient>
      <filter id="ball-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4ade80" floodOpacity="0.5" />
      </filter>
    </defs>
    {/* Shadow ellipse */}
    <ellipse cx="40" cy="72" rx="16" ry="4" fill="#4ade80" opacity="0.18" />
    {/* Ball body */}
    <circle cx="40" cy="36" r="26" fill="url(#ball-body)" filter="url(#ball-shadow)" />
    {/* Pentagon patches */}
    <path d="M40 14 l5 4 -2 6 -6 0 -2-6z" fill="#166534" opacity="0.8" />
    <path d="M56 25 l2 6 -5 3 -4-4 2-6z" fill="#166534" opacity="0.8" />
    <path d="M51 47 l-3 5 -6-1 -1-6 5-3z" fill="#166534" opacity="0.8" />
    <path d="M29 47 l-5-3 -1 6 -6 1 -3-5z" fill="#166534" opacity="0.8" />
    <path d="M24 25 l-2 6 4 4 -5-3z" fill="#166534" opacity="0.7" />
    {/* Shine */}
    <circle cx="33" cy="27" r="7" fill="url(#ball-top)" />
    {/* Goal post - bottom */}
    <rect x="14" y="60" width="52" height="4" rx="2" fill="#d1d5db" />
    <rect x="14" y="56" width="4" height="8" rx="1.5" fill="#9ca3af" />
    <rect x="62" y="56" width="4" height="8" rx="1.5" fill="#9ca3af" />
    <rect x="14" y="56" width="52" height="2" rx="1" fill="#f9fafb" opacity="0.5" />
  </svg>
);

type Direction = "left" | "center" | "right";
type KickPhase = "idle" | "animating" | "result";

interface KickResult {
  kick: Direction;
  goalie: Direction;
  goal: boolean;
}


const DIR_LABEL: Record<Direction, string> = { left: "Left", center: "Centre", right: "Right" };
const DIR_ARROW: Record<Direction, string> = { left: "←", center: "●", right: "→" };
const POINTS_MAP: Record<number, number> = { 5: 20, 4: 15, 3: 10, 2: 5, 1: 2, 0: 0 };

// 3D Goal Scene
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
  const isAnimating = phase === "animating";
  const isResult = phase === "result";
  const showBall = isAnimating || isResult;
  const showGoalie = isAnimating || isResult;

  // Ball target positions (x, y) in goal
  const ballTargets: Record<Direction, [number, number]> = {
    left:   [85,  62],
    center: [150, 72],
    right:  [215, 62],
  };
  const [bx, by] = ballDir ? ballTargets[ballDir] : [150, 72];

  // Goalie dive: translate x + rotate
  const goalieBase = 150;
  const goalieTargetX = goalieDir === "left" ? 90 : goalieDir === "right" ? 210 : 150;
  const goalieRotate = goalieDir === "left" ? -35 : goalieDir === "right" ? 35 : 0;
  const isDiving = goalieDir !== "center" && showGoalie;

  return (
    <svg viewBox="0 0 300 210" className="w-full max-w-sm mx-auto" aria-hidden="true" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.7))" }}>
      <defs>
        {/* Grass gradient */}
        <linearGradient id="grass-g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        {/* Net gradient */}
        <linearGradient id="net-back" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
        </linearGradient>
        {/* Post gradient — gives 3D cylinder feel */}
        <linearGradient id="post-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="35%" stopColor="#f1f5f9" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="post-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        {/* Ball gradient */}
        <radialGradient id="ball-g" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        {/* Floodlight glow */}
        <radialGradient id="floodlight" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Goal flash */}
        <radialGradient id="goal-flash-g" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="save-flash-g" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
        </radialGradient>
        {/* Keeper jersey */}
        <linearGradient id="jersey-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        {/* Keeper glove */}
        <radialGradient id="glove-g" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        {/* Crowd blur */}
        <filter id="crowd-blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        {/* Glow filter for ball */}
        <filter id="ball-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Background: stadium crowd blur ── */}
      <rect x="0" y="0" width="300" height="140" fill="#0f172a" />
      {/* Crowd silhouettes */}
      {[20,45,70,95,120,145,170,195,220,245,270].map((x, i) => (
        <ellipse key={x} cx={x} cy={85 + (i % 3) * 6} rx="10" ry="14"
          fill={["#1e3a5f","#1a3a2e","#3a1a1a","#1a1a3a","#2a1a3a"][i % 5]}
          filter="url(#crowd-blur)" opacity="0.8" />
      ))}
      {/* Floodlight glow from top */}
      <rect x="0" y="0" width="300" height="140" fill="url(#floodlight)" />

      {/* ── Pitch surface ── */}
      <rect x="0" y="145" width="300" height="65" fill="url(#grass-g)" />
      {/* Pitch stripes */}
      {[0,30,60,90,120,150,180,210,240,270].map((x) => (
        <rect key={x} x={x} y="145" width="15" height="65" fill="#ffffff" opacity="0.02" />
      ))}
      {/* Penalty spot */}
      <circle cx="150" cy="185" r="3" fill="#ffffff" opacity="0.4" />
      {/* Penalty arc */}
      <ellipse cx="150" cy="148" rx="40" ry="12" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.15" />
      {/* Goal line */}
      <line x1="45" y1="148" x2="255" y2="148" stroke="#ffffff" strokeWidth="1" opacity="0.2" />

      {/* ── 3D NET (back of goal — drawn first so posts are on top) ── */}
      <rect x="52" y="36" width="196" height="112" fill="url(#net-back)" />
      {/* Vertical net lines */}
      {[65,78,91,104,117,130,143,156,169,182,195,208,221,234].map((x) => (
        <line key={x} x1={x} y1="36" x2={x} y2="148" stroke="#ffffff" strokeWidth="0.6" opacity="0.12" />
      ))}
      {/* Horizontal net lines */}
      {[50,64,78,92,106,120,134].map((y) => (
        <line key={y} x1="52" y1={y} x2="248" y2={y} stroke="#ffffff" strokeWidth="0.6" opacity="0.12" />
      ))}
      {/* Diagonal net lines for 3D depth */}
      {[52,78,104,130,156,182,208,234].map((x) => (
        <line key={x} x1={x} y1="36" x2={x + 8} y2="148" stroke="#ffffff" strokeWidth="0.4" opacity="0.07" />
      ))}

      {/* ── Goal flash on result ── */}
      {isResult && goal !== null && (
        <rect x="52" y="36" width="196" height="112"
          fill={goal ? "url(#goal-flash-g)" : "url(#save-flash-g)"}
          style={{ animation: "goalFlashAnim 0.6s ease forwards" }}
        />
      )}

      {/* ── 3D GOAL POSTS ── */}
      {/* Left post — front face */}
      <rect x="44" y="34" width="10" height="114" fill="url(#post-g)" rx="2" />
      {/* Left post — side face (depth illusion) */}
      <rect x="54" y="36" width="6" height="110" fill="#64748b" opacity="0.6" />
      {/* Right post — front face */}
      <rect x="246" y="34" width="10" height="114" fill="url(#post-g)" rx="2" />
      {/* Right post — side face */}
      <rect x="240" y="36" width="6" height="110" fill="#64748b" opacity="0.6" />
      {/* Crossbar — front face */}
      <rect x="44" y="34" width="212" height="10" fill="url(#post-top)" rx="2" />
      {/* Crossbar — bottom face (3D depth) */}
      <rect x="52" y="44" width="196" height="5" fill="#64748b" opacity="0.5" />
      {/* Post caps (top circles) */}
      <ellipse cx="49" cy="34" rx="5" ry="3" fill="#f1f5f9" />
      <ellipse cx="251" cy="34" rx="5" ry="3" fill="#f1f5f9" />
      {/* Highlight stripe on crossbar */}
      <rect x="50" y="35" width="200" height="2" rx="1" fill="#ffffff" opacity="0.35" />

      {/* ── 3D GOALKEEPER ── */}
      {showGoalie && (
        <g style={{
          transformOrigin: `${goalieBase}px 110px`,
          transform: `translateX(${goalieTargetX - goalieBase}px) rotate(${goalieRotate}deg)`,
          transition: isAnimating
            ? "transform 0.38s cubic-bezier(0.34,1.4,0.64,1)"
            : "none",
        }}>
          {/* Shadow on pitch */}
          <ellipse cx="150" cy="147" rx={isDiving ? 28 : 14} ry="4"
            fill="#000" opacity="0.3"
            style={{ transform: isDiving ? "scaleX(1.5)" : "scaleX(1)" }} />

          {/* Legs */}
          <rect x="140" y="118" width="9" height="24" rx="4"
            fill="#1d4ed8"
            style={{ transformOrigin: "144px 118px",
              transform: isDiving ? "rotate(20deg) translateX(-4px)" : "none",
              transition: "transform 0.38s cubic-bezier(0.34,1.4,0.64,1)" }} />
          <rect x="151" y="118" width="9" height="24" rx="4"
            fill="#1e40af"
            style={{ transformOrigin: "155px 118px",
              transform: isDiving ? "rotate(-15deg) translateX(4px)" : "none",
              transition: "transform 0.38s cubic-bezier(0.34,1.4,0.64,1)" }} />
          {/* Boots */}
          <ellipse cx="144" cy="142" rx="7" ry="4" fill="#111827"
            style={{ transformOrigin: "144px 142px",
              transform: isDiving ? "translateX(-6px)" : "none",
              transition: "transform 0.38s" }} />
          <ellipse cx="156" cy="142" rx="7" ry="4" fill="#111827"
            style={{ transformOrigin: "156px 142px",
              transform: isDiving ? "translateX(6px)" : "none",
              transition: "transform 0.38s" }} />

          {/* Body / jersey */}
          <rect x="135" y="86" width="30" height="34" rx="8" fill="url(#jersey-g)" />
          {/* Jersey stripe */}
          <rect x="148" y="86" width="4" height="34" fill="#fed7aa" opacity="0.25" rx="2" />
          {/* Jersey number */}
          <text x="150" y="107" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff" opacity="0.5" style={{ fontFamily: "sans-serif" }}>1</text>

          {/* Arms */}
          {/* Left arm */}
          <line x1="135" y1="96" x2={isDiving && goalieDir === "left" ? 108 : 122} y2={isDiving && goalieDir === "left" ? 80 : 100}
            stroke="#c2410c" strokeWidth="9" strokeLinecap="round"
            style={{ transition: "x2 0.38s cubic-bezier(0.34,1.4,0.64,1), y2 0.38s cubic-bezier(0.34,1.4,0.64,1)" }} />
          {/* Right arm */}
          <line x1="165" y1="96" x2={isDiving && goalieDir === "right" ? 192 : 178} y2={isDiving && goalieDir === "right" ? 80 : 100}
            stroke="#c2410c" strokeWidth="9" strokeLinecap="round"
            style={{ transition: "x2 0.38s cubic-bezier(0.34,1.4,0.64,1), y2 0.38s cubic-bezier(0.34,1.4,0.64,1)" }} />

          {/* Left glove */}
          <circle cx={isDiving && goalieDir === "left" ? 108 : 122}
            cy={isDiving && goalieDir === "left" ? 80 : 100}
            r="8" fill="url(#glove-g)"
            style={{ transition: "cx 0.38s cubic-bezier(0.34,1.4,0.64,1), cy 0.38s cubic-bezier(0.34,1.4,0.64,1)" }} />
          {/* Right glove */}
          <circle cx={isDiving && goalieDir === "right" ? 192 : 178}
            cy={isDiving && goalieDir === "right" ? 80 : 100}
            r="8" fill="url(#glove-g)"
            style={{ transition: "cx 0.38s cubic-bezier(0.34,1.4,0.64,1), cy 0.38s cubic-bezier(0.34,1.4,0.64,1)" }} />

          {/* Neck */}
          <rect x="145" y="74" width="10" height="14" rx="4" fill="#f3d5a8" />
          {/* Head */}
          <circle cx="150" cy="68" r="16" fill="#f3d5a8" />
          {/* Face shading */}
          <ellipse cx="150" cy="62" rx="8" ry="5" fill="#e8c08a" opacity="0.4" />
          {/* Eyes */}
          <circle cx="145" cy="66" r="2.5" fill="#1c1917" />
          <circle cx="155" cy="66" r="2.5" fill="#1c1917" />
          <circle cx="145.8" cy="65.2" r="0.8" fill="#fff" />
          <circle cx="155.8" cy="65.2" r="0.8" fill="#fff" />
          {/* Mouth (grimace when diving) */}
          {isDiving
            ? <path d="M146 72 Q150 70 154 72" stroke="#8b5e3c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            : <path d="M146 72 Q150 75 154 72" stroke="#8b5e3c" strokeWidth="1.2" fill="none" strokeLinecap="round" />}
          {/* Keeper gloves on hands */}
          <circle cx="145" cy="66" r="2.5" fill="#1c1917" />
          {/* Hair */}
          <path d="M136 62 Q138 52 150 50 Q162 52 164 62" fill="#4b3621" />
          {/* Keeper cap */}
          <rect x="135" y="54" width="30" height="8" rx="4" fill="#15803d" />
          <rect x="130" y="58" width="40" height="4" rx="2" fill="#166534" />
        </g>
      )}

      {/* ── BALL ── */}
      {showBall && (
        <g filter="url(#ball-glow)"
          style={{
            transform: isAnimating
              ? `translate(${bx - 150}px, ${by - 185}px) scale(0.7)`
              : `translate(0px, 0px) scale(1)`,
            transformOrigin: "150px 185px",
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}>
          {/* Ball shadow (at rest) */}
          {!isAnimating && (
            <ellipse cx="150" cy="192" rx="10" ry="4" fill="#000" opacity="0.4" />
          )}
          {/* Ball body */}
          <circle cx="150" cy="185" r="11" fill="url(#ball-g)" />
          {/* Pentagons / patches */}
          <path d="M150 174 l3.5 5.5 h-7z" fill="#111827" />
          <path d="M161 179 l-3 6 h-4 l-1-5z" fill="#111827" opacity="0.7" />
          <path d="M139 179 l3 6 h4 l1-5z" fill="#111827" opacity="0.7" />
          <path d="M142 190 l4-3 8 0 4 3 -3 5 -10 0z" fill="#374151" opacity="0.5" />
          {/* Shine */}
          <ellipse cx="146" cy="181" rx="4" ry="3" fill="#ffffff" opacity="0.55" transform="rotate(-20 146 181)" />
          {/* Spin ring (animated) */}
          <ellipse cx="150" cy="185" rx="11" ry="11" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.4"
            style={{ animation: isAnimating ? "ballSpin 0.3s linear infinite" : "none" }} />
        </g>
      )}

      {/* ── RESULT TEXT ── */}
      {isResult && goal !== null && (
        <text
          x="150" y="26"
          textAnchor="middle"
          fontSize="24" fontWeight="900"
          fill={goal ? "#4ade80" : "#f87171"}
          style={{
            fontFamily: "sans-serif",
            filter: `drop-shadow(0 0 8px ${goal ? "#4ade80" : "#f87171"})`,
            animation: "resultPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {goal ? "⚡ GOAL!" : "🧤 SAVED!"}
        </text>
      )}
    </svg>
  );
}

export default function PenaltyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"menu" | "solo" | "challenge">("menu");

  const [currentKick, setCurrentKick] = useState(0); // 0-4
  const [kicks, setKicks] = useState<Direction[]>([]);
  const [results, setResults] = useState<KickResult[]>([]);
  const [phase, setPhase] = useState<KickPhase>("idle");
  const [animBallDir, setAnimBallDir] = useState<Direction | null>(null);
  const [animGoalieDir, setAnimGoalieDir] = useState<Direction | null>(null);
  const [animGoal, setAnimGoal] = useState<boolean | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [finalGoals, setFinalGoals] = useState(0);
  const [finalPoints, setFinalPoints] = useState(0);
  const [serverGoalieKicks, setServerGoalieKicks] = useState<Direction[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState("");

  const [challengeCreated, setChallengeCreated] = useState<{ challengeId: string; link: string } | null>(null);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const submitKicks = useCallback(async (allKicks: Direction[]) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/games/penalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kicks: allKicks }),
      });
      const data = await res.json();
      setServerGoalieKicks(data.goalieKicks);
      setFinalGoals(data.goals);
      setFinalPoints(data.points);
      if (data.goals >= 4) setConfetti(true);
      setGameOver(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }, []);

  const handleKick = useCallback(
    (dir: Direction) => {
      if (phase !== "idle" || gameOver || submitting) return;

      const newKicks = [...kicks, dir];
      setKicks(newKicks);
      setPhase("animating");
      setAnimBallDir(dir);
      setAnimGoalieDir(null);
      setAnimGoal(null);

      setTimeout(() => {
        // We don't know goalie yet — show after server responds if last kick
        // For live animation per kick use a temp random (visual only, server is authoritative)
        const tempGoalie = (["left", "center", "right"] as Direction[])[Math.floor(Math.random() * 3)];
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
            // Submit to server — server decides true results
            submitKicks(newKicks);
          }
        }, 1200);
      }, 400);
    },
    [phase, gameOver, submitting, kicks, currentKick, submitKicks]
  );

  const createChallenge = useCallback(async () => {
    setCreatingChallenge(true);
    setChallengeError("");
    try {
      const res = await fetch("/api/games/penalty/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kicks, goalieKicks: serverGoalieKicks, goals: finalGoals, points: finalPoints }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChallengeError(data.error ?? "Failed to create challenge");
      } else {
        const link = window.location.origin + "/games/penalty/challenge/" + data.challengeId;
        setChallengeCreated({ challengeId: data.challengeId, link });
      }
    } catch {
      setChallengeError("Network error. Please try again.");
    }
    setCreatingChallenge(false);
  }, [kicks, serverGoalieKicks, finalGoals, finalPoints]);

  useEffect(() => {
    if (gameOver && mode === "challenge" && !challengeCreated && !creatingChallenge && serverGoalieKicks.length === 5) {
      createChallenge();
    }
  }, [gameOver, mode, challengeCreated, creatingChallenge, serverGoalieKicks, createChallenge]);

  const copyLink = useCallback(() => {
    if (!challengeCreated) return;
    navigator.clipboard.writeText(challengeCreated.link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }, [challengeCreated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-8 h-8 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Lobby / Menu Selection screen ───────────────────────────────────────
  if (mode === "menu") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
        <style>{`
          @keyframes iconFloat {
            0%,100% { transform: translateY(0px) rotate(0deg) scale(1); }
            50%      { transform: translateY(-6px) rotate(3deg) scale(1.05); }
          }
          .icon-float { animation: iconFloat 4s ease-in-out infinite; }
        `}</style>
        
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-black text-base">Penalty Shootout</h1>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto w-full">
          <div className="w-24 h-24 mb-6 relative icon-float">
            <Icon3dPenalty />
          </div>

          <h2 className="text-2xl font-black text-white text-center mb-1">Select Game Mode</h2>
          <p className="text-xs text-white/40 text-center mb-8">Test your skills or battle against your friends.</p>

          <div className="flex flex-col gap-4 w-full">
            {/* Solo Mode Button */}
            <button
              onClick={() => {
                setMode("solo");
                setCurrentKick(0);
                setKicks([]);
                setResults([]);
                setGameOver(false);
                setChallengeCreated(null);
              }}
              className="flex flex-col items-start gap-1.5 p-5 rounded-2xl border border-green-400/20 bg-green-400/5 hover:bg-green-400/10 hover:border-green-400/45 transition-all duration-300 text-left w-full group cursor-pointer"
            >
              <span className="text-base font-black text-green-400 flex items-center gap-2">
                ⚽ Play Solo
              </span>
              <span className="text-xs text-white/60">
                Practice penalties against AI goalkeeper. Earn points for the global leaderboard.
              </span>
            </button>

            {/* Multiplayer/Challenge Mode — Coming Soon */}
            <div className="relative flex flex-col items-start gap-1.5 p-5 rounded-2xl border border-white/8 bg-white/[0.02] text-left w-full cursor-not-allowed overflow-hidden">
              {/* Coming Soon badge */}
              <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                Coming Soon
              </span>
              <span className="text-base font-black text-white/30 flex items-center gap-2">
                ⚔️ Challenge a Friend
              </span>
              <span className="text-xs text-white/25">
                Play a round and generate a battle link. Send it to a friend to see if they can beat your score.
              </span>
              {/* Subtle shimmer overlay */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: "linear-gradient(135deg, transparent 60%, rgba(168,85,247,0.04))" }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Game Over screen ──────────────────────────────────────────────────────
  if (gameOver) {
    const trueResults = serverGoalieKicks.length === 5
      ? kicks.map((k, i) => ({ kick: k, goalie: serverGoalieKicks[i], goal: k !== serverGoalieKicks[i] }))
      : results;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden" style={{ background: "#0a0a0f" }}>
        <style>{`
          @keyframes fadeSlide { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          .fade-slide { animation: fadeSlide 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity:1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
          }
          .confetti-piece { position:fixed; animation: confettiFall linear forwards; pointer-events:none; }
        `}</style>

        {/* Confetti */}
        {confetti && Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              top: "-10px",
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              background: ["#4ade80", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa"][Math.floor(Math.random() * 5)],
              animationDuration: `${1.5 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 0.8}s`,
            }}
          />
        ))}

        <div className="w-full max-w-sm fade-slide">
          <button onClick={() => setMode("menu")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>

          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{finalGoals === 5 ? "🏆" : finalGoals >= 3 ? "⚽" : "😤"}</div>
            <h2 className="text-3xl font-black text-white mb-1">{finalGoals}/5 Goals!</h2>
            <p className="text-white/40 text-sm">{finalGoals === 5 ? "Perfect penalty taker!" : finalGoals >= 3 ? "Solid performance!" : "Keep practising!"}</p>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-400/10 border border-green-400/20 mb-6 w-full justify-center">
            <Trophy className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-black text-xl">{finalPoints} points earned</span>
          </div>

          {/* Kick-by-kick breakdown */}
          <div className="space-y-2 mb-6">
            {trueResults.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${r.goal ? "border-green-400/20 bg-green-400/5" : "border-red-400/20 bg-red-400/5"}`}>
                <span className="text-white/60 text-sm font-bold">Kick {i + 1}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white/40 text-xs">You: <span className="text-white font-bold">{DIR_LABEL[r.kick]}</span></span>
                  <span className="text-white/40 text-xs">Keeper: <span className="text-white font-bold">{DIR_LABEL[r.goalie]}</span></span>
                  <span className={`font-black text-sm ${r.goal ? "text-green-400" : "text-red-400"}`}>{r.goal ? "GOAL" : "SAVED"}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/games")}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all mb-3"
          >
            Back to Games Hub
          </button>

          {/* Challenge a Friend */}
          {!challengeCreated ? (
            <div>
              <button
                onClick={createChallenge}
                disabled={creatingChallenge}
                className="w-full py-3 rounded-xl font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
              >
                {creatingChallenge ? "Creating..." : "⚔️ Challenge a Friend"}
              </button>
              {challengeError && (
                <p className="text-red-400 text-xs text-center mt-2">{challengeError}</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-400/20 p-4" style={{ background: "rgba(74,222,128,0.04)" }}>
              <p className="text-green-400 font-black text-center mb-3">Challenge link created!</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-xs font-mono truncate">
                  {challengeCreated.link}
                </span>
                <button
                  onClick={copyLink}
                  className="shrink-0 px-3 py-2 rounded-lg border border-green-400/30 bg-green-400/10 text-green-400 text-xs font-bold hover:bg-green-400/20 transition-all"
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-white/30 text-xs text-center mb-3">⏳ Challenge expires in 48 hours</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`I scored ${finalGoals}/5 in Penalty Shootout! Can you beat me? ${challengeCreated.link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{ background: "#25D366" }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-slide { animation: fadeSlide 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes goalFlashAnim { 0%{opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
        @keyframes resultPop { from{opacity:0;transform:scale(0.4)} to{opacity:1;transform:scale(1)} }
        @keyframes ballSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dirBtnGlow { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0)} 50%{box-shadow:0 0 18px 2px rgba(74,222,128,0.25)} }
        .dir-btn-idle { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .dir-btn-idle:hover { transform: scale(1.06); box-shadow: 0 0 20px rgba(74,222,128,0.2); }
        .dir-btn-idle:active { transform: scale(0.93); }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <button onClick={() => setMode("menu")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-base">Penalty Shootout</h1>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const r = results[i];
            return (
              <div key={i} className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                r === undefined
                  ? i === currentKick
                    ? "border-green-400 bg-green-400/20 text-green-400 scale-110"
                    : "border-white/20 bg-white/5 text-white/30"
                  : r.goal
                    ? "border-green-400 bg-green-400/20 text-green-400"
                    : "border-red-400 bg-red-400/10 text-red-400"
              }`}>
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
          <p className={`text-sm font-bold ${phase === "result" ? (animGoal ? "text-green-400 goal-flash" : "text-red-400 goal-flash") : "text-white/50"}`}>
            {phase === "animating" ? "Ball is flying..." : phase === "result" ? (animGoal ? "⚡ GOAL!" : "🧤 SAVED!") : "Pick your direction"}
          </p>
        </div>

        {/* Goal visualization */}
        <div className="w-full mb-6 rounded-3xl overflow-hidden border border-white/8 p-2" style={{ background: "linear-gradient(180deg,#0f172a,#0a0a0f)" }}>
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
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Submitting result...</span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}

        {/* Score tally */}
        {results.length > 0 && (
          <div className="mt-6 flex items-center gap-2 text-white/30 text-xs font-bold">
            <span className="text-green-400 text-base font-black">{results.filter((r) => r.goal).length}</span>
            <span>goals from</span>
            <span className="text-white/60 text-base font-black">{results.length}</span>
            <span>kicks</span>
          </div>
        )}
      </main>
    </div>
  );
}
