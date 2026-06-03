"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  User,
} from "lucide-react";

interface PredictionDetail {
  answer: string;
  correctAnswer: string | null;
  isCorrect: boolean | null;
}

interface Entry {
  userId: number;
  userName: string;
  userPhone: string;
  predictions: {
    winner?: PredictionDetail;
    score?: PredictionDetail;
    scorer?: PredictionDetail;
  };
  pointsEarned: number | null;
}

interface Match {
  id: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  deadline: string;
  status: string;
}

export default function MatchEntries({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const matchId = parseInt(id, 10);

  const [match, setMatch] = useState<Match | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch(`/api/admin/matches/${matchId}/entries`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMatch(data.match);
            setEntries(data.entries);
          } else {
            setErrorMsg(data.error || "Failed to load entries");
          }
        } else {
          setErrorMsg("Failed to load match entries");
        }
      } catch (err) {
        console.error("Error loading match entries:", err);
        setErrorMsg("Internal server error");
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, [matchId]);

  const getStatusLabel = (status?: string) => {
    if (!status) return "";
    if (status === "resulted") return "Resulted";
    const isPastDeadline = match && new Date(match.deadline).getTime() <= Date.now();
    return isPastDeadline ? "Closed" : "Open";
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "";
    if (status === "resulted") return "bg-primary/10 text-primary border border-primary/20";
    const isPastDeadline = match && new Date(match.deadline).getTime() <= Date.now();
    return isPastDeadline
      ? "bg-tertiary/10 text-tertiary border border-tertiary/20"
      : "bg-secondary/10 text-secondary border border-secondary/20";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Submission Entries...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back CTA */}
      <button
        onClick={() => router.push("/admin/matches")}
        className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors label-md select-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Match Manager
      </button>

      {/* Match details card */}
      {match && (
        <div className="surface-glass-1 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(match.status)}`}>
              {getStatusLabel(match.status)}
            </span>
            <h2 className="headline-lg text-white font-extrabold tracking-tight mt-2">
              {match.teamHome} vs {match.teamAway}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-on-surface-variant label-sm font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Kickoff: {new Date(match.matchTime).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Deadline: {new Date(match.deadline).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold font-mono">
                Total Submissions
              </span>
              <p className="headline-md font-extrabold text-white font-mono leading-none mt-0.5">
                {entries.length} Tips
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error-container/45 text-error rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Entries Table */}
      <div className="surface-glass-1 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Match Outcome</th>
                <th className="p-4 font-semibold">Scoreline</th>
                <th className="p-4 font-semibold">Top Scorer</th>
                <th className="p-4 font-semibold text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant label-md font-sans">
                    No predictions submitted yet for this match.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-white/5 transition-colors">
                    {/* User */}
                    <td className="p-4">
                      <div className="flex items-center gap-3 font-sans">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="label-md text-white font-bold">{entry.userName}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{entry.userPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Outcome */}
                    <td className="p-4">
                      {entry.predictions.winner ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold">{entry.predictions.winner.answer}</span>
                          {entry.predictions.winner.isCorrect !== null && (
                            <span className={`text-[10px] flex items-center gap-1 font-sans font-bold ${
                              entry.predictions.winner.isCorrect ? "text-secondary" : "text-error"
                            }`}>
                              {entry.predictions.winner.isCorrect ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              {entry.predictions.winner.isCorrect ? "Correct" : `Result: ${entry.predictions.winner.correctAnswer}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/40 italic">Not set</span>
                      )}
                    </td>

                    {/* Scoreline */}
                    <td className="p-4">
                      {entry.predictions.score ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold">{entry.predictions.score.answer}</span>
                          {entry.predictions.score.isCorrect !== null && (
                            <span className={`text-[10px] flex items-center gap-1 font-sans font-bold ${
                              entry.predictions.score.isCorrect ? "text-secondary" : "text-error"
                            }`}>
                              {entry.predictions.score.isCorrect ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              {entry.predictions.score.isCorrect ? "Correct" : `Result: ${entry.predictions.score.correctAnswer}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/40 italic">Not set</span>
                      )}
                    </td>

                    {/* Top Scorer */}
                    <td className="p-4">
                      {entry.predictions.scorer ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold">{entry.predictions.scorer.answer}</span>
                          {entry.predictions.scorer.isCorrect !== null && (
                            <span className={`text-[10px] flex items-center gap-1 font-sans font-bold ${
                              entry.predictions.scorer.isCorrect ? "text-secondary" : "text-error"
                            }`}>
                              {entry.predictions.scorer.isCorrect ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              {entry.predictions.scorer.isCorrect ? "Correct" : `Result: ${entry.predictions.scorer.correctAnswer}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/40 italic">Not set</span>
                      )}
                    </td>

                    {/* Points */}
                    <td className="p-4 text-right">
                      {entry.pointsEarned !== null ? (
                        <span className="text-secondary font-bold text-sm bg-secondary/15 px-3 py-1 rounded-full border border-secondary/20">
                          {entry.pointsEarned} pts
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/50 font-sans text-xs bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
