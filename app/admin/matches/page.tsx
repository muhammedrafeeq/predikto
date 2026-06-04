"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Share2, Loader2 } from "lucide-react";
import {
  Calendar,
  Plus,
  Edit,
  Activity,
  CheckCircle,
  Clock,
  Search,
  PlusCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface Match {
  id: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  deadline: string;
  status: string;
  predictionsCount: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch",
  "brazil": "br", "morocco": "ma", "haiti": "ht", "scotland": "gb-sct",
  "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  "germany": "de", "curaçao": "cw", "curacao": "cw", "ivory coast": "ci", "ecuador": "ec",
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn",
  "belgium": "be", "egypt": "eg", "iran": "ir", "new zealand": "nz",
  "spain": "es", "cape verde": "cv", "saudi arabia": "sa", "uruguay": "uy",
  "france": "fr", "senegal": "sn", "iraq": "iq", "norway": "no",
  "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co",
  "england": "gb-eng", "croatia": "hr", "ghana": "gh", "panama": "pa",
  "korea republic": "kr", "czechia": "cz",
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
  "ghana": "#f59e0b", "ivory coast": "#f97316", "turkey": "#ef4444",
  "egypt": "#ef4444", "iran": "#22c55e", "qatar": "#7c3aed",
  "iraq": "#22c55e", "saudi arabia": "#22c55e", "ecuador": "#facc15",
  "algeria": "#22c55e", "austria": "#ef4444",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

const getAccent = (name: string) => TEAM_ACCENT[name.toLowerCase().trim()] ?? "#a855f7";

const TeamBadge = ({ name }: { name: string }) => {
  const flag = getFlag(name);
  const accent = getAccent(name);
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div
        className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
          border: `1.5px solid ${accent}55`,
          boxShadow: `0 0 20px ${accent}22`,
        }}
      >
        {flag ? (
          <img src={flag} alt={name} className="w-full h-full object-cover opacity-90" />
        ) : (
          <span className="text-white font-black text-sm tracking-wider">{name.substring(0, 3).toUpperCase()}</span>
        )}
      </div>
      <span className="text-xs font-semibold text-white/80 text-center max-w-[90px] leading-tight">{name}</span>
    </div>
  );
};

export default function MatchManager() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "live" | "resulted">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for scheduling a new match
  const [teamHome, setTeamHome] = useState("");
  const [teamAway, setTeamAway] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [shareData, setShareData] = useState<Record<number, any>>({});
  const shareCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleShareMatch = useCallback(async (match: Match) => {
    if (sharingId) return;
    setSharingId(match.id);
    try {
      // Fetch entries data first
      const res = await fetch(`/api/admin/matches/${match.id}/entries`);
      const data = await res.json();
      if (!data.success) throw new Error("Failed to fetch entries");

      // Store data so the hidden card can render
      setShareData((prev) => ({ ...prev, [match.id]: data }));

      // Wait a tick for React to render the card
      await new Promise((r) => setTimeout(r, 150));

      const el = shareCardRefs.current.get(match.id);
      if (!el) throw new Error("Share card not found");

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, allowTaint: true, logging: false });
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png", 0.95));
      const file = new File([blob], "skorio-result.png", { type: "image/png" });

      const entries: any[] = data.entries ?? [];
      const totalUsers = entries.length;
      const totalCorrect3 = entries.filter((e: any) => {
        const preds = Object.values(e.predictions) as any[];
        return preds.filter((p) => p.isCorrect).length === 3;
      }).length;
      const text = `⚽ ${match.teamHome} vs ${match.teamAway} — Results published! ${totalUsers} players predicted, ${totalCorrect3} got all 3 correct 🏆 #SkorioWC2026`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        const text = `⚽ ${match.teamHome} vs ${match.teamAway} — Results are in on Skorio FIFA WC 2026 🏆`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } finally {
      setSharingId(null);
    }
  }, [sharingId]);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/admin/matches");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const sorted = [...data.matches].sort(
              (a: Match, b: Match) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
            );
            setMatches(sorted);
          }
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    if (!teamHome.trim() || !teamAway.trim() || !matchTime || !deadline) {
      setErrorMsg("All fields are required");
      setSubmitting(false);
      return;
    }

    const kickoffDate = new Date(matchTime);
    const deadlineDate = new Date(deadline);

    if (deadlineDate >= kickoffDate) {
      setErrorMsg("Prediction deadline must be set before the kickoff time");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamHome: teamHome.trim(),
          teamAway: teamAway.trim(),
          matchTime: kickoffDate.toISOString(),
          deadline: deadlineDate.toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMatches((prev) => [data.match, ...prev]);
        setTeamHome("");
        setTeamAway("");
        setMatchTime("");
        setDeadline("");
        setIsModalOpen(false);
      } else {
        setErrorMsg(data.error || "Failed to create match");
      }
    } catch (err) {
      console.error("Failed to create match:", err);
      setErrorMsg("Internal server error");
    } finally {
      setSubmitting(false);
    }
  };

  // Get status text and colors dynamically
  const getMatchStatus = (match: Match) => {
    if (match.status === "resulted") {
      return {
        label: "Resulted",
        classes: "bg-primary/10 text-primary border border-primary/20",
        badgeColor: "bg-primary",
        type: "resulted",
      };
    }

    const isPastDeadline = new Date(match.deadline).getTime() <= Date.now();
    if (isPastDeadline) {
      return {
        label: "Closed",
        classes: "bg-tertiary/10 text-tertiary border border-tertiary/20",
        badgeColor: "bg-tertiary",
        type: "live", // past deadline means closed/live
      };
    }

    return {
      label: "Open",
      classes: "bg-secondary/10 text-secondary border border-secondary/20",
      badgeColor: "bg-secondary",
      type: "upcoming", // before deadline means open/upcoming
    };
  };

  const filteredMatches = matches.filter((match) => {
    const statusInfo = getMatchStatus(match);
    if (activeFilter === "all") return true;
    return statusInfo.type === activeFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Fixture Records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">Match Manager</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
              Schedule and Result Global Fixtures
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary label-md font-bold rounded-lg active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Fixture
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {[
          { id: "all", label: "All Matches" },
          { id: "upcoming", label: "Upcoming (Open)" },
          { id: "live", label: "Closed (Live)" },
          { id: "resulted", label: "Resulted" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`whitespace-nowrap px-4 py-2 rounded-full label-sm font-semibold transition-all cursor-pointer ${
              activeFilter === tab.id
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                : "surface-glass-1 text-on-surface-variant hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMatches.map((match) => {
          const statusInfo = getMatchStatus(match);
          const kickoff = new Date(match.matchTime);
          const isResulted = match.status === "resulted";

          return (
            <div key={match.id} className="surface-glass-1 p-5 rounded-2xl flex flex-col gap-4">
              {/* Header inside card */}
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-on-surface-variant font-mono">
                  {kickoff.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                </span>
                <div className={`flex items-center gap-1.5 ${statusInfo.classes} px-2.5 py-0.5 rounded-full`}>
                  <span className={`h-2 w-2 rounded-full ${statusInfo.badgeColor} animate-pulse-slow`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Match Score / Time presentation */}
              <div className="flex items-center justify-between py-2 select-none">
                <TeamBadge name={match.teamHome} />

                {/* Score or Time */}
                <div className="flex flex-col items-center px-4">
                  {isResulted ? (
                    <span className="text-2xl font-black text-primary tracking-widest">FT</span>
                  ) : (
                    <>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-widest mb-1 font-mono">Kickoff</span>
                      <div className="text-base font-bold text-on-surface font-mono">
                        {kickoff.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
                      </div>
                      <div className="h-0.5 w-4 bg-primary/30 mt-1 rounded-full" />
                    </>
                  )}
                </div>

                <TeamBadge name={match.teamAway} />
              </div>

              {/* Match dates and stats strip */}
              <div className="flex justify-between items-center py-2 px-1 border-t border-white/5 select-none font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <Clock className="w-4 h-4 text-on-surface-variant" />
                  <span>{kickoff.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-secondary">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  <span className="font-bold">{match.predictionsCount} Tips</span>
                </div>
              </div>

              {/* Hidden share card for this match */}
              {isResulted && (() => {
                const sd = shareData[match.id];
                const entries: any[] = sd?.entries ?? [];
                const correctAnswers = sd ? (() => {
                  const ca: Record<string, string> = {};
                  if (entries.length > 0) {
                    const first = entries[0];
                    for (const [type, pred] of Object.entries(first.predictions) as any[]) {
                      if (pred.correctAnswer) ca[type] = pred.correctAnswer;
                    }
                  }
                  return ca;
                })() : {};

                // Aggregate stats
                const totalUsers = entries.length;
                const correctWinner = entries.filter((e: any) => e.predictions?.winner?.isCorrect).length;
                const correctScore = entries.filter((e: any) => e.predictions?.score?.isCorrect).length;
                const correctScorer = entries.filter((e: any) => e.predictions?.scorer?.isCorrect).length;
                const allThree = entries.filter((e: any) => {
                  const preds = Object.values(e.predictions) as any[];
                  return preds.length === 3 && preds.every((p) => p.isCorrect);
                }).length;

                // Top scorers (sorted by points desc, take top 5)
                const topUsers = [...entries]
                  .filter((e: any) => e.pointsEarned !== null)
                  .sort((a: any, b: any) => (b.pointsEarned ?? 0) - (a.pointsEarned ?? 0))
                  .slice(0, 6);

                const W = 420;
                const pad = 22;
                const inner = W - pad * 2;
                const rankColor = (i: number) => i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "rgba(255,255,255,0.3)";
                const ansW = Math.floor((inner - 8) / 3);
                const statW = Math.floor((inner - 9) / 4);

                // table-cell helper — html2canvas renders table layout reliably
                const TR = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
                  <div style={{ display: "table-row", ...style }}>{children}</div>
                );
                const TD = ({ w, children, style = {} }: { w?: number | string; children: React.ReactNode; style?: React.CSSProperties }) => (
                  <div style={{ display: "table-cell", verticalAlign: "middle", width: w ? (typeof w === "number" ? `${w}px` : w) : undefined, padding: "0", ...style }}>{children}</div>
                );

                return (
                  <div
                    ref={(el) => { if (el) shareCardRefs.current.set(match.id, el); else shareCardRefs.current.delete(match.id); }}
                    style={{ position: "fixed", left: "-9999px", top: 0, width: `${W}px`, background: "#0e0c1a", borderRadius: "16px", padding: `${pad}px`, fontFamily: "Arial, sans-serif", color: "#fff", border: "1px solid rgba(168,85,247,0.25)", boxSizing: "border-box" }}
                  >
                    {/* ── Header ── */}
                    <div style={{ display: "table", width: "100%", marginBottom: "16px" }}>
                      <TR>
                        <TD style={{ fontSize: "16px", fontWeight: 900, color: "#a855f7" }}>
                          SKO<span style={{ color: "#fff" }}>RIO</span>
                        </TD>
                        <TD style={{ textAlign: "right", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                          FIFA WC 2026 · Results
                        </TD>
                      </TR>
                    </div>

                    {/* ── Teams + Score ── */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "12px", padding: "14px 0" }}>
                      <div style={{ display: "table", width: "100%" }}>
                        <TR>
                          <TD w={140} style={{ textAlign: "center", paddingLeft: "8px", paddingRight: "8px" }}>
                            {getFlag(match.teamHome)
                              ? <img src={getFlag(match.teamHome)!} alt="" width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.1)", display: "block", margin: "0 auto 6px" }} />
                              : <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(168,85,247,0.25)", margin: "0 auto 6px", lineHeight: "44px", fontSize: "11px", fontWeight: 800, textAlign: "center" }}>{match.teamHome.substring(0, 3).toUpperCase()}</div>
                            }
                            <div style={{ fontSize: "12px", fontWeight: 700, lineHeight: "1.4" }}>{match.teamHome}</div>
                          </TD>
                          <TD style={{ textAlign: "center", paddingLeft: "4px", paddingRight: "4px" }}>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Full Time</div>
                            <div style={{ fontSize: "30px", fontWeight: 900, fontFamily: "monospace", color: "#fff", lineHeight: "1" }}>{correctAnswers.score ?? "–"}</div>
                          </TD>
                          <TD w={140} style={{ textAlign: "center", paddingLeft: "8px", paddingRight: "8px" }}>
                            {getFlag(match.teamAway)
                              ? <img src={getFlag(match.teamAway)!} alt="" width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.1)", display: "block", margin: "0 auto 6px" }} />
                              : <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(168,85,247,0.25)", margin: "0 auto 6px", lineHeight: "44px", fontSize: "11px", fontWeight: 800, textAlign: "center" }}>{match.teamAway.substring(0, 3).toUpperCase()}</div>
                            }
                            <div style={{ fontSize: "12px", fontWeight: 700, lineHeight: "1.4" }}>{match.teamAway}</div>
                          </TD>
                        </TR>
                      </div>
                    </div>

                    {/* ── Correct Answers ── */}
                    {sd && (
                      <div style={{ display: "table", width: "100%", borderSpacing: "4px", marginBottom: "12px" }}>
                        <TR>
                          {[
                            { label: "Winner", value: correctAnswers.winner },
                            { label: "Score", value: correctAnswers.score },
                            { label: "Man of Match", value: correctAnswers.scorer },
                          ].map((item) => (
                            <TD key={item.label} w={ansW} style={{ background: "rgba(67,223,158,0.07)", border: "1px solid rgba(67,223,158,0.15)", borderRadius: "8px", padding: "8px", boxSizing: "border-box" }}>
                              <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(67,223,158,0.55)", marginBottom: "3px" }}>{item.label}</div>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "#43df9e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.value ?? "—"}</div>
                            </TD>
                          ))}
                        </TR>
                      </div>
                    )}

                    {/* ── Prediction Stats ── */}
                    {totalUsers > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: "7px" }}>{totalUsers} Players Predicted</div>
                        <div style={{ display: "table", width: "100%", borderSpacing: "3px" }}>
                          <TR>
                            {[
                              { label: "Winner ✓", value: correctWinner, color: "#43df9e" },
                              { label: "Score ✓", value: correctScore, color: "#43df9e" },
                              { label: "MOTM ✓", value: correctScorer, color: "#43df9e" },
                              { label: "All 3 ✓", value: allThree, color: "#f59e0b" },
                            ].map((stat) => (
                              <TD key={stat.label} w={statW} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "9px", padding: "9px 4px", textAlign: "center", boxSizing: "border-box" }}>
                                <div style={{ fontSize: "22px", fontWeight: 900, color: stat.color, lineHeight: "1", fontFamily: "monospace" }}>{stat.value}</div>
                                <div style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "4px" }}>{stat.label}</div>
                              </TD>
                            ))}
                          </TR>
                        </div>
                      </div>
                    )}

                    {/* ── Top Scorers ── */}
                    {topUsers.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: "7px" }}>Top Scores</div>
                        {topUsers.map((entry: any, idx: number) => {
                          const preds = Object.values(entry.predictions) as any[];
                          const correct = preds.filter((p: any) => p.isCorrect).length;
                          const wrong = preds.filter((p: any) => p.isCorrect === false).length;
                          return (
                            <div key={entry.userId} style={{ display: "table", width: "100%", background: idx === 0 ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${idx === 0 ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.06)"}`, borderRadius: "8px", marginBottom: "4px", boxSizing: "border-box" }}>
                              <TR>
                                <TD w={28} style={{ textAlign: "center", paddingLeft: "8px", fontSize: "10px", fontWeight: 900, color: rankColor(idx) }}>#{idx + 1}</TD>
                                <TD style={{ fontSize: "12px", fontWeight: 600, color: "#fff", paddingLeft: "4px", paddingTop: "8px", paddingBottom: "8px", maxWidth: "160px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{entry.userName}</TD>
                                <TD w={44} style={{ textAlign: "center", paddingLeft: "4px", paddingRight: "4px" }}>
                                  <span style={{ display: "inline-block", fontSize: "9px", color: "#43df9e", background: "rgba(67,223,158,0.12)", padding: "2px 5px", borderRadius: "4px", fontWeight: 700 }}>✓{correct}</span>
                                </TD>
                                <TD w={44} style={{ textAlign: "center", paddingLeft: "2px", paddingRight: "4px" }}>
                                  <span style={{ display: "inline-block", fontSize: "9px", color: "#ff6b6b", background: "rgba(255,107,107,0.12)", padding: "2px 5px", borderRadius: "4px", fontWeight: 700 }}>✗{wrong}</span>
                                </TD>
                                <TD w={48} style={{ textAlign: "right", paddingRight: "10px", fontSize: "13px", fontWeight: 900, color: "#a855f7", fontFamily: "monospace" }}>{entry.pointsEarned}</TD>
                              </TR>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Footer ── */}
                    <div style={{ textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em", paddingTop: "4px" }}>
                      skorio.app · Predict the FIFA World Cup 🌍
                    </div>
                  </div>
                );
              })()}

              {/* Action buttons based on status */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/admin/matches/${match.id}/results`)}
                  className="flex-1 h-11 rounded-lg label-sm font-bold text-on-tertiary-container bg-tertiary-container hover:shadow-[0_0_15px_rgba(255,185,85,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  {statusInfo.type === "resulted" ? "Edit Result" : "Set Result"}
                </button>

                {isResulted && (
                  <button
                    onClick={() => handleShareMatch(match)}
                    disabled={sharingId === match.id}
                    className="h-11 w-11 rounded-lg label-sm font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
                    title="Share result"
                  >
                    {sharingId === match.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Fixture dashed card */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 flex flex-col items-center justify-center gap-3 p-6 group transition-all duration-300 min-h-[175px] hover:bg-white/5 select-none"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5 group-hover:border-primary/20">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <p className="label-md font-bold text-on-surface-variant group-hover:text-primary transition-colors">
            Add New Fixture
          </p>
        </button>
      </div>

      {/* Floating Action Button (FAB) on mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center z-40 active:scale-90 transition-transform cursor-pointer"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modal Dialog Overlay for Scheduling Match */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md surface-glass-1 rounded-xl p-6 relative flex flex-col gap-4 shadow-2xl border-white/15 animate-in fade-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="headline-md font-bold text-primary tracking-tight">
                Schedule New Fixture
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg("");
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </header>

            {errorMsg && (
              <div className="p-3 bg-error-container/20 border border-error-container/45 text-error rounded-lg text-sm flex items-center gap-2">
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block label-md text-on-surface-variant mb-1">
                    Home Team
                  </label>
                  <input
                    required
                    value={teamHome}
                    onChange={(e) => setTeamHome(e.target.value)}
                    placeholder="e.g. Man United"
                    className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block label-md text-on-surface-variant mb-1">
                    Away Team
                  </label>
                  <input
                    required
                    value={teamAway}
                    onChange={(e) => setTeamAway(e.target.value)}
                    placeholder="e.g. Man City"
                    className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block label-md text-on-surface-variant mb-1">
                  Kickoff Time
                </label>
                <input
                  required
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                  type="datetime-local"
                />
              </div>

              <div>
                <label className="block label-md text-on-surface-variant mb-1">
                  Prediction Deadline
                </label>
                <input
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                  type="datetime-local"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg("");
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg font-bold transition-all text-on-surface cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(139,128,255,0.3)] rounded-lg font-bold transition-all disabled:opacity-50 cursor-pointer text-center flex items-center justify-center"
                >
                  {submitting ? "Scheduling..." : "Schedule Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
