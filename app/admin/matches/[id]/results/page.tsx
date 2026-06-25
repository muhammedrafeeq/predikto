"use client";

import React, { useState, useEffect, use, useRef } from "react";
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
  Users,
  Share2,
  Loader2,
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
  isKnockout: boolean;
  knockoutRound: string | null;
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

  // ESPN auto-result states
  const [espnEventId, setEspnEventId] = useState("");
  const [espnFetching, setEspnFetching] = useState(false);
  const [espnPublishing, setEspnPublishing] = useState(false);
  const [espnPreview, setEspnPreview] = useState<any>(null);
  const [espnError, setEspnError] = useState<string | null>(null);

  // New question states
  const [firstGoalMinuteResult, setFirstGoalMinuteResult] = useState<string>("");
  const [noFirstGoal, setNoFirstGoal] = useState(false);
  const [extraTimeResult, setExtraTimeResult] = useState<"yes" | "no" | null>(null);
  const [firstYellowTeam, setFirstYellowTeam] = useState<"home" | "away" | null>(null);
  const [firstSubTeam, setFirstSubTeam] = useState<"home" | "away" | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingImage, setSharingImage] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

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
            setEntries(data.entries || []);
            if (data.firstGoalMinute !== null) setFirstGoalMinute(data.firstGoalMinute);
            if (data.homeFormation) setHomeFormation(data.homeFormation);
            if (data.awayFormation) setAwayFormation(data.awayFormation);

            // Prefill if already published
            if (data.entries && data.entries.length > 0) {
              const firstEntry = data.entries[0];
              const p = firstEntry.predictions ?? {};
              if (p.winner?.correctAnswer) {
                const cw = p.winner.correctAnswer;
                if (cw === data.match.teamHome) setWinnerChoice("home");
                else if (cw === data.match.teamAway) setWinnerChoice("away");
                else setWinnerChoice("draw");
              }
              if (p.score?.correctAnswer) {
                const parts = p.score.correctAnswer.split("-");
                if (parts.length === 2) { setHomeScore(parseInt(parts[0], 10) || 0); setAwayScore(parseInt(parts[1], 10) || 0); }
              }
              if (p.man_of_match?.correctAnswer) setScorerName(p.man_of_match.correctAnswer);
              if (p.first_goal_minute?.correctAnswer) {
                if (p.first_goal_minute.correctAnswer === "no_goal") setNoFirstGoal(true);
                else setFirstGoalMinuteResult(p.first_goal_minute.correctAnswer);
              }
              if (p.extra_time?.correctAnswer) setExtraTimeResult(p.extra_time.correctAnswer as "yes" | "no");
              if (p.first_yellow_team?.correctAnswer) {
                setFirstYellowTeam(p.first_yellow_team.correctAnswer === data.match.teamHome ? "home" : "away");
              }
              if (p.first_sub_team?.correctAnswer) {
                setFirstSubTeam(p.first_sub_team.correctAnswer === data.match.teamHome ? "home" : "away");
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

    if (firstGoalMinuteResult !== "" && !noFirstGoal && (isNaN(Number(firstGoalMinuteResult)) || Number(firstGoalMinuteResult) < 1 || Number(firstGoalMinuteResult) > 120)) {
      setErrorMsg("First goal minute must be between 1 and 120");
      setShowProgress(false);
      return;
    }

    if ((homeFormation && !awayFormation) || (!homeFormation && awayFormation)) {
      setErrorMsg("Please select both Home and Away formations, or leave both empty.");
      setShowProgress(false);
      return;
    }

    let winnerValue = "Draw";
    if (winnerChoice === "home") winnerValue = match.teamHome;
    else if (winnerChoice === "away") winnerValue = match.teamAway;

    const scoreValue = `${homeScore}-${awayScore}`;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const payload: Record<string, any> = {
        winner: winnerValue,
        score: scoreValue,
      };
      if (scorerName.trim()) payload.man_of_match = scorerName.trim();
      payload.first_goal_minute = noFirstGoal ? "no_goal" : firstGoalMinuteResult.trim() || "no_goal";
      if (extraTimeResult) payload.extra_time = extraTimeResult;
      if (firstYellowTeam) payload.first_yellow_team = firstYellowTeam === "home" ? match.teamHome : match.teamAway;
      if (firstSubTeam) payload.first_sub_team = firstSubTeam === "home" ? match.teamHome : match.teamAway;

      const res = await fetch(`/api/admin/matches/${matchId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to publish match results");
        setShowProgress(false);
        return;
      }

      // 2. Publish formation results if specified
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

  const filteredEntries = entries.filter((e) =>
    e.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.userPhone.includes(searchQuery)
  );

  const handleSharePredictionsImage = async () => {
    if (sharingImage || !match) return;
    setSharingImage(true);
    setCopyToast(null);

    try {
      const el = shareCardRef.current;
      if (!el) throw new Error("Share card element not found");

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        backgroundColor: "#0e0c1a",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas toBlob failed"));
          },
          "image/png",
          0.95
        );
      });

      const file = new File([blob], "skorio-predictions.png", { type: "image/png" });
      const shareText = `⚽ ${match.teamHome} vs ${match.teamAway} — All user predictions on Skorio! 🏆`;

      // 1. Try native mobile share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: shareText,
        });
        return;
      }

      // 2. Try copying image to clipboard
      if (typeof window !== "undefined" && "ClipboardItem" in window) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopyToast("📋 Image copied to clipboard! Paste in WhatsApp");
          setTimeout(() => setCopyToast(null), 4000);
          return;
        } catch (clipErr) {
          console.warn("Clipboard image write failed, falling back", clipErr);
        }
      }

      // 3. Last resort: Download image file and open WhatsApp link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${match.teamHome}-vs-${match.teamAway}-predictions.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCopyToast("💾 Image downloaded! Share it to WhatsApp");
      setTimeout(() => setCopyToast(null), 4000);

      // Open WhatsApp Web/App
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to share predictions image:", err);
        setCopyToast("❌ Failed to generate share image");
        setTimeout(() => setCopyToast(null), 3000);
      }
    } finally {
      setSharingImage(false);
    }
  };

  const handleESPNFetch = async () => {
    if (!espnEventId.trim()) return;
    setEspnFetching(true);
    setEspnError(null);
    setEspnPreview(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/auto-result?espnEventId=${espnEventId.trim()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEspnError(data.error || "Failed to fetch from ESPN");
      } else {
        setEspnPreview(data.result);
        // Autofill the manual form fields from ESPN data
        const r = data.result;
        const hs = r.homeScore ?? 0;
        const as_ = r.awayScore ?? 0;
        setHomeScore(hs);
        setAwayScore(as_);
        if (hs > as_) setWinnerChoice("home");
        else if (as_ > hs) setWinnerChoice("away");
        else setWinnerChoice("draw");
        if (match?.isKnockout) {
          setTotalGoals(r.totalGoals);
          if (r.firstGoalMinute === "no_goal") { setKoNoFirstGoal(true); setKoFirstGoalMinute(""); }
          else { setKoNoFirstGoal(false); setKoFirstGoalMinute(r.firstGoalMinute); }
          setKoExtraTime(r.extraTime);
          if (r.firstGoalscorer === "no_goal") { setKoNoGoalscorer(true); setKoFirstGoalscorer(""); }
          else { setKoNoGoalscorer(false); setKoFirstGoalscorer(r.firstGoalscorer); }
        }
      }
    } catch {
      setEspnError("Network error fetching ESPN data");
    } finally {
      setEspnFetching(false);
    }
  };

  const handleESPNPublish = async () => {
    if (!espnEventId.trim() || !espnPreview) return;
    setEspnPublishing(true);
    setEspnError(null);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch(`/api/admin/matches/${matchId}/auto-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ espnEventId: espnEventId.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEspnError(data.error || "Auto-result failed");
      } else {
        setSuccessMsg(`✅ AUTO-RESULT PUBLISHED — ${data.espnResult.scoreline} · ${data.usersScored} users scored`);
        setTimeout(() => router.push("/admin/matches"), 2000);
      }
    } catch {
      setEspnError("Network error during publish");
    } finally {
      setEspnPublishing(false);
    }
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
    <div className="space-y-6 relative">
      {copyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white text-sm font-bold px-5 py-3 rounded-full shadow-xl select-none">
          {copyToast}
        </div>
      )}
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




            {/* Calculate CTA */}
            <button
              onClick={handlePublishResults}
              disabled={showProgress}
              className="w-full py-4 rounded-xl bg-linear-to-r from-primary-container to-inverse-primary text-on-primary-container font-bold headline-md flex items-center justify-center gap-2 hover:shadow-[0_0_35px_rgba(139,128,255,0.4)] active:scale-98 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
              CALCULATE & PUBLISH
            </button>
          </section>

          {/* User Predictions List */}
          <section className="surface-glass-1 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                  <Users className="w-4 h-4 text-primary" /> User Predictions ({entries.length})
                </h3>
                <p className="text-[10px] text-on-surface-variant/60 font-mono">
                  All submitted tips for this fixture before result computation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSharePredictionsImage}
                  disabled={sharingImage || entries.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-bold rounded-lg cursor-pointer transition-all disabled:opacity-50 shrink-0"
                  title="Share predictions image to WhatsApp"
                >
                  {sharingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  Share Image
                </button>
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050507] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-white/20"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                </div>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <p className="text-xs text-white/40 italic py-6 text-center">No predictions found.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[9px] font-bold">
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Winner</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">MOTM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.userId} className="hover:bg-white/2 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div>{entry.userName}</div>
                          <div className="text-[9px] text-white/30 font-mono">{entry.userPhone}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {entry.predictions.winner ? (
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] border ${
                              entry.predictions.winner.isCorrect === true
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold"
                                : entry.predictions.winner.isCorrect === false
                                ? "bg-red-500/5 border-red-500/20 text-red-400/60 line-through"
                                : "bg-white/5 border-white/5 text-white/80"
                            }`}>
                              {entry.predictions.winner.answer}
                            </span>
                          ) : (
                            <span className="text-white/20 italic text-[10px]">-</span>
                          )}
                        </td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${
                          entry.predictions.score?.isCorrect === true ? "text-emerald-400"
                          : entry.predictions.score?.isCorrect === false ? "text-red-400/60 line-through"
                          : "text-primary"
                        }`}>
                          {entry.predictions.score?.answer ?? "-"}
                        </td>
                        <td className={`py-2.5 px-3 text-[10px] ${
                          entry.predictions.man_of_match?.isCorrect === true ? "text-emerald-400 font-bold"
                          : entry.predictions.man_of_match?.isCorrect === false ? "text-red-400/60 line-through"
                          : "text-white/70"
                        }`}>
                          {entry.predictions.man_of_match?.answer ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar panels (Right) */}
        <div className="w-full lg:w-80 space-y-6">

          {/* ESPN Auto-Result Panel */}
          <div className="bg-[#181822] border border-white/10 rounded-xl p-5 space-y-4 relative">
            <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-amber-500 to-orange-400 opacity-60 rounded-t-xl" />
            <h3 className="label-md font-extrabold uppercase tracking-widest text-amber-400/80 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              ESPN Auto-Result
            </h3>

            <p className="text-[10px] text-white/30 leading-relaxed">
              Enter the ESPN event ID to auto-fetch and publish all correct answers in one tap.
              Find it in the ESPN match URL: <span className="font-mono text-white/40">…summary?event=<span className="text-amber-400">704445</span></span>
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={espnEventId}
                onChange={(e) => { setEspnEventId(e.target.value); setEspnPreview(null); setEspnError(null); }}
                placeholder="ESPN event ID…"
                className="flex-1 bg-[#050507] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={handleESPNFetch}
                disabled={!espnEventId.trim() || espnFetching}
                className="px-3 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-all disabled:opacity-40 cursor-pointer"
              >
                {espnFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Fetch"
                )}
              </button>
            </div>

            {espnError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{espnError}</span>
              </div>
            )}

            {espnPreview && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80">{espnPreview.homeName} vs {espnPreview.awayName}</span>
                    <span className="text-base font-black font-mono text-emerald-400">{espnPreview.scoreline}</span>
                  </div>
                  <div className="text-[10px] text-white/40 space-y-0.5">
                    <div>Winner: <span className="text-white/70 font-semibold">{espnPreview.winner}</span></div>
                    <div>Total goals: <span className="text-white/70 font-semibold">{espnPreview.totalGoals}</span></div>
                    {match?.isKnockout && (
                      <>
                        <div>1st goal: <span className="text-white/70 font-semibold">{espnPreview.firstGoalMinute === "no_goal" ? "No goal" : `${espnPreview.firstGoalMinute}'`}</span></div>
                        <div>Extra time: <span className="text-white/70 font-semibold">{espnPreview.extraTime === "yes" ? "Yes" : "No"}</span></div>
                        <div>1st scorer: <span className="text-white/70 font-semibold">{espnPreview.firstGoalscorer === "no_goal" ? "No goal" : espnPreview.firstGoalscorer}</span></div>
                      </>
                    )}
                    <div className="pt-1 text-amber-400/60">
                      Status: {espnPreview.status} · Period {espnPreview.period}
                    </div>
                  </div>
                </div>

                {espnPreview.status !== "final" && espnPreview.status !== "postgame" && (
                  <p className="text-[10px] text-amber-400/80 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Match may not be finished — publish anyway?
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleESPNPublish}
                  disabled={espnPublishing}
                  className="w-full py-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-black flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {espnPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Publish via ESPN
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Award Preview */}
          <div className="bg-[#181822] border border-white/10 rounded-xl p-5 relative select-none">
            <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-secondary to-primary opacity-50" />
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
              <div className="space-y-2 font-mono text-xs">
                {[
                  { label: "Exact Score", pts: "+4 pts" },
                  { label: "Correct Winner", pts: "+2 pts" },
                  { label: "Man of the Match", pts: "+2 pts" },
                ].map(({ label, pts }) => (
                  <div key={label} className="flex justify-between items-center p-2.5 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-on-surface-variant font-sans text-xs">{label}</span>
                    <span className="font-bold text-primary text-xs">{pts}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2.5 bg-amber-500/8 rounded-lg border border-amber-500/20">
                  <span className="text-amber-300 font-sans text-xs font-bold">🏆 All Correct Bonus</span>
                  <span className="font-black text-amber-400 text-xs">+3 pts</span>
                </div>

                <div className="pt-3 border-t border-white/10 mt-4 font-sans">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                      Max Points
                    </span>
                    <span className="headline-lg text-secondary font-mono font-extrabold">11</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-full rounded-full shadow-[0_0_10px_rgba(67,223,158,0.4)]" />
                  </div>
                </div>

                <div className="mt-6 p-3.5 rounded-lg bg-secondary/5 border border-secondary/15 flex items-start gap-2.5 font-sans">
                  <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
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

      {/* Hidden predictions share card - captured by html2canvas */}
      {match && (
        <div
          ref={shareCardRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "420px",
            background: "#0e0c1a",
            borderRadius: "16px",
            padding: "20px",
            fontFamily: "Arial, sans-serif",
            color: "#fff",
            border: "1px solid rgba(168,85,247,0.25)",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ display: "table", width: "100%", marginBottom: "16px" }}>
            <div style={{ display: "table-row" }}>
              <div style={{ display: "table-cell", fontSize: "16px", fontWeight: 900, color: "#a855f7" }}>
                SKO<span style={{ color: "#fff" }}>RIO</span>
              </div>
              <div style={{ display: "table-cell", textAlign: "right", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                FIFA WC 2026 · Predictions
              </div>
            </div>
          </div>

          {/* Teams Header */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: "16px", padding: "12px 16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", textAlign: "center" }}>
              Upcoming Fixture
            </div>
            <div style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", textAlign: "center", letterSpacing: "0.02em" }}>
              {match.teamHome} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>vs</span> {match.teamAway}
            </div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "4px", fontFamily: "monospace" }}>
              {new Date(match.matchTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </div>
          </div>

          {/* Predictions Table */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>
              User Tips ({entries.length} total)
            </div>

            <div style={{ display: "table", width: "100%", borderCollapse: "collapse" }}>
              {/* Table Header */}
              <div style={{ display: "table-row", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "table-cell", padding: "6px 4px", fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>User</div>
                <div style={{ display: "table-cell", padding: "6px 4px", fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Winner</div>
                <div style={{ display: "table-cell", padding: "6px 4px", fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Score</div>
                <div style={{ display: "table-cell", padding: "6px 4px", fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>MOTM</div>
              </div>

              {/* Table Rows (Max 15 for image layout) */}
              {entries.slice(0, 15).map((entry, idx) => (
                <div key={entry.userId} style={{ display: "table-row", background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <div style={{ display: "table-cell", padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "10px", fontWeight: 700 }}>
                    {entry.userName.split(" ").slice(0, 2).join(" ")}
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      padding: "6px 4px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      fontSize: "9px",
                      color: entry.predictions.winner?.isCorrect === true
                        ? "#4ade80"
                        : entry.predictions.winner?.isCorrect === false
                        ? "rgba(239, 68, 68, 0.6)"
                        : "rgba(255,255,255,0.7)",
                      textDecoration: entry.predictions.winner?.isCorrect === false ? "line-through" : "none",
                      fontWeight: entry.predictions.winner?.isCorrect === true ? "bold" : "normal",
                    }}
                  >
                    {entry.predictions.winner?.answer
                      ? `${entry.predictions.winner.answer}${entry.predictions.winner.isCorrect === true ? " ✓" : ""}`
                      : "-"}
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      padding: "6px 4px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      fontSize: "9px",
                      fontWeight: "bold",
                      color: entry.predictions.score?.isCorrect === true
                        ? "#4ade80"
                        : entry.predictions.score?.isCorrect === false
                        ? "rgba(239, 68, 68, 0.6)"
                        : "#a855f7",
                      textDecoration: entry.predictions.score?.isCorrect === false ? "line-through" : "none",
                      fontFamily: "monospace",
                    }}
                  >
                    {entry.predictions.score?.answer
                      ? `${entry.predictions.score.answer}${entry.predictions.score.isCorrect === true ? " ✓" : ""}`
                      : "-"}
                  </div>
                  <div
                    style={{
                      display: "table-cell",
                      padding: "6px 4px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      fontSize: "9px",
                      color: entry.predictions.man_of_match?.isCorrect === true
                        ? "#4ade80"
                        : entry.predictions.man_of_match?.isCorrect === false
                        ? "rgba(239, 68, 68, 0.6)"
                        : "rgba(255,255,255,0.7)",
                      textDecoration: entry.predictions.man_of_match?.isCorrect === false ? "line-through" : "none",
                      fontWeight: entry.predictions.man_of_match?.isCorrect === true ? "bold" : "normal",
                    }}
                  >
                    {entry.predictions.man_of_match?.answer
                      ? `${entry.predictions.man_of_match.answer}${entry.predictions.man_of_match.isCorrect === true ? " ✓" : ""}`
                      : "-"}
                  </div>
                </div>
              ))}
            </div>

            {entries.length > 15 && (
              <div style={{ textAlign: "center", fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontStyle: "italic" }}>
                + {entries.length - 15} more user predictions on Skorio
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            skorio.app · Predict & Win 🏆
          </div>
        </div>
      )}
    </div>
  );
}
