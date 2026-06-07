"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  CheckCircle,
  Save,
  Clock,
  Loader2,
  GitBranch,
  AlertTriangle,
} from "lucide-react";

interface BracketResult {
  id?: number;
  stage: string;
  matchup: string;
  winner: string;
  recorded_at?: string;
}

const WC2026_GROUPS: { [key: string]: string[] } = {
  A: ["Mexico", "South Korea", "South Africa", "Czech Republic"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia & Herzegovina"],
  C: ["Brazil", "Morocco", "Scotland", "Haiti"],
  D: ["United States", "Paraguay", "Australia", "Turkey"],
  E: ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Iran", "Egypt", "New Zealand"],
  H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
  L: ["England", "Croatia", "Panama", "Ghana"],
};

const GROUP_LETTERS = Object.keys(WC2026_GROUPS);
const ALL_TEAMS = Object.values(WC2026_GROUPS).flat().sort();

type StageTab = "groups" | "r16" | "qf" | "sf" | "finals";

export default function BracketManager() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<BracketResult[]>([]);
  const [activeTab, setActiveTab] = useState<StageTab>("groups");
  
  // Saving states per matchup
  const [savingMatchup, setSavingMatchup] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form values
  const [winners, setWinners] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await fetch("/api/admin/games/bracket");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setResults(data.results);
            // Initialize form values
            const initialWinners: Record<string, string> = {};
            data.results.forEach((r: BracketResult) => {
              initialWinners[r.matchup] = r.winner;
            });
            setWinners(initialWinners);
          }
        }
      } catch (err) {
        console.error("Failed to load bracket results:", err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  const handleSaveResult = async (stage: string, matchup: string) => {
    const winner = winners[matchup];
    if (!winner) return;

    setSavingMatchup(matchup);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/games/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, matchup, winner }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: "success",
          text: `Saved result for ${matchup}. Recalculated ${data.predictionsUpdated} brackets!`,
        });
        // Update local results state
        setResults((prev) => {
          const filtered = prev.filter((r) => r.matchup !== matchup);
          return [...filtered, { stage, matchup, winner }];
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || "Failed to save bracket result",
        });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSavingMatchup(null);
      // Auto-clear message
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const getSavedWinner = (matchup: string) => {
    return results.find((r) => r.matchup === matchup)?.winner ?? "";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Bracket Manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">Bracket Manager</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-secondary rounded-full" />
            <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
              Publish Bracket Results & Award Points
            </p>
          </div>
        </div>
      </header>

      {/* Global Status Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 font-semibold ${
            statusMsg.type === "success"
              ? "bg-secondary/15 border border-secondary/20 text-secondary"
              : "bg-error/15 border border-error/20 text-error"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Stages Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {[
          { id: "groups", label: "Group Standings (A-L)" },
          { id: "r16", label: "Round of 16" },
          { id: "qf", label: "Quarter-finals" },
          { id: "sf", label: "Semi-finals" },
          { id: "finals", label: "Finals & Champion" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as StageTab)}
            className={`whitespace-nowrap px-4 py-2 rounded-full label-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                : "surface-glass-1 text-on-surface-variant hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Groups Stage (Group Letter Winner & Runner-up) ── */}
      {activeTab === "groups" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GROUP_LETTERS.map((letter) => {
            const m1 = `${letter}1`; // 1st place matchup ID
            const m2 = `${letter}2`; // 2nd place matchup ID
            const groupTeams = WC2026_GROUPS[letter];

            return (
              <div key={letter} className="surface-glass-1 rounded-xl p-5 border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h3 className="text-sm font-extrabold text-primary">Group {letter}</h3>
                  <span className="text-[10px] text-on-surface-variant font-mono">2 slots</span>
                </div>

                <div className="space-y-4">
                  {/* 1st Place */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">1st Place Winner ({m1})</span>
                    <div className="flex gap-2">
                      <select
                        value={winners[m1] ?? ""}
                        onChange={(e) => setWinners((w) => ({ ...w, [m1]: e.target.value }))}
                        className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                      >
                        <option value="">Select Team...</option>
                        {groupTeams.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveResult("group_winner", m1)}
                        disabled={savingMatchup === m1 || !winners[m1]}
                        className="px-3 bg-secondary/15 hover:bg-secondary/25 border border-secondary/35 text-secondary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                      >
                        {savingMatchup === m1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                    {getSavedWinner(m1) && (
                      <span className="text-[10px] text-secondary font-semibold font-mono">✓ Saved: {getSavedWinner(m1)}</span>
                    )}
                  </div>

                  {/* 2nd Place */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">2nd Place Runner-up ({m2})</span>
                    <div className="flex gap-2">
                      <select
                        value={winners[m2] ?? ""}
                        onChange={(e) => setWinners((w) => ({ ...w, [m2]: e.target.value }))}
                        className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                      >
                        <option value="">Select Team...</option>
                        {groupTeams.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveResult("group_winner", m2)}
                        disabled={savingMatchup === m2 || !winners[m2]}
                        className="px-3 bg-secondary/15 hover:bg-secondary/25 border border-secondary/35 text-secondary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                      >
                        {savingMatchup === m2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                    {getSavedWinner(m2) && (
                      <span className="text-[10px] text-secondary font-semibold font-mono">✓ Saved: {getSavedWinner(m2)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Round of 16 (R16_0 to R16_15) ── */}
      {activeTab === "r16" && (
        <div className="surface-glass-1 rounded-xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <GitBranch className="w-5 h-5 text-primary" />
            <h3 className="text-base font-extrabold text-white">Round of 16 Winners</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 16 }).map((_, idx) => {
              const matchup = `R16_${idx}`;
              return (
                <div key={matchup} className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold font-mono">Matchup {idx + 1} ({matchup})</span>
                    {getSavedWinner(matchup) ? (
                      <span className="text-[10px] text-secondary font-semibold font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Saved: {getSavedWinner(matchup)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30 font-semibold font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={winners[matchup] ?? ""}
                      onChange={(e) => setWinners((w) => ({ ...w, [matchup]: e.target.value }))}
                      className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                    >
                      <option value="">Select winner team...</option>
                      {ALL_TEAMS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSaveResult("r16", matchup)}
                      disabled={savingMatchup === matchup || !winners[matchup]}
                      className="px-4 bg-primary/15 hover:bg-primary/25 border border-primary/35 text-primary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                    >
                      {savingMatchup === matchup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quarter-finals (QF_0 to QF_7) ── */}
      {activeTab === "qf" && (
        <div className="surface-glass-1 rounded-xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <GitBranch className="w-5 h-5 text-primary" />
            <h3 className="text-base font-extrabold text-white">Quarter-final Winners</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => {
              const matchup = `QF_${idx}`;
              return (
                <div key={matchup} className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold font-mono">Matchup {idx + 1} ({matchup})</span>
                    {getSavedWinner(matchup) ? (
                      <span className="text-[10px] text-secondary font-semibold font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Saved: {getSavedWinner(matchup)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30 font-semibold font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={winners[matchup] ?? ""}
                      onChange={(e) => setWinners((w) => ({ ...w, [matchup]: e.target.value }))}
                      className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                    >
                      <option value="">Select winner team...</option>
                      {ALL_TEAMS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSaveResult("qf", matchup)}
                      disabled={savingMatchup === matchup || !winners[matchup]}
                      className="px-4 bg-primary/15 hover:bg-primary/25 border border-primary/35 text-primary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                    >
                      {savingMatchup === matchup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Semi-finals (SF_0 to SF_3) ── */}
      {activeTab === "sf" && (
        <div className="surface-glass-1 rounded-xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <GitBranch className="w-5 h-5 text-primary" />
            <h3 className="text-base font-extrabold text-white">Semi-final Winners</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => {
              const matchup = `SF_${idx}`;
              return (
                <div key={matchup} className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant font-bold font-mono">Matchup {idx + 1} ({matchup})</span>
                    {getSavedWinner(matchup) ? (
                      <span className="text-[10px] text-secondary font-semibold font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Saved: {getSavedWinner(matchup)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30 font-semibold font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={winners[matchup] ?? ""}
                      onChange={(e) => setWinners((w) => ({ ...w, [matchup]: e.target.value }))}
                      className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                    >
                      <option value="">Select winner team...</option>
                      {ALL_TEAMS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSaveResult("sf", matchup)}
                      disabled={savingMatchup === matchup || !winners[matchup]}
                      className="px-4 bg-primary/15 hover:bg-primary/25 border border-primary/35 text-primary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                    >
                      {savingMatchup === matchup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Finals (FINAL_0, FINAL_1, FINAL_WINNER) ── */}
      {activeTab === "finals" && (
        <div className="surface-glass-1 rounded-xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-extrabold text-white">Finalists & Tournament Champion</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Finalist 1 (FINAL_0) */}
            <div className="flex flex-col gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-on-surface-variant font-bold font-mono">Finalist 1 (FINAL_0)</span>
                {getSavedWinner("FINAL_0") ? (
                  <span className="text-[10px] text-secondary font-semibold font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Saved: {getSavedWinner("FINAL_0")}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 font-semibold font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={winners["FINAL_0"] ?? ""}
                  onChange={(e) => setWinners((w) => ({ ...w, FINAL_0: e.target.value }))}
                  className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                >
                  <option value="">Select team...</option>
                  {ALL_TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSaveResult("final", "FINAL_0")}
                  disabled={savingMatchup === "FINAL_0" || !winners["FINAL_0"]}
                  className="px-4 bg-primary/15 hover:bg-primary/25 border border-primary/35 text-primary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                >
                  {savingMatchup === "FINAL_0" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>

            {/* Finalist 2 (FINAL_1) */}
            <div className="flex flex-col gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-on-surface-variant font-bold font-mono">Finalist 2 (FINAL_1)</span>
                {getSavedWinner("FINAL_1") ? (
                  <span className="text-[10px] text-secondary font-semibold font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Saved: {getSavedWinner("FINAL_1")}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 font-semibold font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={winners["FINAL_1"] ?? ""}
                  onChange={(e) => setWinners((w) => ({ ...w, FINAL_1: e.target.value }))}
                  className="flex-1 bg-[#050507] border border-white/10 rounded-lg p-2.5 text-on-surface text-sm focus:border-secondary focus:outline-none"
                >
                  <option value="">Select team...</option>
                  {ALL_TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSaveResult("final", "FINAL_1")}
                  disabled={savingMatchup === "FINAL_1" || !winners["FINAL_1"]}
                  className="px-4 bg-primary/15 hover:bg-primary/25 border border-primary/35 text-primary rounded-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
                >
                  {savingMatchup === "FINAL_1" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>

            {/* Champion (FINAL_WINNER) */}
            <div className="flex flex-col gap-2 p-5 bg-yellow-400/[0.02] border border-yellow-400/20 rounded-xl md:col-span-2 shadow-[0_0_20px_rgba(234,179,8,0.05)]">
              <div className="flex justify-between items-center border-b border-yellow-400/10 pb-2 mb-1">
                <span className="text-xs text-yellow-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> Tournament Champion (FINAL_WINNER)
                </span>
                {getSavedWinner("FINAL_WINNER") ? (
                  <span className="text-xs text-yellow-400 font-bold font-mono flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Winner: {getSavedWinner("FINAL_WINNER")}
                  </span>
                ) : (
                  <span className="text-xs text-white/30 font-semibold font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant mb-2">Select the official champion. This will award the final 15 bonus points to users with correct predictions.</p>
              <div className="flex gap-2">
                <select
                  value={winners["FINAL_WINNER"] ?? ""}
                  onChange={(e) => setWinners((w) => ({ ...w, FINAL_WINNER: e.target.value }))}
                  className="flex-1 bg-[#050507] border border-yellow-400/20 rounded-lg p-3 text-on-surface text-sm font-semibold focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Select Champion Team...</option>
                  {ALL_TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSaveResult("final", "FINAL_WINNER")}
                  disabled={savingMatchup === "FINAL_WINNER" || !winners["FINAL_WINNER"]}
                  className="px-6 bg-yellow-400 text-black hover:brightness-110 font-bold rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100"
                >
                  {savingMatchup === "FINAL_WINNER" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
                  Save Champion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
