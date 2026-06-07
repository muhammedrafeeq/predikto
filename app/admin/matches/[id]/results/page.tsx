"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  Activity,
  Plus,
  Minus,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Search,
  Check,
  ChevronRight,
  ShieldAlert,
  Clock,
} from "lucide-react";

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
  "korea republic": "kr", "czechia": "cz",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

interface Match {
  id: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  status: string;
}

export default function ResultEntry({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const matchId = parseInt(id, 10);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Score states
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [winnerChoice, setWinnerChoice] = useState<"home" | "draw" | "away" | null>(null);
  const [scorerName, setScorerName] = useState("");
  const [recentMatches, setRecentMatches] = useState<Array<{ teams: string; result: string }>>([]);
  const [squadPlayers, setSquadPlayers] = useState<{ name: string; teamName: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // First goal minute & formation states
  const [firstGoalMinute, setFirstGoalMinute] = useState<number | "">("");
  const [homeFormation, setHomeFormation] = useState("");
  const [awayFormation, setAwayFormation] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch match details
        const res = await fetch(`/api/admin/matches/${matchId}/entries`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMatch(data.match);
            setSquadPlayers(data.players || []);
            if (data.firstGoalMinute !== null) setFirstGoalMinute(data.firstGoalMinute);
            if (data.homeFormation) setHomeFormation(data.homeFormation);
            if (data.awayFormation) setAwayFormation(data.awayFormation);
            
            // Prefill standard prediction answers if resulted
            if (data.entries && data.entries.length > 0) {
              const firstEntry = data.entries[0];
              const correctWinner = firstEntry.predictions?.winner?.correctAnswer;
              const correctScore = firstEntry.predictions?.score?.correctAnswer;
              const correctScorer = firstEntry.predictions?.scorer?.correctAnswer;
              if (correctWinner) {
                if (correctWinner === data.match.teamHome) setWinnerChoice("home");
                else if (correctWinner === data.match.teamAway) setWinnerChoice("away");
                else setWinnerChoice("draw");
              }
              if (correctScore) {
                const parts = correctScore.split("-");
                if (parts.length === 2) {
                  setHomeScore(parseInt(parts[0], 10) || 0);
                  setAwayScore(parseInt(parts[1], 10) || 0);
                }
              }
              if (correctScorer) {
                setScorerName(correctScorer);
              }
            }
          }
        }

        // Fetch recent resulted matches for the history chips
        const listRes = await fetch("/api/admin/matches");
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.success) {
            const resulted = listData.matches
              .filter((m: any) => m.status === "resulted")
              .slice(0, 3)
              .map((m: any) => ({
                teams: `${getTeamInitials(m.teamHome)} vs ${getTeamInitials(m.teamAway)}`,
                result: "Resulted",
              }));
            setRecentMatches(resulted);
          }
        }
      } catch (err) {
        console.error("Failed to load match details:", err);
        setErrorMsg("Failed to load match details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  // Synchronize winner selection with scores
  useEffect(() => {
    if (homeScore > awayScore) {
      setWinnerChoice("home");
    } else if (awayScore > homeScore) {
      setWinnerChoice("away");
    } else {
      setWinnerChoice("draw");
    }
  }, [homeScore, awayScore]);

  const stepScore = (team: "home" | "away", amount: number) => {
    if (team === "home") {
      setHomeScore((prev) => Math.max(0, prev + amount));
    } else {
      setAwayScore((prev) => Math.max(0, prev + amount));
    }
  };

  const handleWinnerSelect = (choice: "home" | "draw" | "away") => {
    setWinnerChoice(choice);
    // Adjust scorelines to match the manual winner select if needed, or leave it
  };

  const handlePublishResults = async () => {
    if (!match) return;
    setErrorMsg("");
    setSuccessMsg("");
    setShowProgress(true);

    if (!scorerName.trim()) {
      setErrorMsg("First goalscorer name is required");
      setShowProgress(false);
      return;
    }

    if (firstGoalMinute !== "" && (isNaN(Number(firstGoalMinute)) || Number(firstGoalMinute) < 1 || Number(firstGoalMinute) > 120)) {
      setErrorMsg("First goal minute must be between 1 and 120");
      setShowProgress(false);
      return;
    }

    if ((homeFormation && !awayFormation) || (!homeFormation && awayFormation)) {
      setErrorMsg("Please select both Home and Away formations, or leave both empty.");
      setShowProgress(false);
      return;
    }

    // Determine winner value (team name or Draw)
    let winnerValue = "Draw";
    if (winnerChoice === "home") {
      winnerValue = match.teamHome;
    } else if (winnerChoice === "away") {
      winnerValue = match.teamAway;
    }

    const scoreValue = `${homeScore}-${awayScore}`;

    try {
      // Simulate computing animation for 1.2s
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 1. Publish standard match results
      const res = await fetch(`/api/admin/matches/${matchId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner: winnerValue,
          score: scoreValue,
          scorer: scorerName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to publish match results");
        setShowProgress(false);
        return;
      }

      // 2. Publish first goal minute results if specified
      if (firstGoalMinute !== "") {
        const fgRes = await fetch("/api/admin/games/first-goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            firstGoalMinute: Number(firstGoalMinute),
          }),
        });
        if (!fgRes.ok) {
          const fgData = await fgRes.json();
          setErrorMsg(`Match results published, but failed to save first goal timer: ${fgData.error || "Error"}`);
          setShowProgress(false);
          return;
        }
      }

      // 3. Publish formation results if specified
      if (homeFormation && awayFormation) {
        const formRes = await fetch("/api/admin/games/formation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            homeFormation,
            awayFormation,
          }),
        });
        if (!formRes.ok) {
          const formData = await formRes.json();
          setErrorMsg(`Match results published, but failed to save formations: ${formData.error || "Error"}`);
          setShowProgress(false);
          return;
        }
      }

      setSuccessMsg("RESULTS PUBLISHED SUCCESSFULLY");
      setTimeout(() => {
        router.push("/admin/matches");
      }, 1500);
    } catch (err) {
      console.error("Publish results error:", err);
      setErrorMsg("Internal server error");
      setShowProgress(false);
    }
  };

  const getTeamInitials = (name: string) => {
    return name.substring(0, 3).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Result Workspace...
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

      {/* Header section */}
      <div>
        <h2 className="headline-lg text-on-surface mb-1">Enter Results</h2>
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-primary rounded-full" />
          <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
            Verify Final Scores & Standings
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error-container/45 text-error rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl text-sm flex items-center gap-2 font-bold justify-center">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main split */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form area (Left) */}
        <div className="flex-1 space-y-6">
          {/* Match Banner Card */}
          {match && (
            <div className="surface-glass-1 rounded-xl p-6 relative overflow-hidden select-none">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-extrabold text-primary">
                      {getTeamInitials(match.teamHome)}
                    </span>
                  </div>
                  <h3 className="headline-md text-white font-bold">{match.teamHome}</h3>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-white/10 font-mono italic">VS</span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1.5 bg-white/5 px-3 py-0.5 rounded-full border border-white/5">
                    Premier League
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-extrabold text-primary">
                      {getTeamInitials(match.teamAway)}
                    </span>
                  </div>
                  <h3 className="headline-md text-white font-bold">{match.teamAway}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Input workspace */}
          <section className="surface-glass-1 rounded-xl p-6 space-y-6">
            {/* Outcome choice */}
            <div className="space-y-3">
              <label className="label-md text-on-surface-variant flex items-center gap-2 select-none uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-primary" />
                Match Outcome
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleWinnerSelect("home")}
                  className={`py-4 rounded-xl transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    winnerChoice === "home"
                      ? "bg-white/10 border-primary shadow-[0_0_15px_rgba(139,128,255,0.15)] text-white"
                      : "surface-glass-1 border-transparent text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  <span className="label-md font-bold">
                    {match ? getTeamInitials(match.teamHome) : "HOME"}
                  </span>
                  <span className="text-[10px] uppercase font-semibold">Home Win</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWinnerSelect("draw")}
                  className={`py-4 rounded-xl transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    winnerChoice === "draw"
                      ? "bg-white/10 border-primary shadow-[0_0_15px_rgba(139,128,255,0.15)] text-white"
                      : "surface-glass-1 border-transparent text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  <span className="label-md font-bold">DRAW</span>
                  <span className="text-[10px] uppercase font-semibold">No Winner</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWinnerSelect("away")}
                  className={`py-4 rounded-xl transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    winnerChoice === "away"
                      ? "bg-white/10 border-primary shadow-[0_0_15px_rgba(139,128,255,0.15)] text-white"
                      : "surface-glass-1 border-transparent text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  <span className="label-md font-bold">
                    {match ? getTeamInitials(match.teamAway) : "AWAY"}
                  </span>
                  <span className="text-[10px] uppercase font-semibold">Away Win</span>
                </button>
              </div>
            </div>

            {/* Score & Scorer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scoreline */}
              <div className="space-y-3">
                <label className="label-md text-on-surface-variant flex items-center gap-2 select-none uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-primary" />
                  Final Scoreline
                </label>
                <div className="flex items-center justify-between surface-glass-1 p-4 rounded-xl select-none">
                  {/* Home Score */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-on-surface-variant font-bold">
                      {match ? getTeamInitials(match.teamHome) : "HOME"}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => stepScore("home", -1)}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      <span className="headline-lg text-primary w-6 text-center font-mono font-extrabold">
                        {homeScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => stepScore("home", 1)}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    </div>
                  </div>

                  <div className="h-10 w-[1px] bg-white/10" />

                  {/* Away Score */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-on-surface-variant font-bold">
                      {match ? getTeamInitials(match.teamAway) : "AWAY"}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => stepScore("away", -1)}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      <span className="headline-lg text-secondary w-6 text-center font-mono font-extrabold">
                        {awayScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => stepScore("away", 1)}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scorer */}
              <div className={`space-y-3 relative ${dropdownOpen ? "z-30" : "z-10"}`}>
                <label className="label-md text-on-surface-variant flex items-center gap-2 select-none uppercase tracking-wider">
                  <Search className="w-4 h-4 text-primary" />
                  Man of the Match
                </label>
                <div className="relative group">
                  <input
                    value={scorerName}
                    onChange={(e) => {
                      setScorerName(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    onBlur={() => {
                      // Slight delay to allow clicking items in dropdown
                      setTimeout(() => setDropdownOpen(false), 200);
                    }}
                    placeholder="Search player name..."
                    className="w-full h-[68px] bg-[#050507] border border-white/10 rounded-xl px-4 pt-4 text-on-surface focus:border-primary focus:ring-0 focus:outline-none transition-all placeholder:text-on-surface-variant/30 text-sm font-semibold"
                    type="text"
                  />
                  <span className="absolute left-4 bottom-2 text-[9px] text-on-surface-variant uppercase tracking-tighter select-none font-bold">
                    Enter or select Full Name
                  </span>
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors w-5 h-5 pointer-events-none" />
                </div>

                {/* Squad Dropdown Autocomplete */}
                {dropdownOpen && squadPlayers.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-[84px] bg-[#101015] border border-white/10 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto"
                    style={{ backdropFilter: "blur(20px)" }}
                  >
                    {/* Option to use custom typed text if not empty */}
                    {scorerName.trim() !== "" && (
                      <div
                        onMouseDown={() => {
                          setScorerName(scorerName.trim());
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/10 border-b border-white/5 cursor-pointer transition-colors text-left"
                      >
                        <Plus className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white/95">Use "{scorerName.trim()}"</span>
                          <span className="text-[10px] text-white/40 font-medium">Use custom player name</span>
                        </div>
                      </div>
                    )}

                    {squadPlayers.filter(p => p.name.toLowerCase().includes(scorerName.toLowerCase())).length === 0 ? (
                      <div className="p-3 text-xs text-white/40 text-center select-none">
                        No matching squad players. Click the "Use" button above to submit this custom name.
                      </div>
                    ) : (
                      squadPlayers
                        .filter(p => p.name.toLowerCase().includes(scorerName.toLowerCase()))
                        .map((player) => {
                          const flag = getFlag(player.teamName);
                          return (
                            <div
                              key={player.name}
                              onMouseDown={() => {
                                setScorerName(player.name);
                                setDropdownOpen(false);
                              }}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors text-left"
                            >
                              <span className="text-sm font-semibold text-white/95">{player.name}</span>
                              <div className="flex items-center gap-1.5">
                                {flag && (
                                  <img
                                    src={flag}
                                    alt={player.teamName}
                                    className="w-4 h-3.5 object-cover rounded-sm opacity-80"
                                  />
                                )}
                                <span className="text-[10px] text-white/40 uppercase font-medium">{player.teamName}</span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Contest Results (First Goal & Formations) */}
            <div className="border-t border-white/5 pt-6 space-y-6">
              <h3 className="label-md font-extrabold uppercase tracking-widest text-on-surface-variant select-none">
                Advanced Contest Results (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Goal Timer */}
                <div className="space-y-3">
                  <label className="label-md text-on-surface-variant flex items-center gap-2 select-none uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-secondary" />
                    First Goal Minute
                  </label>
                  <div className="relative group">
                    <input
                      value={firstGoalMinute}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") setFirstGoalMinute("");
                        else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num)) setFirstGoalMinute(num);
                        }
                      }}
                      placeholder="e.g. 17"
                      min={1}
                      max={120}
                      className="w-full h-[68px] bg-[#050507] border border-white/10 rounded-xl px-4 pt-4 text-on-surface focus:border-secondary focus:ring-0 focus:outline-none transition-all placeholder:text-on-surface-variant/30 text-sm font-semibold font-mono"
                      type="number"
                    />
                    <span className="absolute left-4 bottom-2 text-[9px] text-on-surface-variant uppercase tracking-tighter select-none font-bold">
                      Enter minute (1 - 120)
                    </span>
                  </div>
                </div>

                {/* Formations */}
                <div className="space-y-3">
                  <label className="label-md text-on-surface-variant flex items-center gap-2 select-none uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    Match Formations
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase select-none">Home</span>
                      <select
                        value={homeFormation}
                        onChange={(e) => setHomeFormation(e.target.value)}
                        className="w-full bg-[#050507] border border-white/10 rounded-xl px-3 py-3 text-on-surface focus:border-secondary focus:outline-none cursor-pointer text-sm font-semibold"
                      >
                        <option value="">Select...</option>
                        {["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase select-none">Away</span>
                      <select
                        value={awayFormation}
                        onChange={(e) => setAwayFormation(e.target.value)}
                        className="w-full bg-[#050507] border border-white/10 rounded-xl px-3 py-3 text-on-surface focus:border-secondary focus:outline-none cursor-pointer text-sm font-semibold"
                      >
                        <option value="">Select...</option>
                        {["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "3-4-3", "4-5-1", "4-1-4-1"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculate CTA */}
            <button
              onClick={handlePublishResults}
              disabled={showProgress}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary-container font-bold headline-md flex items-center justify-center gap-2 hover:shadow-[0_0_35px_rgba(139,128,255,0.4)] active:scale-98 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
              CALCULATE & PUBLISH
            </button>
          </section>
        </div>

        {/* Sidebar panels (Right) */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Award Preview */}
          <div className="bg-[#181822] border border-white/10 rounded-xl p-5 relative select-none">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-secondary to-primary opacity-50" />
            <h3 className="label-md font-extrabold uppercase tracking-widest text-on-surface-variant border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-secondary" />
              Award Preview
            </h3>

            {showProgress ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-on-surface-variant animate-pulse font-mono">
                  Computing Point Totals...
                </p>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-on-surface-variant font-sans text-sm">Correct Winner</span>
                  <span className="font-bold text-primary">+2 pts</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-on-surface-variant font-sans text-sm">Exact Score</span>
                  <span className="font-bold text-primary">+4 pts</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-on-surface-variant font-sans text-sm">Man of the Match</span>
                  <span className="font-bold text-primary">+2 pts</span>
                </div>

                <div className="pt-4 border-t border-white/10 mt-6 font-sans">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                      Max Match Standings
                    </span>
                    <span className="headline-lg text-secondary font-mono font-extrabold">11</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-full rounded-full shadow-[0_0_10px_rgba(67,223,158,0.4)]" />
                  </div>
                </div>

                <div className="mt-6 p-3.5 rounded-lg bg-secondary/5 border border-secondary/15 flex items-start gap-2.5 font-sans">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                    Publishing these results will finalize all user standings for this match week.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent resulted matches */}
          <div className="surface-glass-1 rounded-xl p-5 select-none">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-3 font-mono">
              Recent Submissions
            </p>
            <div className="space-y-2">
              {recentMatches.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No recently resulted matches.</p>
              ) : (
                recentMatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="text-xs font-semibold text-white">{m.teams}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                      {m.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
