"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Trophy, Shield, History, Plus, Users, 
  ArrowRight, Sparkles, Copy, Check, LogOut,
  Gamepad2, Calendar, LayoutGrid
} from "lucide-react";

interface Contest {
  id: number;
  name: string;
  gameType: "match_prediction" | "first_goal" | "formation" | "bracket";
  joinCode: string;
  createdAt: string;
  tournamentName: string;
  memberCount: number;
  creatorName: string;
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
  {
    id: "match_prediction",
    title: "Match Predictor",
    desc: "Predict winner, exact score, and first scorer for 3x points.",
    accent: "#c6c0ff",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    glow: "rgba(198, 192, 255, 0.25)"
  },
  {
    id: "first_goal",
    title: "First Goal Timer",
    desc: "Guess the exact minute the first goal is scored in each match.",
    accent: "#ffb955",
    bg: "linear-gradient(135deg, #2b1b00 0%, #7c2d12 100%)",
    glow: "rgba(255, 185, 85, 0.25)"
  },
  {
    id: "formation",
    title: "Formation Predictor",
    desc: "Predict starting lineups and standard tactical setups.",
    accent: "#a855f7",
    bg: "linear-gradient(135deg, #1e1035 0%, #581c87 100%)",
    glow: "rgba(168, 85, 247, 0.25)"
  },
  {
    id: "bracket",
    title: "Tournament Bracket",
    desc: "Build the complete knockout path from Round of 16 to final winner.",
    accent: "#43df9e",
    bg: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    glow: "rgba(67, 223, 158, 0.25)"
  }
];

export default function ContestsDashboard() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; role?: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [allowContestCreation, setAllowContestCreation] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  // Create contest modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contestName, setContestName] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("match_prediction");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, contestsRes, tourRes, settingsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/contests"),
          fetch("/api/tournaments"),
          fetch("/api/settings")
        ]);

        if (userRes.ok) {
          const ud = await userRes.json();
          if (ud.user) setCurrentUser(ud.user);
        } else {
          router.push("/login");
          return;
        }

        if (contestsRes.ok) {
          const cd = await contestsRes.json();
          if (cd.success) setContests(cd.contests);
        }

        if (tourRes.ok) {
          const td = await tourRes.json();
          if (td.success) {
            setTournaments(td.tournaments);
            if (td.tournaments.length > 0) {
              setSelectedTournament(td.tournaments[0].id.toString());
            }
          }
        }

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.success) {
            setAllowContestCreation(sData.settings.allow_contest_creation);
          }
        }
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError("");
    setJoinSuccess("");

    try {
      const res = await fetch("/api/contests/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error ?? "Failed to join contest");
        setJoining(false);
        return;
      }

      setJoinSuccess(data.message ?? "Successfully joined!");
      setJoinCode("");

      // Reload contests
      const updatedRes = await fetch("/api/contests");
      if (updatedRes.ok) {
        const cd = await updatedRes.json();
        if (cd.success) setContests(cd.contests);
      }

      setTimeout(() => {
        setJoinSuccess("");
        // Redirect to new contest
        router.push(`/contests/${data.contestId}`);
      }, 1500);

    } catch (err) {
      setJoinError("Network error. Please check connection.");
    } finally {
      setJoining(false);
    }
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestName.trim() || !selectedTournament || !selectedGameMode) {
      setCreateError("All fields are required");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contestName,
          tournamentId: parseInt(selectedTournament, 10),
          gameType: selectedGameMode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create contest");
        setCreating(false);
        return;
      }

      // Reset form
      setContestName("");
      setShowCreateModal(false);

      // Reload contests list
      const updatedRes = await fetch("/api/contests");
      if (updatedRes.ok) {
        const cd = await updatedRes.json();
        if (cd.success) setContests(cd.contests);
      }

      // Direct to newly created contest details
      router.push(`/contests/${data.contest.id}`);
    } catch (err) {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, id: number, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {}
  };

  const canCreate = currentUser?.role === "admin" || (allowContestCreation && currentUser?.phone === "7994028954");

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
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Ambient glowing blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #c6c0ff, transparent)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #43df9e, transparent)" }} />
      </div>

      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <SoccerBallIcon className="w-7 h-7 text-primary" />
          <h1 className="headline-md font-extrabold tracking-tighter text-primary select-none">
            SKO<span className="text-white">RIO</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs font-bold text-white/50 bg-white/5 px-2.5 py-1 rounded-md">
            Hello, {currentUser?.name}
          </span>
          <button onClick={handleLogout} className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Log Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-24">
        
        {/* Welcome Section */}
        <section className="mb-8 text-left fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 surface-glass-1 border border-primary/20">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Contests Center</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Your Predictor Hub</h2>
          <p className="text-white/40 text-sm mt-1.5">Create or join contests, make predictions, and climb the scoreboard.</p>
        </section>

        {/* Join / Create Contests Panel */}
        <section className={`grid grid-cols-1 ${canCreate ? "sm:grid-cols-2" : ""} gap-4 mb-8 fade-up`} style={{ animationDelay: "0.1s" }}>
          {/* Join Contest Card */}
          <div className="surface-glass-1 p-5 rounded-2xl flex flex-col gap-4 border border-white/5">
            <div>
              <h3 className="label-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-secondary" /> Join Contest
              </h3>
              <p className="text-xs text-white/40 mt-1">Enter a 6-character invite code to join a private contest.</p>
            </div>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                placeholder="Join Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white focus:outline-none focus:border-secondary transition-colors"
              />
              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="bg-secondary text-on-secondary px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                {joining ? "Joining..." : "Join"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {joinError && <p className="text-red-400 text-xs font-semibold">{joinError}</p>}
            {joinSuccess && <p className="text-secondary text-xs font-semibold">{joinSuccess}</p>}
          </div>

          {/* Create Contest Card */}
          {canCreate && (
            <div className="surface-glass-1 p-5 rounded-2xl flex flex-col justify-between gap-4 border border-white/5">
              <div>
                <h3 className="label-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" /> Create Contest
                </h3>
                <p className="text-xs text-white/40 mt-1">Start a custom scoreboard with friends playing any prediction mode.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-gradient-to-r from-primary-container to-primary text-on-primary-container py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
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

          {contests.length === 0 ? (
            <div className="surface-glass-1 border border-white/5 rounded-2xl p-12 text-center text-white/20">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-white" />
              <p className="text-sm font-semibold">You have not joined any contests yet.</p>
              <p className="text-xs mt-1 text-white/30">Join an existing contest via code or create one to start playing!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {contests.map((contest, index) => {
                const isCopied = copiedId === contest.id;
                
                // Set badge colors dynamically based on game type
                const gameModeCfg = {
                  match_prediction: { label: "Match Predictor", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                  first_goal: { label: "First Goal", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  formation: { label: "Formation", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                  bracket: { label: "Bracket", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
                }[contest.gameType] ?? { label: contest.gameType, color: "text-white/40 bg-white/5 border-white/10" };

                return (
                  <div
                    key={contest.id}
                    onClick={() => router.push(`/contests/${contest.id}`)}
                    className="group relative surface-glass-1 hover:surface-glass-2 border border-white/5 hover:border-white/12 rounded-2xl p-5 flex items-center justify-between transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col gap-2.5 text-left max-w-[70%]">
                      {/* Badge and info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${gameModeCfg.color}`}>
                          {gameModeCfg.label}
                        </span>
                        <span className="text-[10px] text-white/35 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {contest.tournamentName}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-white leading-tight group-hover:text-primary transition-colors">
                        {contest.name}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-white/45">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-secondary" /> {contest.memberCount} members
                        </span>
                        <span>•</span>
                        <span className="truncate">By {contest.creatorName || "System"}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      {/* Join code display */}
                      <button
                        onClick={(e) => handleCopyCode(e, contest.id, contest.joinCode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/8 text-white transition-colors"
                        title="Copy Join Code"
                      >
                        <span className="tracking-wide">{contest.joinCode}</span>
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-secondary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                        )}
                      </button>

                      <div className="p-2 rounded-xl bg-white/5 border border-white/8 text-white/50 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Gradient top highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden"
        style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/contests" className="flex flex-col items-center gap-0.5 text-primary">
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

      {/* CREATE CONTEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md surface-glass-2 rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col gap-5 text-left">
            <div>
              <h3 className="text-xl font-black text-white">Create New Contest</h3>
              <p className="text-xs text-white/40 mt-1">Start a custom predictor competition for your friends.</p>
            </div>

            <form onSubmit={handleCreateContest} className="flex flex-col gap-4">
              {/* Contest Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Contest Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream Team League"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Select Tournament */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Tournament / League</label>
                <select
                  required
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                  className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="" disabled>Select Tournament</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.type === "bracket" ? "Bracket" : "League matches"})</option>
                  ))}
                </select>
              </div>

              {/* Select Game Type (Visual Grid Selection) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Game Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {GAME_MODES.map((mode) => {
                    const isSelected = selectedGameMode === mode.id;
                    return (
                      <div
                        key={mode.id}
                        onClick={() => setSelectedGameMode(mode.id)}
                        className={`p-3 rounded-2xl cursor-pointer border flex flex-col gap-1 transition-all duration-300 ${
                          isSelected
                            ? "border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                        }`}
                      >
                        <span className="text-xs font-black text-white">{mode.title}</span>
                        <span className="text-[9px] leading-tight text-white/40">{mode.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {createError && <p className="text-red-400 text-xs font-semibold">{createError}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/8 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
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
