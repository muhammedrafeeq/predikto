"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Layers,
  Copy,
  Check,
  Trash2,
  Users,
  ChevronRight,
  XCircle,
  AlertTriangle,
  UserPlus,
  UserMinus,
  X,
  Loader2,
  Tag,
  CalendarDays,
} from "lucide-react";

interface Contest {
  id: number;
  name: string;
  gameType: string;
  joinCode: string;
  createdAt: string;
  tournamentId: number;
  tournamentName: string;
  creatorName: string | null;
  memberCount: number;
  isPublic?: boolean;
}

interface Member {
  id: number;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  predictionsCount: number;
}

interface Tournament {
  id: number;
  name: string;
}

interface AllUser {
  id: number;
  name: string;
  phone: string;
}

const GAME_TYPE_META: Record<string, { label: string; color: string }> = {
  match_prediction: { label: "Match Prediction", color: "bg-primary/15 text-primary" },
  first_goal: { label: "First Goal", color: "bg-secondary/15 text-secondary" },
  formation: { label: "Formation", color: "bg-tertiary/15 text-tertiary" },
  bracket: { label: "Bracket", color: "bg-primary-container/20 text-primary-container" },
};

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [newName, setNewName] = useState("");
  const [newTournamentId, setNewTournamentId] = useState<number | "">("");
  const [newGameType, setNewGameType] = useState("match_prediction");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Members panel
  const [membersContest, setMembersContest] = useState<Contest | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [addUserSearch, setAddUserSearch] = useState("");
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  // Delete modal
  const [deleteContest, setDeleteContest] = useState<Contest | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copy-to-clipboard state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadContests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/contests");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setContests(data.contests);
      }
    } catch (err) {
      console.error("Failed to load contests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  // Load tournaments for create modal
  const openCreate = async () => {
    setShowCreate(true);
    setNewName("");
    setNewTournamentId("");
    setNewGameType("match_prediction");
    setNewIsPublic(false);
    setCreateError("");
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments ?? data ?? []);
      }
    } catch {
      // fallback: empty
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!newName.trim() || !newTournamentId) {
      setCreateError("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName.trim(), 
          tournamentId: newTournamentId, 
          gameType: newGameType,
          isPublic: newIsPublic
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContests((prev) => [data.contest, ...prev]);
        setShowCreate(false);
      } else {
        setCreateError(data.error || "Failed to create contest");
      }
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // Open members panel
  const openMembers = async (contest: Contest) => {
    setMembersContest(contest);
    setMembersLoading(true);
    setAddUserSearch("");
    try {
      const [membersRes, usersRes] = await Promise.all([
        fetch(`/api/admin/contests/${contest.id}`),
        fetch("/api/admin/users"),
      ]);
      if (membersRes.ok) {
        const d = await membersRes.json();
        setMembers(d.members ?? []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setAllUsers((d.users ?? []).map((u: { id: number; name: string; phone: string }) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
        })));
      }
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!membersContest) return;
    setAddingUserId(userId);
    try {
      const res = await fetch(`/api/admin/contests/${membersContest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", userId }),
      });
      if (res.ok) {
        // Refresh members
        const user = allUsers.find((u) => u.id === userId);
        if (user) {
          setMembers((prev) => [
            ...prev,
            { id: user.id, name: user.name, phone: user.phone, role: "user", isActive: true, joinedAt: new Date().toISOString(), predictionsCount: 0 },
          ]);
          setContests((prev) =>
            prev.map((c) => (c.id === membersContest.id ? { ...c, memberCount: c.memberCount + 1 } : c))
          );
        }
      }
    } catch {
      console.error("Failed to add member");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!membersContest) return;
    setRemovingUserId(userId);
    try {
      const res = await fetch(`/api/admin/contests/${membersContest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", userId }),
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        setContests((prev) =>
          prev.map((c) => (c.id === membersContest.id ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c))
        );
      }
    } catch {
      console.error("Failed to remove member");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteContest) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/contests/${deleteContest.id}`, { method: "DELETE" });
      if (res.ok) {
        setContests((prev) => prev.filter((c) => c.id !== deleteContest.id));
        setDeleteContest(null);
      }
    } catch {
      console.error("Failed to delete contest");
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = contests.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.tournamentName.toLowerCase().includes(q) ||
      c.joinCode.toLowerCase().includes(q);
    const matchesType = filterType === "all" || c.gameType === filterType;
    return matchesSearch && matchesType;
  });

  const memberIds = new Set(members.map((m) => m.id));
  const nonMembers = allUsers.filter(
    (u) =>
      !memberIds.has(u.id) &&
      (u.name.toLowerCase().includes(addUserSearch.toLowerCase()) ||
        u.phone.includes(addUserSearch))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Contests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">Contest Manager</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-secondary rounded-full" />
            <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
              {contests.length} Total Contests
            </p>
          </div>
        </div>
        <button
          id="create-contest-btn"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary label-md font-bold rounded-lg active:scale-95 transition-all shadow-lg shadow-secondary/20"
        >
          <Plus className="w-5 h-5" />
          New Contest
        </button>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(GAME_TYPE_META).map(([type, meta]) => {
          const count = contests.filter((c) => c.gameType === type).length;
          return (
            <div key={type} className="surface-glass-1 rounded-xl p-4 flex flex-col gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start ${meta.color}`}>
                {meta.label}
              </span>
              <p className="text-2xl font-extrabold text-white font-mono mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="surface-glass-1 rounded-xl p-3 flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 text-on-surface-variant shrink-0" />
          <input
            id="contest-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tournament or join code..."
            className="bg-transparent border-none focus:outline-none label-md flex-1 text-on-surface placeholder:text-on-surface-variant/40"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface label-md focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="match_prediction">Match Prediction</option>
          <option value="first_goal">First Goal</option>
          <option value="formation">Formation</option>
          <option value="bracket">Bracket</option>
        </select>
      </div>

      {/* Contests list */}
      {filtered.length === 0 ? (
        <div className="surface-glass-1 rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Layers className="w-8 h-8 text-secondary" />
          </div>
          <p className="headline-md text-on-surface">No contests found</p>
          <p className="body-md text-on-surface-variant">Create your first contest to get started</p>
          <button
            onClick={openCreate}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary label-md font-bold rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Contest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((contest) => {
            const meta = GAME_TYPE_META[contest.gameType] ?? { label: contest.gameType, color: "bg-white/10 text-white" };
            return (
              <div
                key={contest.id}
                className="surface-glass-1 rounded-xl p-5 flex flex-col gap-4 hover:bg-white/5 transition-all duration-300 group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <h3 className="label-md font-bold text-white text-base truncate">{contest.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      {contest.isPublic && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Public
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {contest.tournamentName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Join code */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-0.5">Join Code</p>
                    <p className="font-mono font-bold text-primary text-lg tracking-widest">{contest.joinCode}</p>
                  </div>
                  <button
                    onClick={() => copyCode(contest.joinCode)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-on-surface-variant hover:text-primary"
                    title="Copy join code"
                  >
                    {copiedCode === contest.joinCode ? (
                      <Check className="w-4 h-4 text-secondary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Members</p>
                      <p className="font-mono font-bold text-white">{contest.memberCount}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Created</p>
                      <p className="font-mono font-bold text-white text-xs">
                        {new Date(contest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Creator */}
                {contest.creatorName && (
                  <p className="text-[11px] text-on-surface-variant">
                    Created by <span className="text-on-surface font-semibold">{contest.creatorName}</span>
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => openMembers(contest)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 rounded-lg label-md text-on-surface hover:text-primary transition-all"
                  >
                    <Users className="w-4 h-4" />
                    Manage Members
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                  <button
                    onClick={() => setDeleteContest(contest)}
                    className="p-2.5 bg-white/5 border border-white/10 hover:bg-error/10 hover:border-error/30 rounded-lg text-on-surface-variant hover:text-error transition-all"
                    title="Delete contest"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <button
            onClick={openCreate}
            className="rounded-xl border-2 border-dashed border-white/10 hover:border-secondary/40 flex flex-col items-center justify-center gap-3 p-8 group transition-all duration-300 min-h-[240px] hover:bg-white/5"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5 group-hover:border-secondary/30">
              <Plus className="w-6 h-6 text-secondary" />
            </div>
            <p className="label-md font-bold text-on-surface-variant group-hover:text-secondary transition-colors">
              Create New Contest
            </p>
          </button>
        </div>
      )}

      {/* ── Create Contest Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md surface-glass-1 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl border border-white/10">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-secondary" />
                <h3 className="headline-md font-bold text-white">New Contest</h3>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </header>

            {createError && (
              <div className="p-3 bg-error/10 border border-error/30 text-error rounded-lg text-sm">{createError}</div>
            )}

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block label-md text-on-surface-variant mb-1.5">Contest Name</label>
                <input
                  id="contest-name-input"
                  required
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Premier League Predictor"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block label-md text-on-surface-variant mb-1.5">Tournament</label>
                <select
                  required
                  value={newTournamentId}
                  onChange={(e) => setNewTournamentId(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:border-secondary focus:outline-none cursor-pointer"
                >
                  <option value="">Select a tournament...</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block label-md text-on-surface-variant mb-1.5">Game Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(GAME_TYPE_META).map(([type, meta]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewGameType(type)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left ${
                        newGameType === type
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20"
                      }`}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contest Type Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/60">Contest Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewIsPublic(false)}
                    className={`p-3 rounded-xl cursor-pointer border flex flex-col gap-1 transition-all duration-300 text-left ${
                      !newIsPublic
                        ? "border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(245,166,35,0.05)]"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">Private Contest</span>
                    <span className="text-[9px] leading-tight text-white/40">Users must enter invite code to join.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIsPublic(true)}
                    className={`p-3 rounded-xl cursor-pointer border flex flex-col gap-1 transition-all duration-300 text-left ${
                      newIsPublic
                        ? "border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(245,166,35,0.05)]"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">Global Contest</span>
                    <span className="text-[9px] leading-tight text-white/40">Shows as a banner for all users with quick-join button.</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant bg-white/5 rounded-lg px-3 py-2">
                🎲 A unique join code will be automatically generated for this contest.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg font-bold text-sm text-on-surface transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="contest-create-submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-secondary text-on-secondary rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Contest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Members Panel ── */}
      {membersContest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full sm:w-[480px] h-full sm:h-auto sm:max-h-[90vh] bg-surface-container-lowest border-l border-white/10 flex flex-col shadow-2xl overflow-hidden sm:rounded-l-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-white text-base">Members</h3>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 font-mono">{membersContest.name}</p>
              </div>
              <button
                onClick={() => setMembersContest(null)}
                className="p-2 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              {/* Add member */}
              <div className="flex flex-col gap-3">
                <p className="label-md font-bold text-on-surface-variant uppercase tracking-wider text-xs">Add User</p>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
                  <input
                    value={addUserSearch}
                    onChange={(e) => setAddUserSearch(e.target.value)}
                    placeholder="Search users to add..."
                    className="bg-transparent focus:outline-none text-sm flex-1 text-on-surface placeholder:text-on-surface-variant/40"
                  />
                </div>
                {addUserSearch && nonMembers.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{u.name}</p>
                      <p className="text-xs text-on-surface-variant font-mono">{u.phone}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(u.id)}
                      disabled={addingUserId === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-lg text-primary text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {addingUserId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Add
                    </button>
                  </div>
                ))}
              </div>

              {/* Current members */}
              <div className="flex flex-col gap-3">
                <p className="label-md font-bold text-on-surface-variant uppercase tracking-wider text-xs">
                  Current Members ({members.length})
                </p>
                {membersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-6">No members yet</p>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{m.name}</p>
                            {m.role === "admin" && (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Admin</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant font-mono">{m.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant font-mono">{m.predictionsCount} picks</span>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={removingUserId === m.id}
                          className="p-1.5 hover:bg-error/10 rounded-lg text-on-surface-variant hover:text-error transition-all disabled:opacity-50"
                          title="Remove from contest"
                        >
                          {removingUserId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm surface-glass-1 rounded-2xl p-6 flex flex-col gap-5 border border-error/20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Contest?</h3>
                <p className="text-xs text-white/50 mt-0.5">This cannot be undone.</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <p className="text-sm text-white font-semibold">{deleteContest.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 font-mono">{deleteContest.joinCode} · {deleteContest.memberCount} members</p>
            </div>

            <p className="text-sm text-white/60 leading-relaxed">
              This will permanently delete the contest and all associated{" "}
              <span className="text-white font-semibold">predictions</span>,{" "}
              <span className="text-white font-semibold">scores</span>, and{" "}
              <span className="text-white font-semibold">member records</span>.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteContest(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white/70 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-error/80 hover:bg-error text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
