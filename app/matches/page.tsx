"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Timer, CheckCircle2, ChevronRight, Trophy, User,
  Shield, Zap, Star, Lock, Calendar, Download, History, Gamepad2,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import AuthModal from "@/components/AuthModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Match {
  id: string;
  status: "Open" | "Upcoming" | "Predicted" | "Resulted" | "Locked";
  secondsLeft?: number;
  matchTimestamp: number;
  kickoffTime: string;
  teamHome: string;
  teamAway: string;
  round?: string;
  prediction?: string;
  pointsEarned?: number;
  scoreHome?: number;
  scoreAway?: number;
}

// ── Flag + Colour maps ────────────────────────────────────────────────────────
const COUNTRY_FLAGS: Record<string, string> = {
  // Group A
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  // Group B
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch",
  // Group C
  "brazil": "br", "morocco": "ma", "haiti": "ht", "scotland": "gb-sct",
  // Group D
  "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  // Group E
  "germany": "de", "curaçao": "cw", "curacao": "cw",
  "ivory coast": "ci", "ecuador": "ec",
  // Group F
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn",
  // Group G
  "belgium": "be", "egypt": "eg", "iran": "ir", "new zealand": "nz",
  // Group H
  "spain": "es", "cape verde": "cv", "saudi arabia": "sa", "uruguay": "uy",
  // Group I
  "france": "fr", "senegal": "sn", "iraq": "iq", "norway": "no",
  // Group J
  "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  // Group K
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co",
  // Group L
  "england": "gb-eng", "croatia": "hr", "ghana": "gh", "panama": "pa",
  // aliases kept for backwards compat
  "korea republic": "kr", "czechia": "cz",
  "chile": "cl", "peru": "pe", "serbia": "rs", "cameroon": "cm",
  "nigeria": "ng", "thailand": "th", "slovakia": "sk",
  "venezuela": "ve", "cuba": "cu",
  // clubs fallback
  "man united": "gb-eng", "man city": "gb-eng", "real madrid": "es",
  "barcelona": "es", "liverpool": "gb-eng", "arsenal": "gb-eng",
  "chelsea": "gb-eng", "tottenham": "gb-eng",
};

const TEAM_ACCENT: Record<string, string> = {
  "brazil": "#22c55e", "argentina": "#38bdf8", "france": "#3b82f6",
  "germany": "#e5e7eb", "spain": "#ef4444", "portugal": "#ef4444",
  "england": "#ef4444", "netherlands": "#f97316", "italy": "#3b82f6",
  "mexico": "#22c55e", "usa": "#60a5fa", "japan": "#ef4444",
  "morocco": "#22c55e", "senegal": "#22c55e", "croatia": "#ef4444",
  "uruguay": "#38bdf8", "colombia": "#facc15", "belgium": "#ef4444",
  "canada": "#ef4444", "australia": "#facc15", "switzerland": "#ef4444",
  "nigeria": "#22c55e", "south africa": "#22c55e", "korea republic": "#ef4444",
  "czechia": "#3b82f6", "ghana": "#f59e0b", "ivory coast": "#f97316",
  "turkey": "#ef4444", "egypt": "#ef4444", "iran": "#22c55e",
  "qatar": "#7c3aed", "iraq": "#22c55e", "slovakia": "#3b82f6",
  "saudi arabia": "#22c55e", "cameroon": "#22c55e", "serbia": "#ef4444",
  "ecuador": "#facc15", "paraguay": "#3b82f6", "algeria": "#22c55e",
  "honduras": "#3b82f6", "venezuela": "#ef4444", "cuba": "#3b82f6",
  "austria": "#ef4444", "thailand": "#3b82f6",
  "peru": "#ef4444", "new zealand": "#1e293b", "bosnia and herzegovina": "#3b82f6",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

const getAccent = (name: string) => TEAM_ACCENT[name.toLowerCase().trim()] ?? "#a855f7";

// ── Lock logic ─────────────────────────────────────────────────────────────────
// A match becomes predictable 24 hours before kickoff.
// EXCEPTION: The first 2 matches (by kickoff order) are always open immediately
// so users can engage before the tournament officially starts.
const FIRST_N_ALWAYS_OPEN = 2;
const UNLOCK_BEFORE_MS = 24 * 60 * 60 * 1000; // 24h before kickoff

// ── Timer formatter ───────────────────────────────────────────────────────────
// > 48 h away → show kickoff date ("Jun 11")
// ≤ 48 h away → show HH:MM countdown
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

// Is countdown a date string (>48h)? Used to pick icon
const isDateDisplay = (secondsLeft: number) => secondsLeft > 48 * 3600;

// ── Sub-components ────────────────────────────────────────────────────────────
const SoccerBallIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" /><path d="M12 22v-3" />
    <path d="M10 5 6 8.5" /><path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" /><path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" /><path d="M16.5 13 12 15" />
    <path d="M12 15v4" /><path d="M12 22 8.5 19.5" />
    <path d="M12 22l3.5-2.5" /><path d="M7.5 13H4" />
    <path d="M16.5 13H20" />
  </svg>
);

const TeamFlag = ({ name, locked = false }: { name: string; locked?: boolean }) => {
  const flag = getFlag(name);
  const accent = getAccent(name);
  const initials = name.substring(0, 3).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative w-[72px] h-[72px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${locked ? "grayscale opacity-40" : ""}`}
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
          <span className="text-white font-black text-lg tracking-wider">{initials}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>
      <span className={`text-center font-semibold text-xs leading-tight tracking-wide max-w-[80px] ${locked ? "text-white/30" : "text-white/90"}`}>
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      {status === "Locked"
        ? <Lock className="w-2.5 h-2.5" />
        : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "Open" ? "animate-pulse" : ""}`} />
      }
      {cfg.label}
    </span>
  );
};

// ── Match Card ────────────────────────────────────────────────────────────────
const MatchCard = ({
  match,
  index,
  onNavigate,
}: {
  match: Match;
  index: number;
  onNavigate: (path: string) => void;
}) => {
  const locked = match.status === "Locked";
  const homeAccent = locked ? "#555" : getAccent(match.teamHome);
  const awayAccent = locked ? "#444" : getAccent(match.teamAway);

  // Kickoff date — guard against bad timestamps
  const tsValid = match.matchTimestamp > 0 && !isNaN(match.matchTimestamp);
  const kickoffDate = tsValid
    ? new Date(match.matchTimestamp).toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata",
      })
    : "—";
  const kickoffTimeStr = tsValid
    ? new Date(match.matchTimestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
      }) + " IST"
    : "—";

  const unlockTimestamp = match.matchTimestamp - 24 * 60 * 60 * 1000;
  const unlockDate = tsValid
    ? new Date(unlockTimestamp).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", timeZone: "Asia/Kolkata",
      })
    : "—";
  const unlockTimeStr = tsValid
    ? new Date(unlockTimestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
      }) + " IST"
    : "—";

  const getTimerColour = (secs: number) => {
    if (secs < 300) return "text-red-400 animate-pulse";
    if (secs < 3600) return "text-amber-400";
    return "text-violet-400";
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: `${index * 0.06}s` }}
    >
      {/* Gradient border */}
      <div
        className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${locked ? "opacity-0" : "opacity-50 hover:opacity-80"}`}
        style={{ background: `linear-gradient(135deg, ${homeAccent}55, transparent 50%, ${awayAccent}55)` }}
      />

      {/* Card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: locked
            ? "rgba(255,255,255,0.02)"
            : "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          border: locked ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: locked ? "none" : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Top accent bar */}
        {!locked && (
          <div
            className="h-[2px] w-full"
            style={{ background: `linear-gradient(90deg, ${homeAccent}, transparent 40%, transparent 60%, ${awayAccent})` }}
          />
        )}

        <div className="p-5 flex flex-col gap-5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <StatusBadge status={match.status} />
              {match.round && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {match.round}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              {/* Locked: show unlock date */}
              {locked && (
                <div className="flex items-center gap-1.5 text-white/25">
                  <Lock className="w-3 h-3" />
                  <span className="font-medium">Unlocks {unlockDate} · {unlockTimeStr}</span>
                </div>
              )}

              {/* Countdown or date */}
              {!locked && match.secondsLeft !== undefined && match.secondsLeft > 0 && (
                <div className={`flex items-center gap-1.5 ${getTimerColour(match.secondsLeft)}`}>
                  {isDateDisplay(match.secondsLeft)
                    ? <Calendar className="w-3.5 h-3.5" />
                    : <Timer className="w-3.5 h-3.5" />
                  }
                  <span className={`font-bold tracking-wider ${isDateDisplay(match.secondsLeft) ? "" : "font-mono"}`}>
                    {formatCountdown(match.secondsLeft, match.matchTimestamp)}
                  </span>
                </div>
              )}

              {/* Resulted points */}
              {match.status === "Resulted" && match.pointsEarned !== undefined && (
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold">+{match.pointsEarned} pts</span>
                </div>
              )}

              {/* Predicted score */}
              {match.status === "Predicted" && match.prediction && (
                <div className="flex items-center gap-1 text-sky-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{match.prediction}</span>
                </div>
              )}
            </div>
          </div>

          {/* Teams row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex justify-center">
              <TeamFlag name={match.teamHome} locked={locked} />
            </div>

            {/* Centre: score / VS / kickoff */}
            <div className="flex flex-col items-center gap-1 px-2">
              {match.status === "Resulted" && match.scoreHome !== undefined && match.scoreAway !== undefined ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black font-mono" style={{ color: homeAccent, textShadow: `0 0 20px ${homeAccent}88` }}>
                    {match.scoreHome}
                  </span>
                  <span className="text-white/20 font-black text-2xl">–</span>
                  <span className="text-4xl font-black font-mono" style={{ color: awayAccent, textShadow: `0 0 20px ${awayAccent}88` }}>
                    {match.scoreAway}
                  </span>
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/25 font-black text-sm"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  VS
                </div>
              )}
              <span className={`text-[10px] font-medium tracking-wider mt-1 text-center ${locked ? "text-white/20" : "text-white/35"}`}>
                {match.status === "Resulted"
                  ? "Full Time"
                  : `${kickoffDate} · ${kickoffTimeStr}`
                }
              </span>
            </div>

            <div className="flex justify-center">
              <TeamFlag name={match.teamAway} locked={locked} />
            </div>
          </div>

          {/* CTA */}
          <div className="pt-1 border-t border-white/5 flex justify-center">
            {match.status === "Locked" && (
              <div className="flex items-center gap-2 text-white/20 text-xs font-medium py-1">
                <Lock className="w-3.5 h-3.5" />
                Predictions open 24h before kickoff
              </div>
            )}
            {match.status === "Open" && (
              <button
                onClick={() => onNavigate(`/matches/${match.id}/predict`)}
                className="group/btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95 hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, ${homeAccent}cc, ${awayAccent}cc)`,
                  boxShadow: `0 4px 20px ${homeAccent}44`,
                }}
              >
                <Zap className="w-4 h-4" />
                Predict Now
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}
            {match.status === "Upcoming" && (
              <div className="flex items-center gap-2 text-violet-400/50 text-xs font-medium py-1">
                <Timer className="w-3.5 h-3.5" />
                Predictions closed
              </div>
            )}
            {match.status === "Predicted" && (
              <button
                onClick={() => onNavigate(`/matches/${match.id}/predict`)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-all active:scale-95"
              >
                Edit Prediction
              </button>
            )}
            {match.status === "Resulted" && (
              <button
                onClick={() => onNavigate(`/matches/${match.id}/result`)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                View Result
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function MatchCenter() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; points: number; role?: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authHint, setAuthHint] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const gateAction = useCallback((hint: string, action: () => void) => {
    if (!user) {
      setAuthHint(hint);
      setPendingAction(() => action);
      setShowAuthModal(true);
    } else {
      action();
    }
  }, [user]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    window.location.reload();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const ud = await userRes.json();
          if (ud.user) setUser(ud.user);
        }

        const matchesRes = await fetch("/api/matches");
        if (matchesRes.ok) {
          const md = await matchesRes.json();
          if (md.success) {
            const now = Date.now();

            // Postgres can return timestamps as Date objects or ISO strings —
            // normalise everything to a plain number via this helper.
            const safeTs = (v: any): number => {
              if (!v) return 0;
              if (typeof v === "number") return v;
              const d = new Date(v);
              return isNaN(d.getTime()) ? 0 : d.getTime();
            };

            // Sort by kickoff time ascending
            const sorted = [...md.matches].sort(
              (a: any, b: any) => safeTs(a.matchTime) - safeTs(b.matchTime)
            );

            const mapped: Match[] = sorted.map((m: any, index: number) => {
              const matchTimestamp = safeTs(m.matchTime);
              const deadlineTimestamp = safeTs(m.deadline);
              const secondsLeft = Math.max(0, Math.floor((deadlineTimestamp - now) / 1000));

              // ── Lock logic ──────────────────────────────────────────────
              // First FIRST_N_ALWAYS_OPEN matches are always unlocked.
              // Rest: unlock 24h before kickoff.
              const isEarlyUnlock = index < FIRST_N_ALWAYS_OPEN;
              const isWithin24h = now >= matchTimestamp - UNLOCK_BEFORE_MS;
              const isUnlocked = isEarlyUnlock || isWithin24h;

              // ── Status ──────────────────────────────────────────────────
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

              // Safe kickoff display strings
              const kickoffDate =
                matchTimestamp > 0
                  ? new Date(matchTimestamp).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", timeZone: "Asia/Kolkata",
                    })
                  : "—";
              const kickoffTime =
                matchTimestamp > 0
                  ? kickoffDate +
                    ", " +
                    new Date(matchTimestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
                    }) + " IST"
                  : "—";

              return {
                id: m.id.toString(),
                status,
                secondsLeft: isUnlocked && secondsLeft > 0 ? secondsLeft : undefined,
                matchTimestamp,
                kickoffTime,
                teamHome: m.teamHome,
                teamAway: m.teamAway,
                round: m.round || undefined,
                prediction: m.predictedScore || undefined,
                pointsEarned: m.pointsEarned !== null ? m.pointsEarned : undefined,
              };
            });

            // Filter out matches whose kickoff time has already passed,
            // unless the user predicted on them or they have been resulted.
            const visible = mapped.filter((m) => {
              if (m.status === "Predicted" || m.status === "Resulted") return true;
              // Keep matches whose kickoff is still in the future
              return m.matchTimestamp > now;
            });

            setMatches(visible);
          }
        }
      } catch (err) {
        console.error("MatchCenter load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true
    );
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  // Live countdown (only for unlocked matches within 48h)
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches((prev) => {
        const hasActive = prev.some((m) => m.secondsLeft !== undefined && m.secondsLeft > 0);
        if (!hasActive) return prev;
        return prev.map((m) => {
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
        });
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Fixtures…</p>
      </div>
    );
  }

  const openCount = matches.filter((m) => m.status === "Open").length;
  const lockedCount = matches.filter((m) => m.status === "Locked").length;

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 md:pb-8 overflow-x-hidden">
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />
        </div>

        <TopBar
          userName={user?.name}
          userPoints={user?.points}
          userRole={user?.role}
          activeTab="matches"
        />

        {/* Main */}
        <main className="relative z-10 container mx-auto px-4 md:px-6 pt-24 pb-8 max-w-2xl">
          {/* Page header */}
          <div className="mb-8 text-left">
            {!isStandalone && deferredPrompt && (
              <div className="mb-4 flex justify-between items-center p-3 rounded-xl border border-violet-500/25 bg-violet-500/5 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-violet-300 font-bold">Install Skorio App for offline access</span>
                </div>
                <button
                  onClick={handleInstall}
                  className="px-3 py-1 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  Install
                </button>
              </div>
            )}
            <p className="text-[10px] font-bold tracking-[0.2em] text-violet-400 uppercase mb-1">
              FIFA World Cup 2026
            </p>
            <h2 className="text-3xl font-black text-white tracking-tight">Match Center</h2>
            <p className="text-white/40 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
              {openCount > 0 && (
                <span>
                  <span className="text-emerald-400 font-bold">{openCount} open</span> for predictions
                </span>
              )}
              {lockedCount > 0 && (
                <span className="flex items-center gap-1 text-white/25">
                  <Lock className="w-3 h-3" />
                  {lockedCount} unlock progressively
                </span>
              )}
            </p>
          </div>

          {/* Unlock info banner */}
          <div
            className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}
          >
            <Calendar className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-xs text-white/50 leading-relaxed">
              <span className="text-violet-400 font-semibold">Daily unlocks active.</span>{" "}
              New matches open for prediction 24 hours before kickoff. First 2 fixtures are available now.
            </p>
          </div>

          {/* Cards */}
          {matches.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <SoccerBallIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No matches available</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {matches.map((match, idx) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={idx}
                  onNavigate={(path) => {
                    const hint = path.endsWith("/result")
                      ? "Sign in to view match results"
                      : "Sign in to predict this match";
                    gateAction(hint, () => router.push(path));
                  }}
                />
              ))}
            </div>
          )}
        </main>

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
          style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <a href="/matches" className="flex flex-col items-center justify-center text-primary gap-0.5">
            <SoccerBallIcon className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-semibold">Matches</span>
          </a>
          <a href="/leaderboard" className="flex flex-col items-center justify-center text-white/40 hover:text-amber-400 gap-0.5 transition-colors">
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Rankings</span>
          </a>
          <a href="/games" className="flex flex-col items-center justify-center text-white/40 hover:text-violet-400 gap-0.5 transition-colors">
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Games</span>
          </a>
          <a href="/history" className="flex flex-col items-center justify-center text-white/40 hover:text-sky-400 gap-0.5 transition-colors">
            <History className="w-5 h-5" />
            <span className="text-[10px] font-semibold">History</span>
          </a>
          {user?.role === "admin" && (
            <a href="/admin" className="flex flex-col items-center justify-center text-white/40 hover:text-violet-400 gap-0.5 transition-colors">
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Admin</span>
            </a>
          )}
        </nav>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
          onSuccess={handleAuthSuccess}
          hint={authHint}
        />
      </div>
    </>
  );
}
