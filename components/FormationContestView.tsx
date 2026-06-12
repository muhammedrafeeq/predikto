"use client";

import React, { useState, useEffect } from "react";
import { Users, Trophy, CheckCircle, AlertCircle, Loader2, ChevronRight, Lock } from "lucide-react";

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"];

interface UserPrediction {
  homeFormation?: string | null;
  awayFormation?: string | null;
}

interface UpcomingMatch {
  id: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  deadline: string;
  userPrediction: UserPrediction | null;
  locked: boolean;
}

interface PastPrediction {
  matchId: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  matchStatus: string;
  predictedHome: string | null;
  predictedAway: string | null;
  actualHome: string | null;
  actualAway: string | null;
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

function FormationDiagram({ formation }: { formation: string }) {
  const rows = formation.split("-").map(Number);
  const goalkeeper = 1;
  const allRows = [goalkeeper, ...rows];

  return (
    <div className="flex flex-col-reverse gap-1 items-center w-full py-1">
      {allRows.map((count, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 justify-center">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border border-violet-400/50 flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.15)" }}
            >
              <div className="w-1 h-1 rounded-full bg-violet-400" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FormationSelector({
  label,
  teamName,
  selected,
  onSelect,
}: {
  label: string;
  teamName: string;
  selected: string | null | undefined;
  onSelect: (f: string | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black text-white/70">{teamName}</p>
        <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {FORMATIONS.map((f) => {
          const isSelected = selected === f;
          return (
            <button
              key={f}
              onClick={() => onSelect(isSelected ? null : f)}
              className="rounded-xl border py-2 px-1 text-center transition-all duration-150 active:scale-95 cursor-pointer"
              style={
                isSelected
                  ? {
                      borderColor: "rgba(167,139,250,0.6)",
                      background: "rgba(167,139,250,0.15)",
                      boxShadow: "0 0 12px rgba(167,139,250,0.2)",
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                    }
              }
            >
              <span className={`text-[11px] font-black block tabular-nums ${isSelected ? "text-violet-300" : "text-white/40"}`}>
                {f}
              </span>
              {isSelected && (
                <div className="mt-1">
                  <FormationDiagram formation={f} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormationBadge({
  predicted,
  actual,
}: {
  predicted: string | null;
  actual: string | null;
}) {
  if (!predicted) {
    return <span className="text-[10px] text-white/20 font-semibold">Not predicted</span>;
  }
  if (actual === null) {
    return (
      <span className="text-[10px] font-black text-white/50 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
        {predicted} — awaiting
      </span>
    );
  }
  const correct = predicted === actual;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
          correct
            ? "text-green-300 bg-green-400/10 border-green-400/25"
            : "text-red-300 bg-red-400/8 border-red-400/20"
        }`}
      >
        {predicted}
      </span>
      <ChevronRight className="w-3 h-3 text-white/20" />
      <span className="text-[10px] font-black text-white/60">{actual}</span>
      {correct && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
    </div>
  );
}

export default function FormationContestView({ contestId }: { contestId: number }) {
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [pastPredictions, setPastPredictions] = useState<PastPrediction[]>([]);
  const [selections, setSelections] = useState<Record<number, { home: string | null; away: string | null }>>({});
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
        }
      } catch (err) {
        console.error("Failed to load formation data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contestId]);

  function setHome(matchId: number, value: string | null) {
    setSelections((prev) => ({
      ...prev,
      [matchId]: { home: value, away: prev[matchId]?.away ?? null },
    }));
  }

  function setAway(matchId: number, value: string | null) {
    setSelections((prev) => ({
      ...prev,
      [matchId]: { home: prev[matchId]?.home ?? null, away: value },
    }));
  }

  async function handleSubmit(matchId: number) {
    const sel = selections[matchId];
    if (!sel?.home && !sel?.away) {
      setErrors((e) => ({ ...e, [matchId]: "Select at least one formation to predict." }));
      return;
    }

    setSubmitting((s) => ({ ...s, [matchId]: true }));
    setErrors((e) => ({ ...e, [matchId]: "" }));

    try {
      const res = await fetch(`/api/contests/${contestId}/formation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeFormation: sel.home ?? undefined,
          awayFormation: sel.away ?? undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setErrors((e) => ({ ...e, [matchId]: data.error ?? "Failed to submit" }));
      } else {
        setSubmitted((s) => ({ ...s, [matchId]: true }));
        setUpcomingMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? { ...m, userPrediction: { homeFormation: sel.home, awayFormation: sel.away } }
              : m
          )
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
    (m) => (m.userPrediction !== null || submitted[m.id]) && new Date(m.deadline) > new Date()
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
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Home correct", pts: "+10 pts", color: "text-violet-400", border: "border-violet-400/25", bg: "bg-violet-400/5" },
            { label: "Away correct", pts: "+10 pts", color: "text-violet-400", border: "border-violet-400/25", bg: "bg-violet-400/5" },
            { label: "Both correct", pts: "+20 pts", color: "text-amber-400", border: "border-amber-400/25", bg: "bg-amber-400/5" },
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
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" /> Predict Now
          </h3>
          <div className="space-y-4">
            {predictableMatches.map((match) => (
              <div key={match.id} className="rounded-2xl border border-violet-400/15 overflow-hidden surface-glass-1 shadow-md">
                <div className="p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/40">
                    <span>{formatDateTime(match.matchTime)}</span>
                    <span className="text-violet-400/50">Cutoff: {formatDateTime(match.deadline)}</span>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between my-2 font-black text-sm">
                    <span>{match.teamHome}</span>
                    <span className="text-[9px] text-violet-400 px-2.5 py-0.5 rounded-full border border-violet-400/20 bg-violet-400/5">VS</span>
                    <span>{match.teamAway}</span>
                  </div>

                  {/* Formations */}
                  <div className="space-y-4 my-2">
                    <FormationSelector
                      label="Home Formation"
                      teamName={match.teamHome}
                      selected={selections[match.id]?.home ?? null}
                      onSelect={(f) => setHome(match.id, f)}
                    />
                    <div className="border-t border-white/5" />
                    <FormationSelector
                      label="Away Formation"
                      teamName={match.teamAway}
                      selected={selections[match.id]?.away ?? null}
                      onSelect={(f) => setAway(match.id, f)}
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
                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-400/10"
                  >
                    {submitting[match.id] ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" /> Lock Formations
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

      {/* Predicted Matches Awaiting Results */}
      {predictedUpcoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white/35 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Awaiting Result
          </h3>
          <div className="space-y-3">
            {predictedUpcoming.map((match) => {
              const pred = submitted[match.id]
                ? selections[match.id]
                : match.userPrediction
                ? {
                    home: match.userPrediction.homeFormation ?? null,
                    away: match.userPrediction.awayFormation ?? null,
                  }
                : null;
              return (
                <div key={match.id} className="rounded-2xl border border-emerald-400/10 p-4 surface-glass-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-black text-white">
                    <span>{match.teamHome} vs {match.teamAway}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Locked</span>
                  </div>
                  <div className="space-y-1 text-xs font-bold text-white/60">
                    {pred?.home && (
                      <p>Home formation: <span className="text-violet-300 font-black">{pred.home}</span></p>
                    )}
                    {pred?.away && (
                      <p>Away formation: <span className="text-violet-300 font-black">{pred.away}</span></p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {predictableMatches.length === 0 && predictedUpcoming.length === 0 && lockedMatches.length === 0 && (
        <div className="text-center py-16 text-white/30 surface-glass-1 border border-white/5 rounded-2xl">
          <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm font-semibold">No matches scheduled in this tournament yet.</p>
        </div>
      )}
    </div>
  );
}
