"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/admin/matches");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMatches(data.matches);
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

  const getTeamInitials = (name: string) => {
    return name.substring(0, 3).toUpperCase();
  };

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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-on-surface-variant">
                  Premier League
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
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                    <span className="headline-md text-lg text-primary font-bold">
                      {getTeamInitials(match.teamHome)}
                    </span>
                  </div>
                  <span className="label-sm text-center text-on-surface font-semibold max-w-[100px] truncate">
                    {match.teamHome}
                  </span>
                </div>

                {/* Score or Time */}
                <div className="flex flex-col items-center px-4">
                  {isResulted ? (
                    <>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                        Final Score
                      </span>
                      {/* Scoreline could be loaded dynamically or calculated from results. We will link directly to details */}
                      <span className="text-2xl font-black text-primary tracking-widest">FT</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-widest mb-1 font-mono">
                        Kickoff
                      </span>
                      <div className="text-base font-bold text-on-surface font-mono">
                        {kickoff.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
                      </div>
                      <div className="h-0.5 w-4 bg-primary/30 mt-1 rounded-full" />
                    </>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                    <span className="headline-md text-lg text-primary font-bold">
                      {getTeamInitials(match.teamAway)}
                    </span>
                  </div>
                  <span className="label-sm text-center text-on-surface font-semibold max-w-[100px] truncate">
                    {match.teamAway}
                  </span>
                </div>
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

              {/* Action buttons based on status */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/admin/matches/${match.id}/questions`)}
                  className="flex-1 h-11 rounded-lg label-sm font-bold text-on-surface bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Config Questions
                </button>

                {statusInfo.type === "upcoming" && (
                  <button
                    onClick={() => router.push(`/admin/matches/${match.id}/entries`)}
                    className="flex-1 h-11 rounded-lg label-sm font-bold text-on-primary-container bg-primary-container hover:shadow-[0_0_15px_rgba(139,128,255,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Activity className="w-4 h-4" /> Live Entries
                  </button>
                )}

                {statusInfo.type === "live" && (
                  <button
                    onClick={() => router.push(`/admin/matches/${match.id}/results`)}
                    className="flex-1 h-11 rounded-lg label-sm font-bold text-on-tertiary-container bg-tertiary-container hover:shadow-[0_0_15px_rgba(255,185,85,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Validate Score
                  </button>
                )}

                {statusInfo.type === "resulted" && (
                  <button
                    onClick={() => router.push(`/admin/matches/${match.id}/entries`)}
                    className="flex-1 h-11 rounded-lg label-sm font-bold text-on-primary-container bg-primary-container hover:shadow-[0_0_15px_rgba(139,128,255,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Activity className="w-4 h-4" /> View Submissions
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
