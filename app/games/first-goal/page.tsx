"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Trophy, Target, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react";

interface UpcomingMatch {
  id: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  deadline: string;
  userPrediction: number | null;
  locked: boolean;
}

interface PastPrediction {
  matchId: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  matchStatus: string;
  predictedMinute: number;
  actualMinute: number | null;
  points: number;
  playedAt: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MinutePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-10 h-10 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400 font-black text-lg flex items-center justify-center hover:bg-amber-400/20 active:scale-95 transition-all select-none"
        aria-label="Decrease minute"
      >
        −
      </button>

      <div className="relative flex-1">
        <input
          type="range"
          min={1}
          max={90}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #f59e0b ${((value - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((value - 1) / 89) * 100}%)`,
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 12px rgba(245,158,11,0.6);
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
          }
          input[type=range]::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 12px rgba(245,158,11,0.6);
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
          }
        `}</style>
      </div>

      <button
        onClick={() => onChange(Math.min(90, value + 1))}
        className="w-10 h-10 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400 font-black text-lg flex items-center justify-center hover:bg-amber-400/20 active:scale-95 transition-all select-none"
        aria-label="Increase minute"
      >
        +
      </button>

      <div
        className="min-w-14 text-center px-3 py-1.5 rounded-xl border border-amber-400/40 font-black text-amber-400 text-xl tabular-nums"
        style={{ background: "rgba(245,158,11,0.08)" }}
      >
        {value}&apos;
      </div>
    </div>
  );
}

function PointsBadge({ diff }: { diff: number | null }) {
  if (diff === null) return null;
  if (diff === 0) return <span className="text-[10px] font-black text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">EXACT +20</span>;
  if (diff <= 2) return <span className="text-[10px] font-black text-green-300 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/25">±2 min +15</span>;
  if (diff <= 5) return <span className="text-[10px] font-black text-sky-300 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/25">±5 min +10</span>;
  if (diff <= 10) return <span className="text-[10px] font-black text-violet-300 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/25">±10 min +5</span>;
  return <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Miss +0</span>;
}

export default function FirstGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [pastPredictions, setPastPredictions] = useState<PastPrediction[]>([]);
  const [minuteValues, setMinuteValues] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games/first-goal");
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          return;
        }
        const data = await res.json() as { matches: UpcomingMatch[]; pastPredictions: PastPrediction[] };
        setUpcomingMatches(data.matches);
        setPastPredictions(data.pastPredictions);

        // Init minute values at 45 for each unpredicted match
        const init: Record<number, number> = {};
        for (const m of data.matches) {
          if (m.userPrediction === null) {
            init[m.id] = 45;
          }
        }
        setMinuteValues(init);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleSubmit(matchId: number) {
    const minute = minuteValues[matchId];
    if (!minute) return;

    setSubmitting((s) => ({ ...s, [matchId]: true }));
    setErrors((e) => ({ ...e, [matchId]: "" }));

    try {
      const res = await fetch("/api/games/first-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, predictedMinute: minute }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setErrors((e) => ({ ...e, [matchId]: data.error ?? "Failed to submit" }));
      } else {
        setSubmitted((s) => ({ ...s, [matchId]: true }));
        // Update match to show prediction
        setUpcomingMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, userPrediction: minute } : m))
        );
      }
    } catch {
      setErrors((e) => ({ ...e, [matchId]: "Network error. Please try again." }));
    } finally {
      setSubmitting((s) => ({ ...s, [matchId]: false }));
    }
  }

  const predictableMatches = upcomingMatches.filter(
    (m) => m.userPrediction === null && !submitted[m.id] && new Date(m.deadline) > new Date() && !m.locked
  );
  const lockedMatches = upcomingMatches.filter(
    (m) => m.locked && m.userPrediction === null && !submitted[m.id]
  );
  const predictedUpcoming = upcomingMatches.filter(
    (m) => m.userPrediction !== null || submitted[m.id]
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 border-b border-white/5"
        style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)" }}
      >
        <button
          onClick={() => router.push("/games")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-white font-black text-sm">First Goal Timer</span>
        </div>
        <div className="w-16" />
      </header>

      {loading ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : (
        <main className="max-w-lg mx-auto px-4 pt-6 space-y-8">

          {/* Hero */}
          <section className="fade-up text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/20 mb-4"
              style={{ background: "rgba(245,158,11,0.06)" }}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Per-Match Game</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-2">First Goal Timer</h1>
            <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
              Predict the minute the first goal is scored. The closer you are, the more points you earn.
            </p>

            {/* Points guide */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                { label: "Exact", pts: "20 pts", color: "text-amber-400", border: "border-amber-400/25", bg: "bg-amber-400/5" },
                { label: "±2 min", pts: "15 pts", color: "text-green-400", border: "border-green-400/20", bg: "bg-green-400/5" },
                { label: "±5 min", pts: "10 pts", color: "text-sky-400", border: "border-sky-400/20", bg: "bg-sky-400/5" },
                { label: "±10 min", pts: "5 pts", color: "text-violet-400", border: "border-violet-400/20", bg: "bg-violet-400/5" },
              ].map((tier) => (
                <div key={tier.label} className={`rounded-xl border ${tier.border} ${tier.bg} p-2.5 text-center`}>
                  <div className={`text-xs font-black ${tier.color}`}>{tier.pts}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{tier.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Predict Now */}
          {predictableMatches.length > 0 && (
            <section className="fade-up" style={{ animationDelay: "0.08s" }}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Predict Now
              </h2>
              <div className="space-y-4">
                {predictableMatches.map((match, idx) => (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-amber-400/15 overflow-hidden fade-up"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      animationDelay: `${0.1 + idx * 0.07}s`,
                    }}
                  >
                    {/* Top accent */}
                    <div className="h-[1.5px]" style={{ background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)" }} />

                    <div className="p-5">
                      {/* Match header */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                          {formatDateTime(match.matchTime)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider">
                          Deadline: {formatDateTime(match.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between my-4">
                        <span className="text-base font-black text-white">{match.teamHome}</span>
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className="text-[10px] font-black text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/30"
                            style={{ background: "rgba(245,158,11,0.08)" }}
                          >
                            VS
                          </span>
                        </div>
                        <span className="text-base font-black text-white text-right">{match.teamAway}</span>
                      </div>

                      {/* Minute Picker */}
                      <div className="mb-4">
                        <p className="text-[11px] text-white/40 mb-3 font-semibold">
                          Select the minute of the first goal:
                        </p>
                        <MinutePicker
                          value={minuteValues[match.id] ?? 45}
                          onChange={(v) => setMinuteValues((prev) => ({ ...prev, [match.id]: v }))}
                        />
                      </div>

                      {errors[match.id] && (
                        <div className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-400/5 border border-red-400/20 rounded-xl px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {errors[match.id]}
                        </div>
                      )}

                      <button
                        onClick={() => handleSubmit(match.id)}
                        disabled={submitting[match.id]}
                        className="w-full py-3 rounded-xl font-black text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                          background: submitting[match.id]
                            ? "rgba(245,158,11,0.15)"
                            : "linear-gradient(135deg,#f59e0b,#d97706)",
                          color: submitting[match.id] ? "rgba(245,158,11,0.6)" : "#000",
                          boxShadow: submitting[match.id] ? "none" : "0 4px 20px rgba(245,158,11,0.3)",
                        }}
                      >
                        {submitting[match.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            Lock in Minute {minuteValues[match.id] ?? 45}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Locked upcoming matches */}
          {lockedMatches.length > 0 && (
            <section className="fade-up" style={{ animationDelay: "0.12s" }}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Unlocks 24h Before Kick-off
              </h2>
              <div className="space-y-3">
                {lockedMatches.map((match) => (
                  <div key={match.id} className="rounded-2xl border border-white/6 overflow-hidden relative"
                    style={{ background: "rgba(255,255,255,0.015)" }}>
                    <div className="p-4 flex items-center justify-between opacity-40">
                      <span className="text-sm font-black text-white">{match.teamHome}</span>
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] text-white/30">{new Date(match.matchTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <span className="text-sm font-black text-white text-right">{match.teamAway}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Predicted upcoming matches */}
          {predictedUpcoming.length > 0 && (
            <section className="fade-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Awaiting Result
              </h2>
              <div className="space-y-3">
                {predictedUpcoming.map((match) => {
                  const prediction = submitted[match.id]
                    ? minuteValues[match.id]
                    : match.userPrediction;
                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-green-400/10 px-5 py-4"
                      style={{ background: "rgba(74,222,128,0.02)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-white">
                          {match.teamHome} vs {match.teamAway}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-[11px] font-bold text-green-400">Locked</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="px-3 py-1.5 rounded-lg border border-amber-400/25 font-black text-amber-400 text-sm tabular-nums"
                          style={{ background: "rgba(245,158,11,0.08)" }}
                        >
                          {prediction}&apos; predicted
                        </div>
                        <span className="text-[10px] text-white/30">{formatDateTime(match.matchTime)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Past Predictions with results */}
          {pastPredictions.filter((p) => p.actualMinute !== null).length > 0 && (
            <section className="fade-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                Results
              </h2>
              <div className="space-y-3">
                {pastPredictions
                  .filter((p) => p.actualMinute !== null)
                  .map((pred) => {
                    const diff = pred.actualMinute !== null
                      ? Math.abs(pred.predictedMinute - pred.actualMinute)
                      : null;
                    return (
                      <div
                        key={pred.matchId}
                        className="rounded-2xl border border-white/8 px-5 py-4"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black text-white">
                            {pred.teamHome} vs {pred.teamAway}
                          </span>
                          <PointsBadge diff={diff} />
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-sm font-bold tabular-nums"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                          >
                            Your guess: {pred.predictedMinute}&apos;
                          </div>
                          <div
                            className="px-3 py-1.5 rounded-lg border border-amber-400/25 text-amber-400 text-sm font-bold tabular-nums"
                            style={{ background: "rgba(245,158,11,0.06)" }}
                          >
                            Actual: {pred.actualMinute}&apos;
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-400 font-black text-sm">{pred.points} pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {predictableMatches.length === 0 && predictedUpcoming.length === 0 && pastPredictions.length === 0 && (
            <div className="text-center py-20 fade-up" style={{ animationDelay: "0.1s" }}>
              <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">No upcoming matches available right now.</p>
              <p className="text-white/20 text-xs mt-1">Check back when matches are scheduled.</p>
            </div>
          )}

          {predictableMatches.length === 0 && upcomingMatches.length > 0 && (
            <div className="text-center py-6 fade-up" style={{ animationDelay: "0.15s" }}>
              <CheckCircle className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
              <p className="text-white/30 text-sm">You&apos;ve predicted all available matches!</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
