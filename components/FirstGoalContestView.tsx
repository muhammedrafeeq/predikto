"use client";

import React, { useState, useEffect } from "react";
import { Clock, Trophy, Target, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react";

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
          className="w-full h-2 appearance-none rounded-full cursor-pointer bg-white/10"
          style={{
            background: `linear-gradient(to right, #f59e0b ${((value - 1) / 89) * 100}%, rgba(255,255,255,0.1) ${((value - 1) / 89) * 100}%)`,
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 12px rgba(245,158,11,0.6);
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
          }
          input[type=range]::-moz-range-thumb {
            width: 20px;
            height: 20px;
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
        className="min-w-[60px] text-center px-3 py-1.5 rounded-xl border border-amber-400/40 font-black text-amber-400 text-lg tabular-nums"
        style={{ background: "rgba(245,158,11,0.08)" }}
      >
        {value}&apos;
      </div>
    </div>
  );
}

function PointsBadge({ diff }: { diff: number | null }) {
  if (diff === null) return null;
  if (diff === 0) return <span className="text-[9px] font-black text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">EXACT +20</span>;
  if (diff <= 2) return <span className="text-[9px] font-black text-green-300 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/25">±2 min +15</span>;
  if (diff <= 5) return <span className="text-[9px] font-black text-sky-300 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/25">±5 min +10</span>;
  if (diff <= 10) return <span className="text-[9px] font-black text-violet-300 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/25">±10 min +5</span>;
  return <span className="text-[9px] font-black text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Miss +0</span>;
}

export default function FirstGoalContestView({ contestId }: { contestId: number }) {
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [pastPredictions, setPastPredictions] = useState<PastPrediction[]>([]);
  const [minuteValues, setMinuteValues] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/contests/${contestId}/matches`);
        if (res.ok) {
          const data = await res.json();
          setUpcomingMatches(data.matches || []);
          setPastPredictions(data.pastPredictions || []);

          // Init minute values at 45 for each unpredicted match
          const init: Record<number, number> = {};
          if (data.matches) {
            for (const m of data.matches) {
              if (m.userPrediction === null) {
                init[m.id] = 45;
              }
            }
          }
          setMinuteValues(init);
        }
      } catch (err) {
        console.error("Failed to load first goal data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contestId]);

  async function handleSubmit(matchId: number) {
    const minute = minuteValues[matchId];
    if (!minute) return;

    setSubmitting((s) => ({ ...s, [matchId]: true }));
    setErrors((e) => ({ ...e, [matchId]: "" }));

    try {
      const res = await fetch(`/api/contests/${contestId}/first-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, predictedMinute: minute }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setErrors((e) => ({ ...e, [matchId]: data.error ?? "Failed to submit" }));
      } else {
        setSubmitted((s) => ({ ...s, [matchId]: true }));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points guide */}
      <section className="text-center p-4 border border-white/5 rounded-2xl surface-glass-1">
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Scoring System</h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Exact", pts: "20 pts", color: "text-amber-400", border: "border-amber-400/25", bg: "bg-amber-400/5" },
            { label: "±2 min", pts: "15 pts", color: "text-green-400", border: "border-green-400/20", bg: "bg-green-400/5" },
            { label: "±5 min", pts: "10 pts", color: "text-sky-400", border: "border-sky-400/20", bg: "bg-sky-400/5" },
            { label: "±10 min", pts: "5 pts", color: "text-violet-400", border: "border-violet-400/20", bg: "bg-violet-400/5" },
          ].map((tier) => (
            <div key={tier.label} className={`rounded-xl border ${tier.border} ${tier.bg} p-2 text-center`}>
              <div className={`text-[11px] font-black ${tier.color}`}>{tier.pts}</div>
              <div className="text-[9px] text-white/30 mt-0.5">{tier.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Predict Now */}
      {predictableMatches.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Predict Now
          </h3>
          <div className="space-y-4">
            {predictableMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl border border-amber-400/10 overflow-hidden surface-glass-1 shadow-md"
              >
                <div className="p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/40">
                    <span>{formatDateTime(match.matchTime)}</span>
                    <span className="text-amber-400/60">Cutoff: {formatDateTime(match.deadline)}</span>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between my-2 font-black text-sm">
                    <span>{match.teamHome}</span>
                    <span className="text-[9px] text-white/30 border border-white/8 px-2 py-0.5 rounded-full bg-white/5">VS</span>
                    <span>{match.teamAway}</span>
                  </div>

                  {/* Slider */}
                  <div className="my-2">
                    <p className="text-[10px] text-white/40 mb-2 font-semibold">Select predicted first goal minute:</p>
                    <MinutePicker
                      value={minuteValues[match.id] ?? 45}
                      onChange={(v) => setMinuteValues((prev) => ({ ...prev, [match.id]: v }))}
                    />
                  </div>

                  {errors[match.id] && (
                    <div className="flex items-center gap-2 text-red-400 text-xs my-1 bg-red-400/5 border border-red-400/20 rounded-xl px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors[match.id]}
                    </div>
                  )}

                  <button
                    onClick={() => handleSubmit(match.id)}
                    disabled={submitting[match.id]}
                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/10"
                  >
                    {submitting[match.id] ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" /> Lock Minute {minuteValues[match.id] ?? 45}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked Matches */}
      {lockedMatches.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 flex items-center gap-2">
            <Lock className="w-3 h-3 text-white/20" /> Unlocks 24h before kickoff
          </h3>
          <div className="space-y-2.5">
            {lockedMatches.map((match) => (
              <div key={match.id} className="rounded-xl border border-white/5 p-3 flex items-center justify-between opacity-40 surface-glass-1">
                <span className="text-xs font-bold text-white">{match.teamHome}</span>
                <span className="text-[10px] text-white/30">{new Date(match.matchTime).toLocaleDateString()}</span>
                <span className="text-xs font-bold text-white">{match.teamAway}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Predicted Matches awaiting results */}
      {predictedUpcoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Awaiting Result
          </h3>
          <div className="space-y-3">
            {predictedUpcoming.map((match) => {
              const prediction = submitted[match.id] ? minuteValues[match.id] : match.userPrediction;
              return (
                <div key={match.id} className="rounded-2xl border border-emerald-400/10 p-4 surface-glass-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-black text-white">
                    <span>{match.teamHome} vs {match.teamAway}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Locked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg border border-amber-400/25 bg-amber-400/5 text-amber-400 text-xs font-black font-mono">
                      {prediction}&apos; predicted
                    </span>
                    <span className="text-[10px] text-white/30">{formatDateTime(match.matchTime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Results */}
      {pastPredictions.filter((p) => p.actualMinute !== null).length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" /> Results
          </h3>
          <div className="space-y-3">
            {pastPredictions
              .filter((p) => p.actualMinute !== null)
              .map((pred) => {
                const diff = pred.actualMinute !== null ? Math.abs(pred.predictedMinute - pred.actualMinute) : null;
                return (
                  <div key={pred.matchId} className="rounded-2xl border border-white/5 p-4 surface-glass-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-black text-white">
                      <span>{pred.teamHome} vs {pred.teamAway}</span>
                      <PointsBadge diff={diff} />
                    </div>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="px-2.5 py-1 rounded-lg border border-white/10 text-white/50 text-xs font-mono">
                        Guess: {pred.predictedMinute}&apos;
                      </span>
                      <span className="px-2.5 py-1 rounded-lg border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-mono">
                        Actual: {pred.actualMinute}&apos;
                      </span>
                      <span className="ml-auto text-amber-400 font-black text-xs flex items-center gap-0.5">
                        <Trophy className="w-3.5 h-3.5" /> {pred.points} pts
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {predictableMatches.length === 0 && predictedUpcoming.length === 0 && pastPredictions.length === 0 && (
        <div className="text-center py-16 text-white/30 surface-glass-1 border border-white/5 rounded-2xl">
          <Clock className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm font-semibold">No matches scheduled in this tournament yet.</p>
        </div>
      )}
    </div>
  );
}
