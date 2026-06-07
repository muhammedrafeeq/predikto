"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trophy, Lock, CheckCircle, XCircle, Clock, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";

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

function buildR16Slots(groups: BracketData["groups"]): { home: string; away: string }[] {
  const get = (letter: string, slot: "first" | "second") => groups[letter]?.[slot] ?? "";
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
    { home: "Best 3rd (Group A-D)", away: "Best 3rd (Group E-H)"  },
    { home: "Best 3rd (Group I-L)", away: "Best 3rd (Group A-D)"  },
    { home: "Best 3rd (Group E-H)", away: "Best 3rd (Group I-L)"  },
    { home: "Best 3rd (Group A-L)", away: "Best 3rd (Group A-L)"  },
  ];
}

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
        w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 border
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
        {slot === "first" && <span className="text-[8px] font-black text-yellow-400 uppercase tracking-wider shrink-0">1ST</span>}
        {slot === "second" && <span className="text-[8px] font-black text-white/60 uppercase tracking-wider shrink-0">2ND</span>}
      </div>
    </button>
  );
}

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
    const correctness = result ? (result.winner === team ? "correct" : isWinner ? "wrong" : "none") : "none";

    return (
      <button
        disabled={disabled || ph || !home || !away}
        onClick={() => !ph && onPickWinner(team)}
        className={`
          w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold transition-all duration-150
          ${isWinner && !ph ? "bg-yellow-400/20 text-yellow-300" : "text-white/50 hover:bg-white/5 hover:text-white"}
          ${ph ? "opacity-40 cursor-default" : "cursor-pointer"}
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
      <div className="px-2 py-0.5 bg-white/5 text-[7px] font-black text-white/30 uppercase tracking-widest">{label}</div>
      <TeamRow team={home} isWinner={winner === home} />
      <div className="h-px bg-white/8" />
      <TeamRow team={away} isWinner={winner === away} />
    </div>
  );
}

export default function BracketContestView({ contestId }: { contestId: number }) {
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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/contests/${contestId}/matches`);
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contestId]);

  const handleGroupPick = useCallback((letter: string, team: string) => {
    setGroups((prev) => {
      const g = prev[letter] ?? { first: "", second: "" };
      if (g.first === team) return { ...prev, [letter]: { first: "", second: g.second } };
      if (g.second === team) return { ...prev, [letter]: { first: g.first, second: "" } };
      if (!g.first) return { ...prev, [letter]: { first: team, second: g.second } };
      if (!g.second) return { ...prev, [letter]: { first: g.first, second: team } };
      return { ...prev, [letter]: { first: g.first, second: team } };
    });
    setR16(Array(16).fill(""));
    setQf(Array(8).fill(""));
    setSf(Array(4).fill(""));
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  const handleR16Pick = useCallback((idx: number, team: string) => {
    setR16((prev) => { const next = [...prev]; next[idx] = team; return next; });
    setQf(Array(8).fill(""));
    setSf(Array(4).fill(""));
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  const handleQfPick = useCallback((idx: number, team: string) => {
    setQf((prev) => { const next = [...prev]; next[idx] = team; return next; });
    setSf(Array(4).fill(""));
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  const handleSfPick = useCallback((idx: number, team: string) => {
    setSf((prev) => { const next = [...prev]; next[idx] = team; return next; });
    setFinal(Array(2).fill(""));
    setWinner("");
  }, []);

  const handleFinalPick = useCallback((idx: number, team: string) => {
    setFinal((prev) => { const next = [...prev]; next[idx] = team; return next; });
    setWinner("");
  }, []);

  const r16Slots = buildR16Slots(groups);
  const qfSlots = Array.from({ length: 8 }, (_, i) => ({ home: r16[i * 2] ?? "", away: r16[i * 2 + 1] ?? "" }));
  const sfSlots = Array.from({ length: 4 }, (_, i) => ({ home: qf[i * 2] ?? "", away: qf[i * 2 + 1] ?? "" }));
  const finalSlots = [{ home: sf[0] ?? "", away: sf[1] ?? "" }, { home: sf[2] ?? "", away: sf[3] ?? "" }];

  const groupsComplete = GROUP_LETTERS.every((l) => groups[l]?.first && groups[l]?.second);
  const r16PickableCount = r16Slots.filter((s) => !s.home.startsWith("Best 3rd") && !s.away.startsWith("Best 3rd")).length;
  const r16Complete = r16.filter((t, i) => t && !r16Slots[i]?.home.startsWith("Best 3rd") && !r16Slots[i]?.away.startsWith("Best 3rd")).length === r16PickableCount && r16PickableCount > 0;
  const qfComplete = qf.filter((t) => t).length === 8;
  const sfComplete = sf.filter((t) => t).length === 4;
  const finalComplete = final.filter((t) => t).length === 2;
  const winnerComplete = !!winner;
  const bracketComplete = groupsComplete && r16Complete && qfComplete && sfComplete && finalComplete && winnerComplete;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    const bracket: BracketData = { groups, r16, qf, sf, final, winner };
    try {
      const res = await fetch(`/api/contests/${contestId}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bracket }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed");
      } else {
        setSubmitted(true);
        setConfirmDialog(false);
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-6 mt-2 surface-glass-1 border border-white/5 p-5 rounded-2xl">
        <div className="text-center py-3">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
          <h3 className="text-lg font-black text-white">Bracket Locked In!</h3>
          <p className="text-xs text-white/40 mt-1">Your bracket is locked. Total Points Earned: <span className="text-yellow-400 font-bold">{points} pts</span></p>
        </div>

        {/* Short Summary */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-xs space-y-2">
          <p className="font-bold text-white/60 uppercase">Your Predictions Summary</p>
          <div className="flex justify-between">
            <span className="text-white/40">Champion Choice:</span>
            <span className="text-yellow-300 font-black">{winner}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Finalists:</span>
            <span className="text-white font-bold">{final.join(" vs ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">SF Qualifiers:</span>
            <span className="text-white/80">{sf.join(", ")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-2">
      <style>{`
        .bracket-scroll::-webkit-scrollbar { height: 4px; }
        .bracket-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .bracket-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Editor Inner Tabs */}
      <div className="flex bg-white/5 border border-white/8 rounded-xl overflow-hidden">
        {[
          { id: "groups", label: "1. Groups", done: groupsComplete },
          { id: "knockout", label: "2. Knockout", done: winnerComplete },
          { id: "review", label: "3. Review", done: false }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
              tab === t.id ? "bg-white/10 text-yellow-400" : "text-white/40 hover:text-white/60"
            }`}
          >
            {t.label} {t.done && "✓"}
          </button>
        ))}
      </div>

      {/* Groups Stage Editor */}
      {tab === "groups" && (
        <div className="space-y-4">
          <div className="p-3 bg-white/5 border border-white/8 rounded-xl text-[11px] text-white/50 leading-relaxed">
            <span className="text-yellow-400 font-bold uppercase">Instructions: </span>
            Select the 1st-place team first (yellow badge), then the 2nd-place team (white badge) for each group below.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GROUP_LETTERS.map((letter) => {
              const col = GROUP_COLORS[letter];
              const g = groups[letter] ?? { first: "", second: "" };
              return (
                <div key={letter} className={`rounded-xl border ${col.border} p-3`} style={{ background: col.glow.replace("0.12", "0.03") }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-black ${col.text}`}>Group {letter}</span>
                    <span className="text-[9px] font-bold text-white/40">
                      {g.first ? `1st: ${g.first}` : ""} {g.second ? `· 2nd: ${g.second}` : ""}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {WC2026_GROUPS[letter].map((team) => {
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
        </div>
      )}

      {/* Knockout Bracket Editor */}
      {tab === "knockout" && (
        <div className="space-y-4">
          {!groupsComplete && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-400 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Please complete Group stage picks first.
            </div>
          )}

          <div className="overflow-x-auto bracket-scroll pb-3">
            <div className="flex gap-4 min-w-[650px] py-1">
              {/* R16 Matchboxes */}
              <div className="flex flex-col gap-2 shrink-0 w-[115px]">
                <p className="text-[8px] font-black text-white/30 uppercase text-center tracking-wider">Round of 16</p>
                {r16Slots.map((slot, i) => (
                  <MatchBox
                    key={i}
                    home={slot.home}
                    away={slot.away}
                    winner={r16[i] ?? ""}
                    onPickWinner={(team) => handleR16Pick(i, team)}
                    disabled={!groupsComplete || slot.home.startsWith("Best 3rd") || slot.away.startsWith("Best 3rd")}
                    label={`M${i + 1}`}
                  />
                ))}
              </div>

              {/* QF */}
              <div className="flex flex-col gap-3 shrink-0 w-[115px] justify-around">
                <p className="text-[8px] font-black text-white/30 uppercase text-center tracking-wider">Quarter-finals</p>
                {qfSlots.map((slot, i) => (
                  <MatchBox
                    key={i}
                    home={slot.home}
                    away={slot.away}
                    winner={qf[i] ?? ""}
                    onPickWinner={(team) => handleQfPick(i, team)}
                    disabled={!r16[i * 2] || !r16[i * 2 + 1]}
                    label={`QF${i + 1}`}
                  />
                ))}
              </div>

              {/* SF */}
              <div className="flex flex-col gap-4 shrink-0 w-[115px] justify-around">
                <p className="text-[8px] font-black text-white/30 uppercase text-center tracking-wider">Semi-finals</p>
                {sfSlots.map((slot, i) => (
                  <MatchBox
                    key={i}
                    home={slot.home}
                    away={slot.away}
                    winner={sf[i] ?? ""}
                    onPickWinner={(team) => handleSfPick(i, team)}
                    disabled={!qf[i * 2] || !qf[i * 2 + 1]}
                    label={`SF${i + 1}`}
                  />
                ))}
              </div>

              {/* Final */}
              <div className="flex flex-col gap-4 shrink-0 w-[115px] justify-around">
                <p className="text-[8px] font-black text-white/30 uppercase text-center tracking-wider">Final</p>
                {finalSlots.map((slot, i) => (
                  <MatchBox
                    key={i}
                    home={slot.home}
                    away={slot.away}
                    winner={final[i] ?? ""}
                    onPickWinner={(team) => handleFinalPick(i, team)}
                    disabled={!sf[i * 2] || !sf[i * 2 + 1]}
                    label={`F${i + 1}`}
                  />
                ))}
              </div>

              {/* Winner */}
              <div className="flex flex-col gap-3 shrink-0 w-[115px] justify-center">
                <p className="text-[8px] font-black text-yellow-400/80 uppercase text-center tracking-wider">Champion</p>
                <div className="rounded-lg border border-yellow-400/30 overflow-hidden bg-yellow-400/5 min-w-[110px]">
                  <div className="px-2 py-0.5 bg-yellow-400/10 text-[7px] font-black text-yellow-400/60 uppercase tracking-widest">Winner</div>
                  {[final[0], final[1]].filter(Boolean).map((team, i) => (
                    <button
                      key={i}
                      onClick={() => setWinner(team)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        winner === team ? "bg-yellow-400/25 text-yellow-300" : "text-white/50 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{team}</span>
                    </button>
                  ))}
                  {(!final[0] || !final[1]) && <div className="px-3 py-2 text-[10px] text-white/20 font-bold">TBD...</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Submit Tab */}
      {tab === "review" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">Review Predictions</h3>
            <p className="text-xs text-white/40">Once locked in, your bracket predictions are final and cannot be modified.</p>
          </div>

          <div className="surface-glass-1 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-white/40">Groups Complete:</span>
              <span className={groupsComplete ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{groupsComplete ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-white/40">Knockout Complete:</span>
              <span className={bracketComplete ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{bracketComplete ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Predicted Champion:</span>
              <span className="text-yellow-400 font-black">{winner || "None chosen"}</span>
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-400 font-semibold">
              {submitError}
            </div>
          )}

          <button
            onClick={() => setConfirmDialog(true)}
            disabled={!bracketComplete || submitting}
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/10"
          >
            Lock In Bracket Predictions
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm surface-glass-2 rounded-2xl border border-white/10 p-5 space-y-4">
            <h4 className="text-base font-black text-white">Lock in Predictions?</h4>
            <p className="text-xs text-white/50 leading-relaxed">
              This action is permanent. You will not be able to edit or resubmit your bracket selections once locked in.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/8 hover:bg-white/5 text-white text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-black bg-yellow-400 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
