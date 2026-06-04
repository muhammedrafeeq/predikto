"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Trophy, CheckCircle, AlertCircle, Loader2, ChevronRight, Lock } from "lucide-react";

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

/** Simple visual formation diagram */
function FormationDiagram({ formation }: { formation: string }) {
  const rows = formation.split("-").map(Number);
  const goalkeeper = 1;
  const allRows = [goalkeeper, ...rows];

  return (
    <div className="flex flex-col-reverse gap-1 items-center w-full py-1">
      {allRows.map((count, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5 justify-center">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-violet-400/50 flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.15)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
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
        <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {FORMATIONS.map((f) => {
          const isSelected = selected === f;
          return (
            <button
              key={f}
              onClick={() => onSelect(isSelected ? null : f)}
              className="rounded-xl border py-2.5 px-1 text-center transition-all duration-150 active:scale-95"
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
              <span
                className={`text-xs font-black block tabular-nums ${isSelected ? "text-violet-300" : "text-white/40"}`}
              >
                {f}
              </span>
              {isSelected && (
                <div className="mt-1.5">
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

export default function FormationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [pastPredictions, setPastPredictions] = useState<PastPrediction[]>([]);
  const [selections, setSelections] = useState<Record<number, { home: string | null; away: string | null }>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games/formation");
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          return;
        }
        const data = await res.json() as {
          matches: UpcomingMatch[];
          pastPredictions: PastPrediction[];
        };
        setUpcomingMatches(data.matches);
        setPastPredictions(data.pastPredictions);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
      const res = await fetch("/api/games/formation", {
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
    (m) => m.userPrediction !== null || submitted[m.id]
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
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
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-white font-black text-sm">Formation Predictor</span>
        </div>
        <div className="w-16" />
      </header>

      {loading ? (
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : (
        <main className="max-w-lg mx-auto px-4 pt-6 space-y-8">

          {/* Hero */}
          <section className="fade-up text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-400/20 mb-4"
              style={{ background: "rgba(167,139,250,0.06)" }}
            >
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Per-Match Game</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Formation Predictor</h1>
            <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
              Predict the starting formation for home and/or away team. Earn 10 pts for each correct formation.
            </p>

            {/* Points guide */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Home correct", pts: "+10 pts", color: "text-violet-400", border: "border-violet-400/25", bg: "bg-violet-400/5" },
                { label: "Away correct", pts: "+10 pts", color: "text-violet-400", border: "border-violet-400/25", bg: "bg-violet-400/5" },
                { label: "Both correct", pts: "+20 pts", color: "text-amber-400", border: "border-amber-400/25", bg: "bg-amber-400/5" },
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
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                Predict Now
              </h2>
              <div className="space-y-5">
                {predictableMatches.map((match, idx) => (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-violet-400/15 overflow-hidden fade-up"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      animationDelay: `${0.1 + idx * 0.07}s`,
                    }}
                  >
                    {/* Top accent */}
                    <div className="h-[1.5px]" style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.6),transparent)" }} />

                    <div className="p-5">
                      {/* Match info */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                          {formatDateTime(match.matchTime)}
                        </span>
                        <span className="text-[10px] font-bold text-violet-400/50 uppercase tracking-wider">
                          Deadline: {formatDateTime(match.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 mb-5">
                        <span className="text-base font-black text-white">{match.teamHome}</span>
                        <span
                          className="text-[10px] font-black text-violet-400 px-2.5 py-1 rounded-full border border-violet-400/30"
                          style={{ background: "rgba(167,139,250,0.08)" }}
                        >
                          VS
                        </span>
                        <span className="text-base font-black text-white text-right">{match.teamAway}</span>
                      </div>

                      {/* Formation selectors */}
                      <div className="space-y-5">
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
                        <div className="flex items-center gap-2 text-red-400 text-xs mt-4 bg-red-400/5 border border-red-400/20 rounded-xl px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {errors[match.id]}
                        </div>
                      )}

                      <button
                        onClick={() => handleSubmit(match.id)}
                        disabled={submitting[match.id]}
                        className="w-full mt-5 py-3 rounded-xl font-black text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                          background: submitting[match.id]
                            ? "rgba(167,139,250,0.15)"
                            : "linear-gradient(135deg,#a855f7,#7c3aed)",
                          color: submitting[match.id] ? "rgba(167,139,250,0.6)" : "#fff",
                          boxShadow: submitting[match.id] ? "none" : "0 4px 20px rgba(167,139,250,0.3)",
                        }}
                      >
                        {submitting[match.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4" />
                            Lock in Formation
                            {selections[match.id]?.home && !selections[match.id]?.away && " (Home only)"}
                            {!selections[match.id]?.home && selections[match.id]?.away && " (Away only)"}
                            {selections[match.id]?.home && selections[match.id]?.away && " (Both teams)"}
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
                  <div key={match.id} className="rounded-2xl border border-white/6 overflow-hidden"
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

          {/* Awaiting results */}
          {predictedUpcoming.length > 0 && (
            <section className="fade-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Awaiting Result
              </h2>
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
                    <div
                      key={match.id}
                      className="rounded-2xl border border-green-400/10 px-5 py-4"
                      style={{ background: "rgba(74,222,128,0.02)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-white">
                          {match.teamHome} vs {match.teamAway}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-[11px] font-bold text-green-400">Locked</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {pred?.home && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 w-12 shrink-0">Home</span>
                            <span
                              className="text-[11px] font-black text-violet-300 px-2 py-0.5 rounded-lg border border-violet-400/20 tabular-nums"
                              style={{ background: "rgba(167,139,250,0.08)" }}
                            >
                              {pred.home}
                            </span>
                          </div>
                        )}
                        {pred?.away && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 w-12 shrink-0">Away</span>
                            <span
                              className="text-[11px] font-black text-violet-300 px-2 py-0.5 rounded-lg border border-violet-400/20 tabular-nums"
                              style={{ background: "rgba(167,139,250,0.08)" }}
                            >
                              {pred.away}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Past predictions with results */}
          {pastPredictions.filter((p) => p.actualHome !== null || p.actualAway !== null).length > 0 && (
            <section className="fade-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                Results
              </h2>
              <div className="space-y-3">
                {pastPredictions
                  .filter((p) => p.actualHome !== null || p.actualAway !== null)
                  .map((pred) => (
                    <div
                      key={pred.matchId}
                      className="rounded-2xl border border-white/8 px-5 py-4"
                      style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-white">
                          {pred.teamHome} vs {pred.teamAway}
                        </span>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-violet-400 font-black text-sm">{pred.points} pts</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-white/30 font-bold w-12 shrink-0">HOME</span>
                          <FormationBadge predicted={pred.predictedHome} actual={pred.actualHome} />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-white/30 font-bold w-12 shrink-0">AWAY</span>
                          <FormationBadge predicted={pred.predictedAway} actual={pred.actualAway} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {predictableMatches.length === 0 && predictedUpcoming.length === 0 && pastPredictions.length === 0 && (
            <div className="text-center py-20 fade-up" style={{ animationDelay: "0.1s" }}>
              <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
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
