"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Shield, History, Plus, Users,
  ArrowRight, Sparkles, Copy, Check, LogOut,
  Gamepad2, Calendar, LayoutGrid
} from "lucide-react";
import TopBar from "@/components/TopBar";
import AuthModal from "@/components/AuthModal";
import AppInstallBanner from "@/components/AppInstallBanner";

interface Contest {
  id: number;
  name: string;
  gameType: "match_prediction" | "first_goal" | "formation" | "bracket";
  joinCode: string;
  createdAt: string;
  tournamentName: string;
  memberCount: number;
  creatorName: string;
  isPublic?: boolean;
}

interface Tournament {
  id: number;
  name: string;
  type: string;
}

const SoccerBallIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" /><path d="M12 22v-3" />
    <path d="M10 5 6 8.5" /><path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" /><path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" /><path d="M16.5 13 12 15" />
    <path d="M12 15v4" /><path d="M12 22 8.5 19.5" /><path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" /><path d="M16.5 13H20" />
  </svg>
);

const GAME_MODES = [
  { id: "match_prediction", title: "Match Predictor", desc: "Predict winner, exact score, and first scorer for 3x points.", accent: "#c6c0ff", bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", glow: "rgba(198, 192, 255, 0.25)" },
  { id: "first_goal", title: "First Goal Timer", desc: "Guess the exact minute the first goal is scored in each match.", accent: "#ffb955", bg: "linear-gradient(135deg, #2b1b00 0%, #7c2d12 100%)", glow: "rgba(255, 185, 85, 0.25)" },
  { id: "formation", title: "Formation Predictor", desc: "Predict starting lineups and standard tactical setups.", accent: "#a855f7", bg: "linear-gradient(135deg, #1e1035 0%, #581c87 100%)", glow: "rgba(168, 85, 247, 0.25)" },
  { id: "bracket", title: "Tournament Bracket", desc: "Build the complete knockout path from Round of 16 to final winner.", accent: "#43df9e", bg: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)", glow: "rgba(67, 223, 158, 0.25)" }
];

export default function ContestsDashboard() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [globalContests, setGlobalContests] = useState<Contest[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id?: number; name: string; role?: string; phone?: string; points?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [allowContestCreation, setAllowContestCreation] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contestName, setContestName] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("match_prediction");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authHint, setAuthHint] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const gateAction = useCallback((hint: string, action: () => void) => {
    if (!currentUser) {
      setAuthHint(hint);
      setPendingAction(() => action);
      setShowAuthModal(true);
    } else {
      action();
    }
  }, [currentUser]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    window.location.reload();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [userRes, publicContestsRes, tourRes, settingsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/contests/public"),
        fetch("/api/tournaments"),
        fetch("/api/settings"),
      ]);

      if (userRes.ok) {
        const ud = await userRes.json();
        if (ud.user) {
          setCurrentUser(ud.user);
          const contestsRes = await fetch("/api/contests");
          if (contestsRes.ok) {
            const cd = await contestsRes.json();
            if (cd.success) {
              setContests(cd.contests);
              setGlobalContests(cd.globalContests || []);
            }
          }
        }
      } else {
        if (publicContestsRes.ok) {
          const pd = await publicContestsRes.json();
          if (pd.success) setGlobalContests(pd.contests || []);
        }
      }

      if (tourRes.ok) {
        const td = await tourRes.json();
        if (td.success) {
          setTournaments(td.tournaments);
          if (td.tournaments.length > 0) setSelectedTournament(td.tournaments[0].id.toString());
        }
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.success) setAllowContestCreation(sData.settings.allow_contest_creation);
      }
    } catch (err) {
      console.error("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleJoinWithCode = async (code: string) => {
    setJoining(true); setJoinError(""); setJoinSuccess("");
    try {
      const res = await fetch("/api/contests/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error ?? "Failed to join contest"); setJoining(false); return; }
      setJoinSuccess(data.message ?? "Successfully joined!");
      setJoinCode("");
      const updatedRes = await fetch("/api/contests");
      if (updatedRes.ok) {
        const cd = await updatedRes.json();
        if (cd.success) { setContests(cd.contests); setGlobalContests(cd.globalContests || []); }
      }
      setTimeout(() => { setJoinSuccess(""); router.push(`/contests/${data.contestId}`); }, 1500);
    } catch { setJoinError("Network error. Please check connection."); }
    finally { setJoining(false); }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    gateAction("Sign in to join this contest", () => handleJoinWithCode(joinCode));
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestName.trim() || !selectedGameMode) { setCreateError("All fields are required"); return; }
    setCreating(true); setCreateError("");
    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contestName, tournamentId: 1, gameType: selectedGameMode }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Failed to create contest"); setCreating(false); return; }
      setContestName(""); setShowCreateModal(false);
      const updatedRes = await fetch("/api/contests");
      if (updatedRes.ok) {
        const cd = await updatedRes.json();
        if (cd.success) setContests(cd.contests);
      }
      router.push(`/contests/${data.contest.id}`);
    } catch { setCreateError("Network error. Please try again."); }
    finally { setCreating(false); }
  };

  const handleCopyCode = (e: React.MouseEvent, id: number, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const canCreate = currentUser?.role === "admin" || (allowContestCreation && currentUser?.phone === "7994028594");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Entering Arena…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 bg-pitch overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #c6c0ff, transparent)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #43df9e, transparent)" }} />
      </div>

      <TopBar userName={currentUser?.name} userPoints={currentUser?.points} userRole={currentUser?.role} activeTab="contests" />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-20">

        <div className="mb-6 fade-up">
          <AppInstallBanner />
        </div>

        <section className="mb-8 text-left fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 surface-glass-1 border border-primary/20">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Contests Center</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Your Predictor Hub</h2>
          <p className="text-white/40 text-sm mt-1.5">Create or join contests, make predictions, and climb the scoreboard.</p>
        </section>

        {/* Global Contests Banner */}
        {(() => {
          const unjoinedGlobalContests = globalContests.filter((gc) => !contests.some((c) => c.id === gc.id));
          if (unjoinedGlobalContests.length === 0) return null;
          return (
            <section className="mb-8 fade-up" style={{ animationDelay: "0.05s" }}>
              {unjoinedGlobalContests.map((globalContest) => {
                const gameModeCfg = {
                  match_prediction: { label: "Match Predictor", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", glow: "rgba(99, 102, 241, 0.15)" },
                  first_goal: { label: "First Goal", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", glow: "rgba(245, 158, 11, 0.15)" },
                  formation: { label: "Formation", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", glow: "rgba(168, 85, 247, 0.15)" },
                  bracket: { label: "Bracket", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", glow: "rgba(16, 185, 129, 0.15)" }
                }[globalContest.gameType] ?? { label: globalContest.gameType, color: "text-white/40 bg-white/5 border-white/10", glow: "rgba(255,255,255,0.05)" };
                return (
                  <div key={globalContest.id}
                    className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-emerald-950/40 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300 hover:border-primary/45 group"
                    style={{ boxShadow: `0 10px 40px -10px ${gameModeCfg.glow}, inset 0 1px 1px rgba(255,255,255,0.1)` }}
                  >
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-white">
                      <SoccerBallIcon className="w-48 h-48" />
                    </div>
                    <div className="flex flex-col gap-3 text-left relative z-10 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/25 border border-primary/40 text-primary animate-pulse inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">🔥 Global Arena</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${gameModeCfg.color}`}>{gameModeCfg.label}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors">{globalContest.name}</h3>
                        <p className="text-white/60 text-sm mt-1 max-w-md">Join the official global tournament! Compete with everyone, predict matches, and climb to the top of the global leaderboard.</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-white/40 mt-1">
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-secondary" /><span className="text-white font-bold">{globalContest.memberCount}</span> competitors</span>
                        <span>•</span><span>Free Entry</span>
                      </div>
                    </div>
                    <div className="relative z-10 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => gateAction("Sign in to join the Global Arena", () => handleJoinWithCode(globalContest.joinCode))}
                        disabled={joining}
                        className="w-full sm:w-auto bg-primary text-on-primary hover:bg-primary/90 active:scale-95 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {joining ? <><div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />Joining...</> : <>Join Global Contest<ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* Join / Create Panel */}
        <section className={`grid grid-cols-1 ${canCreate ? "sm:grid-cols-2" : ""} gap-4 mb-8 fade-up`} style={{ animationDelay: "0.1s" }}>
          <div className="surface-glass-1 p-5 rounded-2xl flex flex-col gap-4 border border-white/5">
            <div>
              <h3 className="label-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><Users className="w-4 h-4 text-secondary" /> Join Contest</h3>
              <p className="text-xs text-white/40 mt-1">Enter a 6-character invite code to join a private contest.</p>
            </div>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input type="text" maxLength={10} placeholder="Join Code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white focus:outline-none focus:border-secondary transition-colors" />
              <button type="submit" disabled={joining || !joinCode.trim()}
                className="bg-secondary text-on-secondary px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1">
                {joining ? "Joining..." : "Join"}<ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {joinError && <p className="text-red-400 text-xs font-semibold">{joinError}</p>}
            {joinSuccess && <p className="text-secondary text-xs font-semibold">{joinSuccess}</p>}
          </div>
          {canCreate && (
            <div className="surface-glass-1 p-5 rounded-2xl flex flex-col justify-between gap-4 border border-white/5">
              <div>
                <h3 className="label-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><Plus className="w-4 h-4 text-primary" /> Create Contest</h3>
                <p className="text-xs text-white/40 mt-1">Start a custom scoreboard with friends playing any prediction mode.</p>
              </div>
              <button onClick={() => gateAction("Sign in to create a contest", () => setShowCreateModal(true))}
                className="w-full bg-gradient-to-r from-primary-container to-primary text-on-primary-container py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Start A Contest
              </button>
            </div>
          )}
        </section>

        {/* Contests List */}
        <section className="fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="label-md uppercase tracking-widest text-white/45">My Active Contests ({contests.length})</h3>
          </div>
          {!currentUser ? (
            <div className="surface-glass-1 border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
              <Trophy className="w-12 h-12 opacity-20 text-white" />
              <div>
                <p className="text-sm font-bold text-white/50">Sign in to see your contests</p>
                <p className="text-xs mt-1 text-white/25">Join or create contests after logging in.</p>
              </div>
              <button onClick={() => { setAuthHint("Sign in to access your contests"); setShowAuthModal(true); }}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                Sign In / Join as Guest
              </button>
            </div>
          ) : contests.length === 0 ? (
            <div className="surface-glass-1 border border-white/5 rounded-2xl p-12 text-center text-white/20">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-white" />
              <p className="text-sm font-semibold">You have not joined any contests yet.</p>
              <p className="text-xs mt-1 text-white/30">Join an existing contest via code or create one to start playing!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {contests.map((contest) => {
                const gameModeCfg = {
                  match_prediction: { label: "Match Predictor", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                  first_goal: { label: "First Goal", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  formation: { label: "Formation", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                  bracket: { label: "Bracket", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
                }[contest.gameType] ?? { label: contest.gameType, color: "text-white/40 bg-white/5 border-white/10" };
                return (
                  <React.Fragment key={contest.id}>
                  <div
                    onClick={() => gateAction("Sign in to enter this contest", () => router.push(`/contests/${contest.id}`))}
                    className="group relative surface-glass-1 hover:surface-glass-2 border border-white/5 hover:border-white/12 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col gap-2.5 text-left max-w-[70%]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${gameModeCfg.color}`}>{gameModeCfg.label}</span>
                      </div>
                      <h4 className="text-lg font-black text-white leading-tight group-hover:text-primary transition-colors flex items-center gap-2">
                        {contest.name}
                        {contest.isPublic && <span className="inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 self-center">Global</span>}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-white/45">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-secondary" /> {contest.memberCount} members</span>
                        <span>•</span>
                        <span className="truncate">By {contest.creatorName || "System"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/8 text-white/50 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/" className="flex flex-col items-center gap-0.5 text-primary">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">My Contests</span>
        </a>
        <a href="/games" className="flex flex-col items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity text-white">
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Games</span>
        </a>
        <a href="/history" className="flex flex-col items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity text-white">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold">History</span>
        </a>
        {currentUser?.role === "admin" && (
          <a href="/admin" className="flex flex-col items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity text-white">
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

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md surface-glass-2 rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col gap-5 text-left">
            <div>
              <h3 className="text-xl font-black text-white">Create New Contest</h3>
              <p className="text-xs text-white/40 mt-1">Start a custom predictor competition for your friends.</p>
            </div>
            <form onSubmit={handleCreateContest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Contest Name</label>
                <input type="text" required placeholder="e.g. Dream Team League" value={contestName} onChange={(e) => setContestName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Game Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {GAME_MODES.map((mode) => (
                    <div key={mode.id} onClick={() => setSelectedGameMode(mode.id)}
                      className={`p-3 rounded-2xl cursor-pointer border flex flex-col gap-1 transition-all duration-300 ${selectedGameMode === mode.id ? "border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)]" : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"}`}>
                      <span className="text-xs font-black text-white">{mode.title}</span>
                      <span className="text-[9px] leading-tight text-white/40">{mode.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              {createError && <p className="text-red-400 text-xs font-semibold">{createError}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/8 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                  {creating ? "Creating..." : "Start Contest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
