"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Users, ChevronLeft, ChevronRight, Trophy, Target, User,
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

const PredRow = ({
  label,
  icon,
  detail,
}: {
  label: string;
  icon: React.ReactNode;
  detail?: PredictionDetail;
}) => {
  if (!detail) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-3">
          <span className="text-white/30">{icon}</span>
          <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-xs text-white/20 italic">No prediction</span>
      </div>
    );
  }

  const pending = detail.isCorrect === null;
  const correct = detail.isCorrect === true;

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <span className={pending ? "text-white/40" : correct ? "text-emerald-400" : "text-rose-400"}>{icon}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
          <p className="text-sm font-bold text-white">{detail.answer}</p>
          {!pending && !correct && detail.correctAnswer && (
            <p className="text-[10px] text-rose-400/80 mt-0.5">Correct: {detail.correctAnswer}</p>
          )}
        </div>
      </div>
      {pending ? (
        <span className="text-[10px] font-bold text-white/30 bg-white/5 px-2 py-1 rounded-full border border-white/10">Pending</span>
      ) : correct ? (
        <CheckCircle className="w-5 h-5 text-emerald-400" />
      ) : (
        <XCircle className="w-5 h-5 text-rose-400" />
      )}
    </div>
  );
};

export default function MatchEntries({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const matchId = parseInt(id, 10);

  const [match, setMatch] = useState<Match | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch(`/api/admin/matches/${matchId}/entries`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMatch(data.match);
            setEntries(data.entries);
          }
        }
      } catch (err) {
        console.error("Error loading match entries:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntries();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Predictions...</p>
      </div>
    );
  }

  const entry = entries[current];

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/matches")}
        className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors text-sm select-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Match Manager
      </button>

      {/* Match header */}
      {match && (
        <div className="surface-glass-1 rounded-xl p-4 text-center">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
            {new Date(match.matchTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
          </p>
          <h2 className="text-xl font-black text-white tracking-tight">
            {match.teamHome} <span className="text-white/30">vs</span> {match.teamAway}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{entries.length} predictions</span>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="surface-glass-1 rounded-xl p-12 text-center text-white/30">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No predictions submitted yet.</p>
        </div>
      ) : (
        <>
          {/* Pagination indicator */}
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{current + 1} of {entries.length}</span>
            <div className="flex gap-1">
              {entries.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-primary w-4" : "bg-white/20"}`}
                />
              ))}
            </div>
            <span className="font-mono">{entry.userName.split(" ")[0]}</span>
          </div>

          {/* User prediction card */}
          <div
            key={entry.userId}
            className="surface-glass-1 rounded-2xl p-6 flex flex-col gap-5"
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* User info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-black text-sm">
                  {entry.userName[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{entry.userName}</p>
                  <p className="text-[10px] text-white/40 font-mono">{entry.userPhone}</p>
                </div>
              </div>
              {entry.pointsEarned !== null ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-black text-amber-400">{entry.pointsEarned} pts</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-xs font-bold text-white/30">Pending</span>
                </div>
              )}
            </div>

            {/* Predictions */}
            <div className="rounded-xl bg-white/3 border border-white/5 px-4 divide-y divide-white/5">
              <PredRow
                label="Match Winner"
                icon={<Trophy className="w-4 h-4" />}
                detail={entry.predictions.winner}
              />
              <PredRow
                label="Exact Scoreline"
                icon={<Target className="w-4 h-4" />}
                detail={entry.predictions.score}
              />
              <PredRow
                label="Man of the Match"
                icon={<User className="w-4 h-4" />}
                detail={entry.predictions.scorer}
              />
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold text-white/70 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrent((c) => Math.min(entries.length - 1, c + 1))}
              disabled={current === entries.length - 1}
              className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold text-white/70 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
