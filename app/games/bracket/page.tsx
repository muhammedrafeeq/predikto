"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Lock, CheckCircle, XCircle, Clock, ChevronRight, AlertTriangle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BracketData {
  groups: { [groupLetter: string]: { first: string; second: string } };
  r16: string[];
  qf: string[];
  sf: string[];
  final: string[];
  winner: string;
}

interface BracketResult {
  stage: string;
  matchup: string;
  winner: string;
  recorded_at: string;
}

type TabId = "groups" | "knockout" | "review";

// ── WC 2026 Groups ────────────────────────────────────────────────────────────
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

// Group accent colors (cycling through a palette)
const GROUP_COLORS: { [key: string]: { border: string; text: string; bg: string; glow: string } } = {
  A: { border: "border-cyan-400/30",    text: "text-cyan-400",    bg: "bg-cyan-400/10",    glow: "rgba(34,211,238,0.12)"  },
  B: { border: "border-blue-400/30",    text: "text-blue-400",    bg: "bg-blue-400/10",    glow: "rgba(96,165,250,0.12)"  },
  C: { border: "border-green-400/30",   text: "text-green-400",   bg: "bg-green-400/10",   glow: "rgba(74,222,128,0.12)"  },
  D: { border: "border-yellow-400/30",  text: "text-yellow-400",  bg: "bg-yellow-400/10",  glow: "rgba(250,204,21,0.12)"  },
  E: { border: "border-rose-400/30",    text: "text-rose-400",    bg: "bg-rose-400/10",    glow: "rgba(251,113,133,0.12)" },
  F: { border: "border-purple-400/30",  text: "text-purple-400",  bg: "bg-purple-400/10",  glow: "rgba(192,132,252,0.12)" },
  G: { border: "border-orange-400/30",  text: "text-orange-400",  bg: "bg-orange-400/10",  glow: "rgba(251,146,60,0.12)"  },
  H: { border: "border-pink-400/30",    text: "text-pink-400",    bg: "bg-pink-400/10",    glow: "rgba(244,114,182,0.12)" },
  I: { border: "border-teal-400/30",    text: "text-teal-400",    bg: "bg-teal-400/10",    glow: "rgba(45,212,191,0.12)"  },
  J: { border: "border-lime-400/30",    text: "text-lime-400",    bg: "bg-lime-400/10",    glow: "rgba(163,230,53,0.12)"  },
  K: { border: "border-violet-400/30",  text: "text-violet-400",  bg: "bg-violet-400/10",  glow: "rgba(167,139,250,0.12)" },
  L: { border: "border-amber-400/30",   text: "text-amber-400",   bg: "bg-amber-400/10",   glow: "rgba(251,191,36,0.12)"  },
};

// ── R16 matchup seeding from group stage ─────────────────────────────────────
// WC 2026 simplified: top 2 per group (24 teams) + 8 best 3rd place
// For simplicity we seed R16 using the 24 group stage qualifiers only (top 2 each group)
// Matchup pairings: A1vsB2, B1vsA2, C1vsD2, D1vsC2, E1vsF2, F1vsE2, G1vsH2, H1vsG2,
// I1vsJ2, J1vsI2, K1vsL2, L1vsK2, then 4 wildcards from 3rd place — for UI we do 8 best 3rd
// Simplified: show 16 slots derived purely from group picks (top 2 per group = 24 teams,
// we slot them into fixed R16 matchup pairs)
function buildR16Slots(groups: BracketData["groups"]): { home: string; away: string }[] {
  // Standard seeding: A1-B2, C1-D2, E1-F2, G1-H2, I1-J2, K1-L2, then 6 more + 2 wildcards
  // For clean UX, we use a fixed 12-pair seeding from the 12 groups (top 2 each)
  // plus 4 best third-place wildcards shown as TBD until user has picked all groups.
  const get = (letter: string, slot: "first" | "second") =>
    groups[letter]?.[slot] ?? "";

  return [
    { home: get("A", "first"),  away: get("B", "second") },
    { home: get("B", "first"),  away: get("A", "second") },
    { home: get("C", "first"),  away: get("D", "second") },
    { home: get("D", "first"),  away: get("C", "second") },
    { home: get("E", "first"),  away: get("F", "second") },
    { home: get("F", "first"),  away: get("E", "second") },
    { home: get("G", "first"),  away: get("H", "second") },
    { home: get("H", "first"),  away: get("G", "second") },
    { home: get("I", "first"),  away: get("J", "second") },
    { home: get("J", "first"),  away: get("I", "second") },
    { home: get("K", "first"),  away: get("L", "second") },
    { home: get("L", "first"),  away: get("K", "second") },
    // 4 best 3rd-place — user picks from all 12 group 3rd-place teams
    { home: "Best 3rd (Group A-D)", away: "Best 3rd (Group E-H)"  },
    { home: "Best 3rd (Group I-L)", away: "Best 3rd (Group A-D)"  },
    { home: "Best 3rd (Group E-H)", away: "Best 3rd (Group I-L)"  },
    { home: "Best 3rd (Group A-L)", away: "Best 3rd (Group A-L)"  },
  ];
}

// ── Result helpers ────────────────────────────────────────────────────────────
function getResultForMatchup(results: BracketResult[], matchup: string): BracketResult | undefined {
  return results.find((r) => r.matchup === matchup);
}

function teamStatus(
  team: string,
  bracket: BracketData,
  results: BracketResult[],
  stage: "group_winner" | "r16" | "qf" | "sf" | "final_team" | "winner"
): "correct" | "wrong" | "pending" | "none" {
  if (!team) return "none";

  if (stage === "group_winner") {
    // Check A1..L1 and A2..L2
    for (const letter of GROUP_LETTERS) {
      const g = bracket.groups[letter];
      if (!g) continue;
      if (g.first === team) {
        const r = getResultForMatchup(results, `${letter}1`);
        if (!r) return "pending";
        return r.winner === team ? "correct" : "wrong";
      }
      if (g.second === team) {
        const r = getResultForMatchup(results, `${letter}2`);
        if (!r) return "pending";
        return r.winner === team ? "correct" : "wrong";
      }
    }
    return "none";
  }

  const stageKey = stage === "final_team" ? "final" : stage;
  const arr =
    stageKey === "r16"    ? bracket.r16    :
    stageKey === "qf"     ? bracket.qf     :
    stageKey === "sf"     ? bracket.sf     :
    stageKey === "final"  ? bracket.final  : [];

  const idx = arr.indexOf(team);
  if (idx === -1) return "none";

  const prefix =
    stageKey === "r16"   ? "R16"   :
    stageKey === "qf"    ? "QF"    :
    stageKey === "sf"    ? "SF"    :
    stageKey === "final" ? "FINAL" : "";

  const matchupKey = `${prefix}_${idx}`;
  const r = getResultForMatchup(results, matchupKey);
  if (!r) return "pending";
  return r.winner === team ? "correct" : "wrong";
}

// ── Small components ──────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: "correct" | "wrong" | "pending" | "none" }) {
  if (status === "correct") return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  if (status === "wrong")   return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === "pending") return <Clock className="w-3.5 h-3.5 text-white/30" />;
  return null;
}

function TeamPill({
  team,
  slot,
  onClick,
  disabled,
}: {
  team: string;
  slot: "first" | "second" | null;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 border
        ${slot === "first"
          ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-300"
          : slot === "second"
          ? "bg-white/15 border-white/30 text-white"
          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25"}
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{team}</span>
        {slot === "first" && (
          <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider shrink-0">1ST</span>
        )}
        {slot === "second" && (
          <span className="text-[9px] font-black text-white/60 uppercase tracking-wider shrink-0">2ND</span>
        )}
      </div>
    </button>
  );
}

// ── Knockout bracket match box ─────────────────────────────────────────────────
function MatchBox({
  home,
  away,
  winner,
  onPickWinner,
  disabled,
  result,
  label,
}: {
  home: string;
  away: string;
  winner: string;
  onPickWinner: (team: string) => void;
  disabled: boolean;
  result?: BracketResult;
  label: string;
}) {
  const isPlaceholder = (t: string) => !t || t.startsWith("Best 3rd") || t.startsWith("TBD");

  function TeamRow({ team, isWinner }: { team: string; isWinner: boolean }) {
    const ph = isPlaceholder(team);
    const correctness =
      result
        ? result.winner === team
          ? "correct"
          : isWinner
          ? "wrong"
          : "none"
        : "none";

    return (
      <button
        disabled={disabled || ph || !home || !away}
        onClick={() => !ph && onPickWinner(team)}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all duration-150
          ${isWinner && !ph
            ? "bg-yellow-400/20 text-yellow-300"
            : "text-white/50 hover:bg-white/5 hover:text-white"}
          ${ph ? "opacity-40 cursor-default" : "cursor-pointer"}
          ${disabled ? "cursor-default" : ""}
          ${correctness === "correct" ? "!text-green-400" : correctness === "wrong" ? "line-through !text-red-400/50" : ""}
        `}
      >
        <span className="truncate">{team || "TBD"}</span>
        {isWinner && !ph && <ChevronRight className="w-3 h-3 shrink-0" />}
        {correctness !== "none" && <StatusIcon status={correctness} />}
      </button>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-white/10 overflow-hidden bg-white/[0.02] min-w-[110px]">
      <div className="px-2 py-0.5 bg-white/5 text-[8px] font-black text-white/30 uppercase tracking-widest">
        {label}
      </div>
      <TeamRow team={home} isWinner={winner === home} />
      <div className="h-px bg-white/8" />
      <TeamRow team={away} isWinner={winner === away} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BracketPage() {
  const router = useRouter();

  // State
  const [tab, setTab] = useState<TabId>("groups");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [points, setPoints] = useState(0);

  const [results, setResults] = useState<BracketResult[]>([]);

  const [groups, setGroups] = useState<BracketData["groups"]>({});
  const [r16, setR16] = useState<string[]>(Array(16).fill(""));
  const [qf, setQf]   = useState<string[]>(Array(8).fill(""));
  const [sf, setSf]   = useState<string[]>(Array(4).fill(""));
  const [final, setFinal] = useState<string[]>(Array(2).fill(""));
  const [winner, setWinner] = useState("");

  // Load existing data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/games/bracket");
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          if (data.submitted && data.bracket) {
            setSubmitted(true);
            setPoints(data.points ?? 0);
            const b = data.bracket as BracketData;
            setGroups(b.groups ?? {});
            setR16(b.r16 ?? Array(16).fill(""));
            setQf(b.qf ?? Array(8).fill(""));
            setSf(b.sf ?? Array(4).fill(""));
            setFinal(b.final ?? Array(2).fill(""));
            setWinner(b.winner ?? "");
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Group pick handler
  const handleGroupPick = useCallback(
    (letter: string, team: string) => {
      setGroups((prev) => {
        const g = prev[letter] ?? { first: "", second: "" };
        // If team is already first
        if (g.first === team) {
          return { ...prev, [letter]: { first: "", second: g.second } };
        }
        // If team is already second
        if (g.second === team) {
          return { ...prev, [letter]: { first: g.first, second: "" } };
        }
        // If no first yet
        if (!g.first) {
          return { ...prev, [letter]: { first: team, second: g.second } };
        }
        // If no second yet
        if (!g.second) {
          return { ...prev, [letter]: { first: g.first, second: team } };
        }
        // Both slots full — replace second
        return { ...prev, [letter]: { first: g.first, second: team } };
      });
      // Invalidate knockout when groups change
      setR16(Array(16).fill(""));
      setQf(Array(8).fill(""));
      setSf(Array(4).fill(""));
      setFinal(Array(2).fill(""));
      setWinner("");
    },
    []
  );

  // R16 slot handler
  const handleR16Pick = useCallback((idx: number, team: string) => {
    setR16((prev) => {
      const next = [...prev];
      next[idx] = team;
      return next;
    });
    // Invalidate downstream
    setQf(Array(8).fill(""));
    setSf(Array(4).fill(""));
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  // QF slot handler
  const handleQfPick = useCallback((idx: number, team: string) => {
    setQf((prev) => {
      const next = [...prev];
      next[idx] = team;
      return next;
    });
    setSf(Array(4).fill(""));
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  // SF slot handler
  const handleSfPick = useCallback((idx: number, team: string) => {
    setSf((prev) => {
      const next = [...prev];
      next[idx] = team;
      return next;
    });
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  // Final slot handler
  const handleFinalPick = useCallback((idx: number, team: string) => {
    setFinal((prev) => {
      const next = [...prev];
      next[idx] = team;
      return next;
    });
    setWinner("");
  }, []);

  // R16 slots derived from group picks
  const r16Slots = buildR16Slots(groups);

  // QF slots derived from R16 picks (pairs of R16 winners)
  const qfSlots: { home: string; away: string }[] = Array.from({ length: 8 }, (_, i) => ({
    home: r16[i * 2]     ?? "",
    away: r16[i * 2 + 1] ?? "",
  }));

  // SF slots from QF picks
  const sfSlots: { home: string; away: string }[] = Array.from({ length: 4 }, (_, i) => ({
    home: qf[i * 2]     ?? "",
    away: qf[i * 2 + 1] ?? "",
  }));

  // Final slots from SF picks
  const finalSlots: { home: string; away: string }[] = [
    { home: sf[0] ?? "", away: sf[1] ?? "" },
    { home: sf[2] ?? "", away: sf[3] ?? "" },
  ];

  // Completion checks
  const groupsComplete = GROUP_LETTERS.every(
    (l) => groups[l]?.first && groups[l]?.second
  );
  const r16Placeholders = r16Slots.filter((s) => s.home.startsWith("Best 3rd") || s.away.startsWith("Best 3rd")).length;
  // User must pick all 16 R16 winners that have real teams
  const r16PickableCount = r16Slots.filter((s) => !s.home.startsWith("Best 3rd") && !s.away.startsWith("Best 3rd")).length;
  const r16Complete = r16.filter((t, i) => {
    const slot = r16Slots[i];
    return (
      t &&
      !slot?.home.startsWith("Best 3rd") &&
      !slot?.away.startsWith("Best 3rd")
    );
  }).length === r16PickableCount && r16PickableCount > 0;

  const qfComplete = qf.filter((t) => t).length === 8;
  const sfComplete = sf.filter((t) => t).length === 4;
  const finalComplete = final.filter((t) => t).length === 2;
  const winnerComplete = !!winner;
  const knockoutComplete = r16Complete && qfComplete && sfComplete && finalComplete && winnerComplete;
  const bracketComplete = groupsComplete && knockoutComplete;

  // Submit bracket
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    const bracket: BracketData = { groups, r16, qf, sf, final, winner };
    try {
      const res = await fetch("/api/games/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bracket }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setConfirmDialog(false);
    } catch {
      setSubmitError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-8 h-8 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── View submitted bracket ─────────────────────────────────────────────────
  if (submitted) {
    return <SubmittedView
      groups={groups}
      r16={r16}
      qf={qf}
      sf={sf}
      final={final}
      winner={winner}
      results={results}
      points={points}
      onBack={() => router.push("/games")}
    />;
  }

  // ── Editor ─────────────────────────────────────────────────────────────────
  const TABS: { id: TabId; label: string; done: boolean }[] = [
    { id: "groups",   label: "Groups",   done: groupsComplete },
    { id: "knockout", label: "Knockout", done: knockoutComplete },
    { id: "review",   label: "Submit",   done: false },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .bracket-scroll::-webkit-scrollbar { height: 4px; }
        .bracket-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius:2px; }
        .bracket-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius:2px; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-3 h-14"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.push("/games")} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <h1 className="text-white font-black text-sm tracking-wide">WC 2026 Bracket</h1>
        <div className="flex items-center gap-1.5">
          {bracketComplete && (
            <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20 uppercase tracking-wider">
              Ready
            </span>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="fixed top-14 w-full z-40 flex"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              tab === t.id
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-white/30 border-b-2 border-transparent hover:text-white/60"
            }`}
          >
            {t.done && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 pt-28 pb-8 px-4 max-w-3xl mx-auto w-full">

        {/* ── Groups Tab ──────────────────────────────────────────────────── */}
        {tab === "groups" && (
          <div className="fade-up">
            <div className="mb-5">
              <h2 className="text-white font-black text-lg mb-1">Group Stage Picks</h2>
              <p className="text-white/40 text-xs">
                For each group, tap the 1st-place finisher first, then tap a different team for 2nd place. Tap again to deselect.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GROUP_LETTERS.map((letter) => {
                const col = GROUP_COLORS[letter];
                const g = groups[letter] ?? { first: "", second: "" };
                const teams = WC2026_GROUPS[letter];
                return (
                  <div key={letter} className={`rounded-2xl border ${col.border} p-4`}
                    style={{ background: `${col.glow.replace("0.12", "0.04")}` }}>
                    {/* Group header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center gap-2`}>
                        <span className={`w-7 h-7 rounded-lg ${col.bg} border ${col.border} flex items-center justify-center text-xs font-black ${col.text}`}>
                          {letter}
                        </span>
                        <span className="text-white font-black text-sm">Group {letter}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {g.first && (
                          <span className="text-[9px] font-black text-yellow-400 uppercase">
                            1st: {g.first}
                          </span>
                        )}
                        {g.second && (
                          <span className="text-[9px] font-black text-white/40 uppercase">
                            2nd: {g.second}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="space-y-1.5">
                      {teams.map((team) => {
                        const slot = g.first === team ? "first" : g.second === team ? "second" : null;
                        return (
                          <TeamPill
                            key={team}
                            team={team}
                            slot={slot}
                            onClick={() => handleGroupPick(letter, team)}
                            disabled={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-6 rounded-xl border border-white/8 p-4 bg-white/2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/40">Groups completed</span>
                <span className="text-xs font-black text-white">
                  {GROUP_LETTERS.filter((l) => groups[l]?.first && groups[l]?.second).length} / {GROUP_LETTERS.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                  style={{
                    width: `${(GROUP_LETTERS.filter((l) => groups[l]?.first && groups[l]?.second).length / GROUP_LETTERS.length) * 100}%`,
                  }}
                />
              </div>
              {groupsComplete && (
                <button
                  onClick={() => setTab("knockout")}
                  className="mt-3 w-full py-2 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider hover:bg-yellow-400/25 transition-all"
                >
                  Continue to Knockout →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Knockout Tab ────────────────────────────────────────────────── */}
        {tab === "knockout" && (
          <div className="fade-up">
            <div className="mb-4">
              <h2 className="text-white font-black text-lg mb-1">Knockout Stage</h2>
              <p className="text-white/40 text-xs">
                Click a team in each match to advance them. Your group picks seed the bracket.
              </p>
            </div>

            {!groupsComplete && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-400 text-xs font-bold">Complete all group stage picks first.</p>
                <button onClick={() => setTab("groups")} className="ml-auto text-xs text-amber-400 underline font-bold">
                  Go →
                </button>
              </div>
            )}

            {/* Horizontally scrollable bracket */}
            <div className="overflow-x-auto bracket-scroll pb-4">
              <div className="flex gap-6 min-w-[680px]">

                {/* Round of 16 */}
                <div className="flex flex-col gap-3 shrink-0 w-[120px]">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center mb-1">R16</p>
                  {r16Slots.map((slot, i) => {
                    const isPlaceholder = slot.home.startsWith("Best 3rd") || slot.away.startsWith("Best 3rd");
                    return (
                      <MatchBox
                        key={i}
                        home={slot.home}
                        away={slot.away}
                        winner={r16[i] ?? ""}
                        onPickWinner={(team) => handleR16Pick(i, team)}
                        disabled={!groupsComplete || isPlaceholder}
                        result={getResultForMatchup(results, `R16_${i}`)}
                        label={`M${i + 1}`}
                      />
                    );
                  })}
                </div>

                {/* Quarter-finals */}
                <div className="flex flex-col gap-3 shrink-0 w-[120px]">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center mb-1">QF</p>
                  <div className="flex flex-col gap-3 mt-[0px]">
                    {qfSlots.map((slot, i) => (
                      <MatchBox
                        key={i}
                        home={slot.home}
                        away={slot.away}
                        winner={qf[i] ?? ""}
                        onPickWinner={(team) => handleQfPick(i, team)}
                        disabled={!r16[i * 2] || !r16[i * 2 + 1]}
                        result={getResultForMatchup(results, `QF_${i}`)}
                        label={`QF${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Semi-finals */}
                <div className="flex flex-col gap-3 shrink-0 w-[120px]">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center mb-1">SF</p>
                  <div className="flex flex-col gap-3 mt-[0px]">
                    {sfSlots.map((slot, i) => (
                      <MatchBox
                        key={i}
                        home={slot.home}
                        away={slot.away}
                        winner={sf[i] ?? ""}
                        onPickWinner={(team) => handleSfPick(i, team)}
                        disabled={!qf[i * 2] || !qf[i * 2 + 1]}
                        result={getResultForMatchup(results, `SF_${i}`)}
                        label={`SF${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Final */}
                <div className="flex flex-col gap-3 shrink-0 w-[120px]">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center mb-1">FINAL</p>
                  <div className="flex flex-col gap-3 mt-[0px]">
                    {finalSlots.map((slot, i) => (
                      <MatchBox
                        key={i}
                        home={slot.home}
                        away={slot.away}
                        winner={final[i] ?? ""}
                        onPickWinner={(team) => handleFinalPick(i, team)}
                        disabled={!sf[i * 2] || !sf[i * 2 + 1]}
                        result={getResultForMatchup(results, `FINAL_${i}`)}
                        label={`F${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Champion */}
                <div className="flex flex-col gap-3 shrink-0 w-[120px]">
                  <p className="text-[9px] font-black text-yellow-400/70 uppercase tracking-widest text-center mb-1">CHAMPION</p>
                  <div className="rounded-lg border border-yellow-400/30 overflow-hidden bg-yellow-400/5 min-w-[110px]">
                    <div className="px-2 py-0.5 bg-yellow-400/10 text-[8px] font-black text-yellow-400/60 uppercase tracking-widest">
                      Winner
                    </div>
                    {[final[0], final[1]].filter(Boolean).map((team, i) => (
                      <button
                        key={i}
                        disabled={!final[0] || !final[1]}
                        onClick={() => setWinner(team)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all ${
                          winner === team
                            ? "bg-yellow-400/25 text-yellow-300"
                            : "text-white/50 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{team}</span>
                        {winner === team && <Trophy className="w-3 h-3 shrink-0 text-yellow-400" />}
                      </button>
                    ))}
                    {(!final[0] || !final[1]) && (
                      <div className="px-3 py-2 text-[10px] text-white/20 font-bold">Pending…</div>
                    )}
                  </div>
                  {/* Result for winner */}
                  {(() => {
                    const r = getResultForMatchup(results, "FINAL_WINNER");
                    if (!r || !winner) return null;
                    return (
                      <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${r.winner === winner ? "text-green-400" : "text-red-400"}`}>
                        <StatusIcon status={r.winner === winner ? "correct" : "wrong"} />
                        {r.winner === winner ? "Correct!" : `Was: ${r.winner}`}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {knockoutComplete && (
              <button
                onClick={() => setTab("review")}
                className="mt-4 w-full py-2.5 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider hover:bg-yellow-400/25 transition-all"
              >
                Review & Submit →
              </button>
            )}
          </div>
        )}

        {/* ── Review Tab ──────────────────────────────────────────────────── */}
        {tab === "review" && (
          <div className="fade-up">
            <div className="mb-5">
              <h2 className="text-white font-black text-lg mb-1">Review & Lock In</h2>
              <p className="text-white/40 text-xs">
                Once submitted your bracket is permanent — you cannot edit it.
              </p>
            </div>

            {/* Groups summary */}
            <section className="mb-5 rounded-xl border border-white/8 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-xs font-black text-white/50 uppercase tracking-wider mb-3">Group Stage</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GROUP_LETTERS.map((letter) => {
                  const g = groups[letter] ?? { first: "", second: "" };
                  const col = GROUP_COLORS[letter];
                  return (
                    <div key={letter} className={`rounded-lg border ${col.border} p-2`}
                      style={{ background: col.glow.replace("0.12", "0.04") }}>
                      <p className={`text-[9px] font-black ${col.text} uppercase tracking-wider mb-1`}>Group {letter}</p>
                      <p className="text-[11px] font-bold text-yellow-300 truncate">🥇 {g.first || "—"}</p>
                      <p className="text-[11px] font-bold text-white/50 truncate">🥈 {g.second || "—"}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Knockout summary */}
            <section className="mb-5 rounded-xl border border-white/8 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-xs font-black text-white/50 uppercase tracking-wider mb-3">Knockout Stage</h3>
              {[
                { label: "Round of 16",  teams: r16,   color: "text-sky-400"    },
                { label: "Quarter-Finals", teams: qf,  color: "text-blue-400"   },
                { label: "Semi-Finals",  teams: sf,    color: "text-violet-400" },
                { label: "Finalists",    teams: final, color: "text-amber-400"  },
              ].map(({ label, teams, color }) => (
                <div key={label} className="mb-3">
                  <p className={`text-[9px] font-black ${color} uppercase tracking-wider mb-1.5`}>{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teams.filter(Boolean).map((t, i) => (
                      <span key={i} className="text-[11px] font-bold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                    {teams.filter(Boolean).length === 0 && (
                      <span className="text-[11px] text-white/25 italic">Not yet picked</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-[9px] font-black text-yellow-400 uppercase tracking-wider mb-1">Champion</p>
                {winner
                  ? <span className="text-sm font-black text-yellow-400">🏆 {winner}</span>
                  : <span className="text-sm text-white/25 italic">Not yet picked</span>
                }
              </div>
            </section>

            {/* Completion check */}
            {!bracketComplete && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-amber-400 text-sm font-black">Bracket incomplete</p>
                </div>
                <ul className="space-y-1">
                  {!groupsComplete && (
                    <li className="text-amber-400/80 text-xs">
                      • Fill in all 12 group stage picks
                      <button onClick={() => setTab("groups")} className="ml-2 text-amber-400 underline">Fix →</button>
                    </li>
                  )}
                  {!knockoutComplete && groupsComplete && (
                    <li className="text-amber-400/80 text-xs">
                      • Complete knockout bracket picks
                      <button onClick={() => setTab("knockout")} className="ml-2 text-amber-400 underline">Fix →</button>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-red-400/25 bg-red-400/5 p-3 mb-4">
                <p className="text-red-400 text-sm font-bold">{submitError}</p>
              </div>
            )}

            <button
              disabled={!bracketComplete || submitting}
              onClick={() => setConfirmDialog(true)}
              className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                ${bracketComplete
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.35)]"
                  : "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
                }`}
            >
              <Lock className="w-5 h-5" />
              Lock In Bracket
            </button>
            <p className="text-center text-[10px] text-white/25 mt-2">This action is irreversible.</p>
          </div>
        )}
      </main>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl border border-yellow-400/25 p-6 fade-up"
            style={{ background: "#13131a" }}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-white font-black text-lg mb-1">Lock In Your Bracket?</h3>
              <p className="text-white/40 text-sm">
                Your predictions will be saved permanently. You <strong className="text-white">cannot edit</strong> your bracket after this.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 font-bold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Submitted view (read-only) ────────────────────────────────────────────────
function SubmittedView({
  groups,
  r16,
  qf,
  sf,
  final,
  winner,
  results,
  points,
  onBack,
}: {
  groups: BracketData["groups"];
  r16: string[];
  qf: string[];
  sf: string[];
  final: string[];
  winner: string;
  results: BracketResult[];
  points: number;
  onBack: () => void;
}) {
  const winnerResult = results.find((r) => r.matchup === "FINAL_WINNER");

  return (
    <div className="min-h-screen pb-16" style={{ background: "#0a0a0f" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .bracket-scroll::-webkit-scrollbar { height: 4px; }
        .bracket-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius:2px; }
        .bracket-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius:2px; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 h-14"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-sm">Your Bracket</h1>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-400 font-black text-xs">{points} pts</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 fade-up">

        {/* Lock badge */}
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl border border-white/8 bg-white/2">
          <Lock className="w-4 h-4 text-white/30" />
          <p className="text-white/40 text-xs">Your bracket is locked. Results update automatically as the tournament progresses.</p>
        </div>

        {/* Live Scoring Progress */}
        {(() => {
          // Build all picks as {team, matchupKey} pairs
          const allPicks: { team: string; key: string }[] = [];
          GROUP_LETTERS.forEach((l) => {
            const g = groups[l] ?? { first: "", second: "" };
            if (g.first)  allPicks.push({ team: g.first,  key: `${l}1` });
            if (g.second) allPicks.push({ team: g.second, key: `${l}2` });
          });
          r16.forEach((t, i)   => t && allPicks.push({ team: t, key: `R16_${i}` }));
          qf.forEach((t, i)    => t && allPicks.push({ team: t, key: `QF_${i}` }));
          sf.forEach((t, i)    => t && allPicks.push({ team: t, key: `SF_${i}` }));
          final.forEach((t, i) => t && allPicks.push({ team: t, key: `FINAL_${i}` }));
          if (winner) allPicks.push({ team: winner, key: "FINAL_WINNER" });

          let correct = 0, wrong = 0, pending = 0;
          allPicks.forEach(({ team, key }) => {
            const r = results.find((res) => res.matchup === key);
            if (!r) pending++;
            else if (r.winner === team) correct++;
            else wrong++;
          });
          const total = allPicks.length;
          const resolved = correct + wrong;
          const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

          return (
            <div className="mb-5 rounded-2xl border border-yellow-400/15 p-4" style={{ background: "rgba(250,204,21,0.03)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-yellow-400/60 uppercase tracking-widest">Live Score Progress</p>
                <span className="text-lg font-black text-yellow-400">{correct}<span className="text-white/20 text-xs font-bold"> / {total}</span></span>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-3 flex">
                <div className="h-full bg-green-400 rounded-l-full transition-all duration-700" style={{ width: `${(correct / total) * 100}%` }} />
                <div className="h-full bg-red-400/60 transition-all duration-700" style={{ width: `${(wrong / total) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-black text-green-400">{correct}</p>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Correct</p>
                </div>
                <div>
                  <p className="text-lg font-black text-red-400">{wrong}</p>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Wrong</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white/40">{pending}</p>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Pending</p>
                </div>
              </div>
              {resolved > 0 && (
                <p className="text-[10px] text-center mt-2 font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {pct}% accuracy on {resolved} resolved picks
                </p>
              )}
            </div>
          );
        })()}

        {/* Champion */}
        <div className="mb-6 rounded-2xl border border-yellow-400/30 p-5 text-center"
          style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.06), rgba(251,146,60,0.04))" }}>
          <p className="text-[10px] font-black text-yellow-400/60 uppercase tracking-widest mb-1">Your Champion Pick</p>
          <p className="text-2xl font-black text-yellow-400 mb-2">🏆 {winner || "—"}</p>
          {winnerResult && (
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
              winnerResult.winner === winner
                ? "bg-green-400/15 text-green-400 border border-green-400/25"
                : "bg-red-400/15 text-red-400 border border-red-400/25"
            }`}>
              <StatusIcon status={winnerResult.winner === winner ? "correct" : "wrong"} />
              {winnerResult.winner === winner ? "Correct! 🎉" : `Actual: ${winnerResult.winner}`}
            </div>
          )}
          {!winnerResult && (
            <span className="text-[10px] text-white/25 italic">Result pending</span>
          )}
        </div>

        {/* Groups summary */}
        <section className="mb-6">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-wider mb-3">Group Stage Picks</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GROUP_LETTERS.map((letter) => {
              const g = groups[letter] ?? { first: "", second: "" };
              const col = GROUP_COLORS[letter];
              const firstResult = results.find((r) => r.matchup === `${letter}1`);
              const secondResult = results.find((r) => r.matchup === `${letter}2`);
              return (
                <div key={letter} className={`rounded-xl border ${col.border} p-3`}
                  style={{ background: col.glow.replace("0.12", "0.04") }}>
                  <p className={`text-[9px] font-black ${col.text} uppercase tracking-wider mb-2`}>Group {letter}</p>
                  <div className="space-y-1">
                    {[
                      { team: g.first, label: "1st", result: firstResult },
                      { team: g.second, label: "2nd", result: secondResult },
                    ].map(({ team, label, result: res }) => {
                      const status = res ? (res.winner === team ? "correct" : "wrong") : "pending";
                      return (
                        <div key={label} className={`flex items-center gap-1.5 text-[11px] font-bold rounded-md px-2 py-1 ${
                          status === "correct" ? "bg-green-400/10 text-green-400" :
                          status === "wrong"   ? "bg-red-400/10 text-red-400/70 line-through" :
                          "text-white/60"
                        }`}>
                          <StatusIcon status={status} />
                          <span className="text-[9px] text-white/30 shrink-0">{label}</span>
                          <span className="truncate">{team || "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Knockout read-only bracket */}
        <section className="mb-6">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-wider mb-3">Knockout Picks</h3>
          <div className="overflow-x-auto bracket-scroll pb-4">
            <div className="flex gap-6 min-w-[680px]">
              {[
                { label: "R16",     teams: r16,   prefix: "R16",   color: "text-sky-400"    },
                { label: "QF",      teams: qf,    prefix: "QF",    color: "text-blue-400"   },
                { label: "SF",      teams: sf,    prefix: "SF",    color: "text-violet-400" },
                { label: "FINAL",   teams: final, prefix: "FINAL", color: "text-amber-400"  },
              ].map(({ label, teams, prefix, color }) => (
                <div key={label} className="flex flex-col gap-2 shrink-0 w-[120px]">
                  <p className={`text-[9px] font-black ${color} uppercase tracking-widest text-center mb-1`}>{label}</p>
                  {teams.map((team, i) => {
                    const res = results.find((r) => r.matchup === `${prefix}_${i}`);
                    const status: "correct" | "wrong" | "pending" =
                      !team ? "pending" :
                      !res  ? "pending" :
                      res.winner === team ? "correct" : "wrong";
                    return (
                      <div key={i} className={`rounded-lg border px-3 py-2 text-xs font-bold flex items-center justify-between gap-1 ${
                        status === "correct" ? "border-green-400/30 bg-green-400/8 text-green-400" :
                        status === "wrong"   ? "border-red-400/20 bg-red-400/5 text-red-400/60 line-through" :
                        "border-white/10 bg-white/2 text-white/50"
                      }`}>
                        <span className="truncate">{team || "TBD"}</span>
                        <StatusIcon status={status} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
