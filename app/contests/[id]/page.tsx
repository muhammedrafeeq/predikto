"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Trophy, Users, Calendar, LayoutGrid, ArrowLeft, 
  Copy, Check, Shield, ShieldAlert, Sparkles, UserPlus,
  Crown, Star, Award
} from "lucide-react";
import MatchPredictionContestView from "@/components/MatchPredictionContestView";
import FirstGoalContestView from "@/components/FirstGoalContestView";
import FormationContestView from "@/components/FormationContestView";
import BracketContestView from "@/components/BracketContestView";

type GameType = "match_prediction" | "first_goal" | "formation" | "bracket";

interface ContestMetadata {
  id: number;
  name: string;
  gameType: GameType;
  gameTypes: GameType[];
  joinCode: string;
  createdAt: string;
  creatorId: number | null;
  tournamentName: string;
  tournamentId: number;
}

interface ContestMember {
  id: number;
  name: string;
  role: string;
  joinedAt: string;
}

interface RankMember {
  id: number;
  name: string;
  points: number;
}

type TabType = "play" | "standings" | "members";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("play");
  
  const [contest, setContest] = useState<ContestMetadata | null>(null);
  const [members, setMembers] = useState<ContestMember[]>([]);
  const [rankings, setRankings] = useState<RankMember[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [multiplier, setMultiplier] = useState(0);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  useEffect(() => {
    if (isNaN(contestId)) return;

    async function loadContestDetails() {
      try {
        const res = await fetch(`/api/contests/${contestId}`);
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          else router.push("/");
          return;
        }

        const data = await res.json();
        if (data.success) {
          setContest(data.contest);
          setMembers(data.members);
        }
      } catch (err) {
        console.error("Failed to load contest", err);
      } finally {
        setLoading(false);
      }
    }
    loadContestDetails();
  }, [contestId, router]);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const d = await res.json();
          if (d.user) setCurrentUser(d.user);
        }
      } catch {}
    }
    loadUser();
  }, []);

  // Load standings when Standings tab is selected
  useEffect(() => {
    if (activeTab !== "standings" || isNaN(contestId)) return;

    async function loadStandings() {
      setRankingsLoading(true);
      try {
        const res = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRankings(data.rankings);
          }
        }
      } catch (err) {
        console.error("Failed to load standings", err);
      } finally {
        setRankingsLoading(false);
      }
    }
    loadStandings();
  }, [activeTab, contestId]);

  useEffect(() => {
    if (activeTab !== "standings" || rankingsLoading || rankings.length === 0) return;
    setMultiplier(0);
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setMultiplier(p);
      if (p < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 200);
    return () => clearTimeout(t);
  }, [activeTab, rankingsLoading, rankings]);

  const handleCopyCode = () => {
    if (!contest) return;
    navigator.clipboard.writeText(contest.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to remove this member from the contest?")) return;
    setRemovingMemberId(memberId);
    try {
      const res = await fetch(`/api/contests/${contestId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        alert(data.error ?? "Failed to remove member");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Contest Room…</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <p className="text-sm">Contest not found</p>
        <button onClick={() => router.push("/")} className="text-primary text-xs underline font-bold">Go back</button>
      </div>
    );
  }

  const GAME_META: Record<GameType, { label: string; icon: string; desc: string; color: string }> = {
    match_prediction: { label: "Match Predictor", icon: "⚽", desc: "Predict winners, scores & MOM", color: "from-blue-900/60 to-blue-800/20 border-blue-500/30" },
    first_goal:       { label: "First Goal Timer", icon: "⏱️", desc: "Guess the first goal minute",    color: "from-amber-900/60 to-amber-800/20 border-amber-500/30" },
    formation:        { label: "Formation Predictor", icon: "🧩", desc: "Pick the starting lineup",    color: "from-emerald-900/60 to-emerald-800/20 border-emerald-500/30" },
    bracket:          { label: "Tournament Bracket", icon: "🏆", desc: "Build your bracket picks",     color: "from-purple-900/60 to-purple-800/20 border-purple-500/30" },
  };

  const activeGameTypes: GameType[] = (contest.gameTypes && contest.gameTypes.length > 0)
    ? contest.gameTypes
    : [contest.gameType];

  const isMultiGame = activeGameTypes.length > 1;

  const gameModeLabel = isMultiGame
    ? activeGameTypes.map((t) => GAME_META[t].label).join(" · ")
    : GAME_META[contest.gameType]?.label ?? "Contest";

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 bg-pitch overflow-x-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .podium-rise { animation: riseUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; transform:translateY(50px); }
        @keyframes riseUp { to { opacity:1; transform:translateY(0); } }
        .float-a { animation: floatA 4s ease-in-out infinite; }
        .float-b { animation: floatA 4s ease-in-out infinite; animation-delay:1.5s; }
        .float-c { animation: floatA 4s ease-in-out infinite; animation-delay:0.8s; }
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .sparkle-anim { animation: sparkleA 2.5s ease-in-out infinite; }
        @keyframes sparkleA { 0%,100%{opacity:0.4;transform:scale(0.9)} 50%{opacity:1;transform:scale(1.15);filter:drop-shadow(0 0 10px rgba(245,158,11,0.6))} }
        .stagger-row { opacity:0; transform:translateY(12px); animation: rowIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes rowIn { to { opacity:1; transform:translateY(0); } }
        .shimmer-e::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent); animation:shim 2.5s infinite; }
        @keyframes shim { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>

      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-sm tracking-wide uppercase truncate max-w-[50%]">
          {contest.name}
        </h1>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/8 text-white transition-colors"
          title="Share join code"
        >
          <span className="tracking-wide">{contest.joinCode}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-secondary" /> : <UserPlus className="w-3.5 h-3.5 text-white/40" />}
        </button>
      </header>

      {/* Main Content viewport */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-20">

        {/* Contest Header Block */}
        <section className="py-4 text-left fade-up">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">
              {gameModeLabel}
            </span>
            <span className="text-[10px] text-white/35 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {contest.tournamentName}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{contest.name}</h2>
          <p className="text-white/40 text-xs mt-1">Share the code <span className="font-mono text-yellow-400 font-bold">{contest.joinCode}</span> to invite other members to this contest.</p>
        </section>

        {/* Navigation Tabs */}
        <section className="mb-6 fade-up">
          <div className="flex border-b border-white/5 text-center">
            {[
              { id: "play", label: "Play Game", count: null },
              { id: "standings", label: "Standings", count: null },
              { id: "members", label: "Members", count: members.length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                    isActive ? "text-primary border-primary" : "text-white/30 border-transparent hover:text-white/50"
                  }`}
                >
                  {tab.label} {tab.count !== null && `(${tab.count})`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab View Contents */}
        <section className="fade-up" style={{ animationDelay: "0.08s" }}>
          
          {/* PLAY TAB VIEW */}
          {activeTab === "play" && (
            <div>
              {/* Single match_prediction — keep original layout */}
              {!isMultiGame && contest.gameType === "match_prediction" && (
                <MatchPredictionContestView contestId={contestId} onNavigate={(path) => router.push(path)} />
              )}
              {!isMultiGame && contest.gameType === "first_goal" && (
                <FirstGoalContestView contestId={contestId} />
              )}
              {!isMultiGame && contest.gameType === "formation" && (
                <FormationContestView contestId={contestId} />
              )}
              {!isMultiGame && contest.gameType === "bracket" && (
                <BracketContestView contestId={contestId} />
              )}

              {/* Multi-game: show grid or selected game */}
              {isMultiGame && !selectedGame && (
                <div className="px-1 pt-2">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-4 px-1">Choose a Game</p>
                  <div className="grid grid-cols-2 gap-3">
                    {activeGameTypes.map((type) => {
                      const meta = GAME_META[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedGame(type)}
                          className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-gradient-to-b ${meta.color} transition-all active:scale-95 hover:brightness-110`}
                        >
                          <span className="text-4xl">{meta.icon}</span>
                          <div className="text-center">
                            <p className="text-white font-black text-sm leading-tight">{meta.label}</p>
                            <p className="text-white/40 text-[10px] mt-0.5 leading-tight">{meta.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isMultiGame && selectedGame && (
                <div>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-bold mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Games
                  </button>
                  {selectedGame === "match_prediction" && (
                    <MatchPredictionContestView contestId={contestId} onNavigate={(path) => router.push(path)} />
                  )}
                  {selectedGame === "first_goal" && <FirstGoalContestView contestId={contestId} />}
                  {selectedGame === "formation" && <FormationContestView contestId={contestId} />}
                  {selectedGame === "bracket" && <BracketContestView contestId={contestId} />}
                </div>
              )}
            </div>
          )}

          {/* STANDINGS TAB VIEW */}
          {activeTab === "standings" && (
            <div>
              {rankingsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : rankings.length === 0 ? (
                <div className="text-center py-16 text-white/30 surface-glass-1 border border-white/5 rounded-2xl">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-white" />
                  <p className="text-sm font-semibold">No predictions graded yet.</p>
                  <p className="text-xs mt-1 text-white/20">Standings will populate once matches are graded by the Admin.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Standings Podium for Top 3 */}
                  <div className="flex items-end justify-center gap-3 mb-10 h-[240px] select-none px-2 pt-6">
                    {/* Rank 2 (Silver) */}
                    {rankings[1] && (
                      <div className="podium-rise flex flex-col items-center w-1/3" style={{ animationDelay: "0.2s" }}>
                        <div className="relative mb-3 flex flex-col items-center float-b">
                          <Star className="w-5 h-5 text-slate-400 mb-1" />
                          <div className="w-14 h-14 rounded-full border-2 border-slate-400 flex items-center justify-center font-black text-lg bg-slate-900 text-slate-300 relative"
                            style={{ boxShadow: "0 0 15px rgba(148,163,184,0.15)" }}>
                            {getInitials(rankings[1].name)}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-400 border border-slate-900 flex items-center justify-center text-slate-950 font-black text-[10px]">2</div>
                          </div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-slate-950/80 to-slate-800/40 border-t border-x border-slate-500/20 rounded-t-xl h-[80px] flex flex-col items-center justify-center relative shimmer-e overflow-hidden"
                          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                          <span className="text-white font-bold text-xs truncate w-11/12 text-center">{rankings[1].name}</span>
                          <span className="text-lg font-black text-white font-mono mt-1">{Math.floor(multiplier * rankings[1].points)}</span>
                        </div>
                      </div>
                    )}

                    {/* Rank 1 (Gold) */}
                    {rankings[0] && (
                      <div className="podium-rise flex flex-col items-center w-1/3 z-10" style={{ animationDelay: "0.1s" }}>
                        <div className="relative mb-3 flex flex-col items-center float-a">
                          <Crown className="w-6 h-6 text-amber-400 mb-1 sparkle-anim" />
                          <div className="w-16 h-16 rounded-full border-[3px] border-amber-400 flex items-center justify-center font-black text-xl bg-amber-950/50 text-amber-300 relative"
                            style={{ boxShadow: "0 0 25px rgba(245,158,11,0.3)" }}>
                            {getInitials(rankings[0].name)}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border border-amber-950 flex items-center justify-center text-amber-950 font-black text-[11px] shimmer-e overflow-hidden">1</div>
                          </div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-amber-950/80 to-amber-800/40 border-t-2 border-x border-amber-500/40 rounded-t-xl h-[110px] flex flex-col items-center justify-center relative shimmer-e overflow-hidden"
                          style={{ boxShadow: "0 4px 30px rgba(245,158,11,0.15)" }}>
                          <span className="text-white font-black text-sm truncate w-11/12 text-center">{rankings[0].name}</span>
                          <span className="text-2xl font-black text-amber-400 font-mono mt-1" style={{ textShadow: "0 0 15px rgba(245,158,11,0.4)" }}>
                            {Math.floor(multiplier * rankings[0].points)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rank 3 (Bronze) */}
                    {rankings[2] && (
                      <div className="podium-rise flex flex-col items-center w-1/3" style={{ animationDelay: "0.3s" }}>
                        <div className="relative mb-3 flex flex-col items-center float-c">
                          <Award className="w-4 h-4 text-amber-700 mb-1" />
                          <div className="w-14 h-14 rounded-full border-2 border-amber-700 flex items-center justify-center font-black text-lg bg-amber-950/30 text-amber-600 relative"
                            style={{ boxShadow: "0 0 12px rgba(180,83,9,0.15)" }}>
                            {getInitials(rankings[2].name)}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 border border-amber-950 flex items-center justify-center text-white font-black text-[10px]">3</div>
                          </div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-amber-950/40 to-amber-900/10 border-t border-x border-amber-700/20 rounded-t-xl h-[65px] flex flex-col items-center justify-center relative shimmer-e overflow-hidden">
                          <span className="text-white font-bold text-xs truncate w-11/12 text-center">{rankings[2].name}</span>
                          <span className="text-lg font-black text-white font-mono mt-1">{Math.floor(multiplier * rankings[2].points)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Leaderboard Table List */}
                  <section className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-12 px-4 py-2 text-white/30 text-[10px] uppercase tracking-wider font-bold border-b border-white/5">
                      <div className="col-span-2">Pos</div>
                      <div className="col-span-6">Player</div>
                      <div className="col-span-4 text-right">Points</div>
                    </div>

                    {rankings.map((player, idx) => {
                      const rank = idx + 1;
                      const isMe = currentUser?.id === player.id;
                      return (
                        <div
                          key={player.id}
                          className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border transition-all stagger-row ${
                            isMe
                              ? "bg-violet-400/8 border-violet-400/30 shadow-[0_0_20px_rgba(167,139,250,0.12)]"
                              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                          }`}
                          style={{ animationDelay: `${idx * 0.04}s` }}
                        >
                          <div className="col-span-2 flex items-center">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                              rank === 1 ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                              rank === 2 ? "bg-slate-400/10 text-slate-400 border border-slate-400/20" :
                              rank === 3 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" :
                              "text-white/30 text-xs font-mono"
                            }`}>
                              {rank === 1 ? <Trophy className="w-3.5 h-3.5" /> :
                               rank === 2 ? <Star className="w-3.5 h-3.5 fill-slate-400" /> :
                               rank === 3 ? <Award className="w-3.5 h-3.5" /> :
                               rank}
                            </div>
                          </div>

                          <div className="col-span-6 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isMe ? "bg-violet-400/20 text-violet-300 border border-violet-400/30" : "bg-white/5 text-white/50 border border-white/5"
                            }`}>
                              {getInitials(player.name)}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-xs font-bold truncate ${isMe ? "text-violet-300" : "text-white"}`}>
                                {player.name} {isMe && <span className="text-white/30 font-normal text-[10px]">(You)</span>}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-4 text-right flex items-center justify-end gap-1">
                            <span className="font-mono font-black text-sm text-white">
                              {Math.floor(multiplier * player.points)}
                            </span>
                            <span className="text-[10px] text-white/20">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB VIEW */}
          {activeTab === "members" && (
            <div className="space-y-3">
              {members.map((member) => {
                const isCreator = contest.creatorId === member.id;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 border border-white/5 rounded-xl surface-glass-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-xs font-black select-none text-white">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{member.name}</p>
                        <p className="text-[10px] text-white/30">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 gap-2">
                      {isCreator ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/10 border border-amber-400/20 text-amber-400">
                          <Shield className="w-2.5 h-2.5" /> Creator
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-white/45 uppercase tracking-wide">Member</span>
                          {(currentUser?.id === contest.creatorId || currentUser?.role === "admin") && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={removingMemberId === member.id}
                              className="ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {removingMemberId === member.id ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
