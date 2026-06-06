"use client";

import React, { useState, useEffect } from "react";
import { Timer, CheckCircle2, Trophy, Lock, Calendar, Zap, ChevronRight, Star } from "lucide-react";

interface Match {
  id: string;
  status: "Open" | "Upcoming" | "Predicted" | "Resulted" | "Locked";
  secondsLeft?: number;
  matchTimestamp: number;
  kickoffTime: string;
  teamHome: string;
  teamAway: string;
  prediction?: string;
  pointsEarned?: number;
  scoreHome?: number;
  scoreAway?: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch", "brazil": "br", "morocco": "ma", "haiti": "ht",
  "scotland": "gb-sct", "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  "germany": "de", "curaçao": "cw", "curacao": "cw", "ivory coast": "ci", "ecuador": "ec",
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn", "belgium": "be",
  "egypt": "eg", "iran": "ir", "new zealand": "nz", "spain": "es", "cape verde": "cv",
  "saudi arabia": "sa", "uruguay": "uy", "france": "fr", "senegal": "sn", "iraq": "iq",
  "norway": "no", "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co", "england": "gb-eng",
  "croatia": "hr", "ghana": "gh", "panama": "pa", "korea republic": "kr", "czechia": "cz",
  "chile": "cl", "peru": "pe", "serbia": "rs", "cameroon": "cm", "nigeria": "ng",
  "thailand": "th", "slovakia": "sk", "venezuela": "ve", "cuba": "cu",
  "man united": "gb-eng", "man city": "gb-eng", "real madrid": "es", "barcelona": "es",
  "liverpool": "gb-eng", "arsenal": "gb-eng", "chelsea": "gb-eng", "tottenham": "gb-eng",
};

const TEAM_ACCENT: Record<string, string> = {
  "brazil": "#22c55e", "argentina": "#38bdf8", "france": "#3b82f6", "germany": "#e5e7eb",
  "spain": "#ef4444", "portugal": "#ef4444", "england": "#ef4444", "netherlands": "#f97316",
  "italy": "#3b82f6", "mexico": "#22c55e", "usa": "#60a5fa", "japan": "#ef4444",
  "morocco": "#22c55e", "senegal": "#22c55e", "croatia": "#ef4444", "uruguay": "#38bdf8",
  "colombia": "#facc15", "belgium": "#ef4444", "canada": "#ef4444", "australia": "#facc15",
  "switzerland": "#ef4444", "nigeria": "#22c55e", "south africa": "#22c55e", "korea republic": "#ef4444",
  "czechia": "#3b82f6", "ghana": "#f59e0b", "ivory coast": "#f97316", "turkey": "#ef4444",
  "egypt": "#ef4444", "iran": "#22c55e", "qatar": "#7c3aed", "iraq": "#22c55e",
  "slovakia": "#3b82f6", "saudi arabia": "#22c55e", "cameroon": "#22c55e", "serbia": "#ef4444",
  "ecuador": "#facc15", "paraguay": "#3b82f6", "algeria": "#22c55e", "honduras": "#3b82f6",
  "venezuela": "#ef4444", "cuba": "#3b82f6", "austria": "#ef4444", "thailand": "#3b82f6",
  "peru": "#ef4444", "new zealand": "#1e293b", "bosnia and herzegovina": "#3b82f6",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

const getAccent = (name: string) => TEAM_ACCENT[name.toLowerCase().trim()] ?? "#a855f7";

const FIRST_N_ALWAYS_OPEN = 2;
const UNLOCK_BEFORE_MS = 24 * 60 * 60 * 1000; // 24h

const formatCountdown = (secondsLeft: number, matchTimestamp: number): string => {
  if (secondsLeft > 48 * 3600) {
    if (!matchTimestamp || matchTimestamp <= 0) return "Coming soon";
    const d = new Date(matchTimestamp);
    if (isNaN(d.getTime())) return "Coming soon";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  }
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const isDateDisplay = (secondsLeft: number) => secondsLeft > 48 * 3600;

const TeamFlag = ({ name, locked = false }: { name: string; locked?: boolean }) => {
  const flag = getFlag(name);
  const accent = getAccent(name);
  const initials = name.substring(0, 3).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${locked ? "grayscale opacity-40" : ""}`}
        style={{
          background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
          border: `1.5px solid ${accent}55`,
          boxShadow: locked ? "none" : `0 0 24px ${accent}33, 0 4px 16px rgba(0,0,0,0.5)`,
        }}
      >
        {flag ? (
          <img
            src={flag}
            alt={name}
            className="w-full h-full object-cover opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="text-white font-black text-sm tracking-wider">{initials}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>
      <span className={`text-center font-bold text-[11px] leading-tight tracking-wide max-w-[80px] ${locked ? "text-white/30" : "text-white/90"}`}>
        {name}
      </span>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Match["status"] }) => {
  const cfg = {
    Open:      { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400", label: "Open" },
    Upcoming:  { bg: "bg-violet-500/15",  border: "border-violet-500/30",  text: "text-violet-400",  dot: "bg-violet-400",  label: "Upcoming" },
    Predicted: { bg: "bg-sky-500/15",     border: "border-sky-500/30",     text: "text-sky-400",     dot: "bg-sky-400",     label: "Predicted" },
    Resulted:  { bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-400",   dot: "bg-amber-400",   label: "Resulted" },
    Locked:    { bg: "bg-white/5",        border: "border-white/10",       text: "text-white/30",    dot: "bg-white/20",    label: "Locked" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      {status === "Locked"
        ? <Lock className="w-2.5 h-2.5" />
        : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "Open" ? "animate-pulse" : ""}`} />
      }
      {cfg.label}
    </span>
  );
};

export default function MatchPredictionContestView({
  contestId,
  onNavigate,
}: {
  contestId: number;
  onNavigate: (path: string) => void;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/contests/${contestId}/matches`);
        if (res.ok) {
          const md = await res.json();
          if (md.success) {
            const now = Date.now();
            const safeTs = (v: any): number => {
              if (!v) return 0;
              if (typeof v === "number") return v;
              const d = new Date(v);
              return isNaN(d.getTime()) ? 0 : d.getTime();
            };

            const sorted = [...md.matches].sort(
              (a: any, b: any) => safeTs(a.matchTime) - safeTs(b.matchTime)
            );

            const mapped: Match[] = sorted.map((m: any, index: number) => {
              const matchTimestamp = safeTs(m.matchTime);
              const deadlineTimestamp = safeTs(m.deadline);
              const secondsLeft = Math.max(0, Math.floor((deadlineTimestamp - now) / 1000));

              // Unlock logic: first 2 are open, others open 24h before kickoff
              const isEarlyUnlock = index < FIRST_N_ALWAYS_OPEN;
              const isWithin24h = now >= matchTimestamp - UNLOCK_BEFORE_MS;
              const isUnlocked = isEarlyUnlock || isWithin24h;

              let status: Match["status"] = "Open";
              if (m.status === "resulted") {
                status = "Resulted";
              } else if (!isUnlocked) {
                status = "Locked";
              } else if (m.userPredicted) {
                status = "Predicted";
              } else if (secondsLeft <= 0) {
                status = "Upcoming";
              }

              const kickoffDate = matchTimestamp > 0
                ? new Date(matchTimestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
                : "—";
              
              const kickoffTime = matchTimestamp > 0
                ? kickoffDate + ", " + new Date(matchTimestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST"
                : "—";

              return {
                id: m.id.toString(),
                status,
                secondsLeft: isUnlocked && secondsLeft > 0 ? secondsLeft : undefined,
                matchTimestamp,
                kickoffTime,
                teamHome: m.teamHome,
                teamAway: m.teamAway,
                prediction: m.predictedScore || undefined,
                pointsEarned: m.pointsEarned !== null ? m.pointsEarned : undefined,
              };
            });

            const visible = mapped.filter((m) => {
              if (m.status === "Predicted" || m.status === "Resulted") return true;
              return m.matchTimestamp > now;
            });

            setMatches(visible);
          }
        }
      } catch (err) {
        console.error("Failed to load contest matches", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contestId]);

  // Live countdown update ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.secondsLeft === undefined || m.secondsLeft <= 0) return m;
          const next = m.secondsLeft - 1;
          if (next <= 0) {
            return {
              ...m,
              secondsLeft: undefined,
              status: m.status === "Open" ? "Upcoming" : m.status,
            };
          }
          return { ...m, secondsLeft: next };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-white/30 surface-glass-1 border border-white/5 rounded-2xl">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-white" />
        <p className="text-sm font-semibold">No matches scheduled in this tournament yet.</p>
      </div>
    );
  }

  const openCount = matches.filter((m) => m.status === "Open").length;
  const lockedCount = matches.filter((m) => m.status === "Locked").length;

  return (
    <div className="flex flex-col gap-5 mt-2">
      {/* Overview stats info */}
      <div className="flex justify-between items-center px-2">
        <p className="text-xs text-white/40 font-semibold">
          {openCount > 0 && <span className="text-emerald-400 font-black">{openCount} matches open</span>}
          {openCount > 0 && lockedCount > 0 && " · "}
          {lockedCount > 0 && <span>{lockedCount} lock progressively</span>}
        </p>
      </div>

      {/* Cards list */}
      <div className="flex flex-col gap-4">
        {matches.map((match, index) => {
          const locked = match.status === "Locked";
          const homeAccent = locked ? "#555" : getAccent(match.teamHome);
          const awayAccent = locked ? "#444" : getAccent(match.teamAway);
          const tsValid = match.matchTimestamp > 0 && !isNaN(match.matchTimestamp);
          
          const kickoffDate = tsValid
            ? new Date(match.matchTimestamp).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })
            : "—";

          return (
            <React.Fragment key={match.id}>
            <div
              key={match.id}
              className="relative rounded-2xl overflow-hidden shadow-xl"
              style={{ animation: "fadeUp 0.4s ease both", animationDelay: `${index * 0.05}s` }}
            >
              {/* Glow border overlay */}
              <div
                className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${locked ? "opacity-0" : "opacity-30 hover:opacity-50"}`}
                style={{ background: `linear-gradient(135deg, ${homeAccent}44, transparent 50%, ${awayAccent}44)` }}
              />

              {/* Glass Card content */}
              <div
                className="relative rounded-2xl border"
                style={{
                  background: locked ? "rgba(255,255,255,0.01)" : "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  border: locked ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(15px)",
                }}
              >
                <div className="p-4 flex flex-col gap-4">
                  {/* Top Bar Status / Countdown */}
                  <div className="flex justify-between items-center">
                    <StatusBadge status={match.status} />

                    <div className="flex items-center gap-2 text-xs font-bold font-mono">
                      {locked && (
                        <span className="text-white/20 text-[10px] uppercase font-bold flex items-center gap-1 font-sans">
                          Unlocks {kickoffDate}
                        </span>
                      )}

                      {!locked && match.secondsLeft !== undefined && match.secondsLeft > 0 && (
                        <span className={match.secondsLeft < 3600 ? "text-red-400 animate-pulse" : "text-primary"}>
                          {formatCountdown(match.secondsLeft, match.matchTimestamp)}
                        </span>
                      )}

                      {match.status === "Resulted" && match.pointsEarned !== undefined && (
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> +{match.pointsEarned} pts
                        </span>
                      )}

                      {match.status === "Predicted" && match.prediction && (
                        <span className="text-secondary font-bold flex items-center gap-1 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {match.prediction}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team grid */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                    <TeamFlag name={match.teamHome} locked={locked} />

                    {/* Mid Section */}
                    <div className="flex flex-col items-center gap-0.5 px-3">
                      {match.status === "Resulted" && match.scoreHome !== undefined ? (
                        <span className="text-3xl font-black font-mono tracking-tight text-white/95">
                          {match.scoreHome} – {match.scoreAway}
                        </span>
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-white/5 border border-white/8 text-[11px] font-black text-white/25 flex items-center justify-center select-none">
                          VS
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-white/30 text-center tracking-wide mt-1">
                        {match.kickoffTime}
                      </span>
                    </div>

                    <TeamFlag name={match.teamAway} locked={locked} />
                  </div>

                  {/* CTA Prediction Buttons */}
                  <div className="border-t border-white/5 pt-3 flex justify-center">
                    {match.status === "Locked" && (
                      <span className="text-[10px] font-medium text-white/20 flex items-center gap-1.5 py-1">
                        <Lock className="w-3 h-3" /> Locks release 24h before kickoff
                      </span>
                    )}

                    {match.status === "Open" && (
                      <button
                        onClick={() => onNavigate(`/contests/${contestId}/predict/${match.id}`)}
                        className="group flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-primary-container to-primary hover:brightness-110 active:scale-95 transition-all shadow-md"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" /> Predict Now
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}

                    {match.status === "Upcoming" && (
                      <span className="text-white/25 text-[10px] uppercase font-bold py-1">
                        Closed for prediction
                      </span>
                    )}

                    {match.status === "Predicted" && (
                      <button
                        onClick={() => onNavigate(`/contests/${contestId}/predict/${match.id}`)}
                        className="w-full py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Change Prediction
                      </button>
                    )}

                    {match.status === "Resulted" && (
                      <button
                        onClick={() => onNavigate(`/matches/${match.id}/result?contestId=${contestId}`)}
                        className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all active:scale-95 shadow-md"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        View Result & Share
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
