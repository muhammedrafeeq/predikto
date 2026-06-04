"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Download,
  Sliders,
  ChevronRight,
  XCircle,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Edit2,
  Users,
} from "lucide-react";

interface RankingPlayer {
  rank: number;
  id: number;
  name: string;
  phone: string;
  role: string;
  points: number;
}

interface Match {
  id: number;
  teamHome: string;
  teamAway: string;
  status: string;
}

export default function AdminLeaderboard() {
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Override Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [overridePoints, setOverridePoints] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch rankings and resulted matches
  const loadData = async () => {
    try {
      // 1. Fetch Leaderboard Standings
      const leadRes = await fetch("/api/leaderboard");
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        if (leadData.success) {
          setRankings(leadData.rankings);
        }
      }

      // 2. Fetch Resulted Matches for Selection
      const matchRes = await fetch("/api/admin/matches");
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        if (matchData.success) {
          // Only show resulted matches for overrides to avoid breaking live deadline logic
          const resulted = matchData.matches.filter((m: any) => m.status === "resulted");
          setMatches(resulted);
        }
      }
    } catch (err) {
      console.error("Failed to load rankings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenOverride = (player: RankingPlayer) => {
    setSelectedPlayer(player);
    setSelectedMatchId(matches[0]?.id.toString() || "");
    setOverridePoints("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    if (!selectedPlayer || !selectedMatchId || overridePoints === "") {
      setErrorMsg("All fields are required");
      setSubmitting(false);
      return;
    }

    const pointsVal = parseInt(overridePoints, 10);
    if (isNaN(pointsVal) || pointsVal < 0 || pointsVal > 11) {
      setErrorMsg("Points override must be between 0 and 11");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/leaderboard/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPlayer.id,
          matchId: parseInt(selectedMatchId, 10),
          points: pointsVal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Score override applied successfully for ${selectedPlayer.name}`);
        // Refresh leaderboard
        await loadData();
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to apply override");
      }
    } catch (err) {
      console.error("Override submission error:", err);
      setErrorMsg("Internal server error");
    } finally {
      setSubmitting(false);
    }
  };

  // Exporter to CSV
  const handleExportCSV = () => {
    if (rankings.length === 0) return;

    const headers = ["Rank", "Name", "Phone", "Role", "Points"];
    const rows = rankings.map((p) => [
      p.rank,
      p.name,
      p.phone,
      p.role,
      p.points,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `skorio_standings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Leaderboard Standings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">Global Rankings</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
              Review Standings & Calibrate Points
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={rankings.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary label-md font-bold rounded-lg active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-5 h-5" />
          Export standings (CSV)
        </button>
      </header>

      {/* Rankings List Table */}
      <div className="surface-glass-1 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="p-4 font-semibold text-center w-16">Pos</th>
                <th className="p-4 font-semibold">Competitor</th>
                <th className="p-4 font-semibold font-mono text-center">Score</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-on-surface-variant label-md font-sans">
                    No competitor entries found on the leaderboard.
                  </td>
                </tr>
              ) : (
                rankings.map((player) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors">
                    {/* Rank */}
                    <td className="p-4 text-center font-bold text-base text-primary">
                      {player.rank}
                    </td>

                    {/* Competitor info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3 font-sans">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs select-none">
                          {player.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="label-md text-white font-bold">{player.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{player.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Points score */}
                    <td className="p-4 text-center">
                      <span className="text-secondary font-extrabold text-base bg-secondary/15 px-3.5 py-1 rounded-full border border-secondary/20 select-none">
                        {player.points} pts
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenOverride(player)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer font-sans"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-primary" /> Adjust Score
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Overlay for Score Override */}
      {isModalOpen && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md surface-glass-1 rounded-xl p-6 relative flex flex-col gap-4 shadow-2xl border-white/15 animate-in fade-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="headline-md font-bold text-primary tracking-tight">
                Calibrate Standings
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
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-secondary/10 border border-secondary/20 text-secondary rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block label-sm text-on-surface-variant mb-1">
                  Selected Competitor
                </label>
                <input
                  disabled
                  value={selectedPlayer.name}
                  className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-on-surface-variant cursor-not-allowed font-bold"
                  type="text"
                />
              </div>

              <div>
                <label className="block label-sm text-on-surface-variant mb-1">
                  Target Resulted Match
                </label>
                <select
                  required
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none h-[50px] cursor-pointer"
                >
                  {matches.length === 0 ? (
                    <option value="" disabled>No resulted matches found</option>
                  ) : (
                    matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.teamHome} vs {m.teamAway}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block label-sm text-on-surface-variant mb-1">
                  Override Match Score Points (0 to 11)
                </label>
                <input
                  required
                  min={0}
                  max={11}
                  value={overridePoints}
                  onChange={(e) => setOverridePoints(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-mono text-center text-lg font-bold"
                  type="number"
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
                  disabled={submitting || matches.length === 0}
                  className="flex-1 py-3 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(139,128,255,0.3)] rounded-lg font-bold transition-all disabled:opacity-50 cursor-pointer text-center flex items-center justify-center"
                >
                  {submitting ? "Applying..." : "Apply Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
