"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Pencil, Save, X, Search, Loader2, User,
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Database,
} from "lucide-react";

interface WhoAmIPlayer {
  id: number;
  playerName: string;
  aliases: string[];
  clues: string[];
  cluesMl: string[];
  active: boolean;
  createdAt: string;
}

interface PlayerSuggestion {
  name: string;
  teamName: string;
}

const EMPTY_FORM = {
  playerName: "",
  aliases: "",
  clues: ["", "", "", "", "", ""] as string[],
  cluesMl: ["", "", "", "", "", ""] as string[],
  active: true,
};

export default function AdminWhoAmIPage() {
  const [players, setPlayers] = useState<WhoAmIPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<WhoAmIPlayer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Player search
  const [playerSearch, setPlayerSearch] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const res = await fetch("/api/admin/who-am-i");
      if (res.ok) {
        const d = await res.json();
        setPlayers(d.players ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/admin/players?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const d = await res.json();
        setSuggestions(d.players ?? []);
      }
    } catch { /* ignore */ }
  };

  const handlePlayerSearchChange = (val: string) => {
    setPlayerSearch(val);
    setForm((f) => ({ ...f, playerName: val }));
    setShowSuggestions(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  const selectSuggestion = (name: string) => {
    setForm((f) => ({ ...f, playerName: name }));
    setPlayerSearch(name);
    setShowSuggestions(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPlayerSearch("");
    setSaveError("");
    setShowForm(true);
  };

  const openEdit = (p: WhoAmIPlayer) => {
    setEditingId(p.id);
    setForm({
      playerName: p.playerName,
      aliases: p.aliases.join(", "),
      clues: [...p.clues, ...Array(Math.max(0, 6 - p.clues.length)).fill("")].slice(0, 6),
      cluesMl: [...p.cluesMl, ...Array(Math.max(0, 6 - p.cluesMl.length)).fill("")].slice(0, 6),
      active: p.active,
    });
    setPlayerSearch(p.playerName);
    setSaveError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    if (!form.playerName.trim()) { setSaveError("Player name is required"); return; }
    if (form.clues.some((c) => !c.trim())) { setSaveError("All 6 English clues are required"); return; }

    setSaving(true);
    const payload = {
      playerName: form.playerName.trim(),
      aliases: form.aliases.split(",").map((a) => a.trim()).filter(Boolean),
      clues: form.clues.map((c) => c.trim()),
      cluesMl: form.cluesMl.map((c) => c.trim()),
      active: form.active,
    };

    try {
      const url = editingId ? `/api/admin/who-am-i/${editingId}` : "/api/admin/who-am-i";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadPlayers();
        setShowForm(false);
      } else {
        setSaveError(data.error ?? "Failed to save");
      }
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/who-am-i/${deleteConfirm.id}`, { method: "DELETE" });
      setPlayers((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch { /* ignore */ } finally {
      setDeleting(false);
    }
  };

  const setClue = (i: number, val: string) =>
    setForm((f) => { const c = [...f.clues]; c[i] = val; return { ...f, clues: c }; });

  const setClueMl = (i: number, val: string) =>
    setForm((f) => { const c = [...f.cluesMl]; c[i] = val; return { ...f, cluesMl: c }; });

  const handleSeedFromPlayers = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/seed-who-am-i", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedResult(`✅ ${data.message}`);
        await loadPlayers();
      } else {
        setSeedResult(`❌ ${data.error ?? "Seeding failed"}`);
      }
    } catch {
      setSeedResult("❌ Network error");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="headline-lg text-on-surface mb-1">Who Am I — Players</h2>
            <p className="text-on-surface-variant text-xs font-mono">{players.length} players configured</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedFromPlayers}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 label-md font-bold rounded-lg active:scale-95 transition-all disabled:opacity-50"
              title="Auto-seed all WC 2026 players from the players table using Wikipedia data"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {seeding ? "Seeding…" : "Seed from Players"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary label-md font-bold rounded-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Player
            </button>
          </div>
        </div>
        {seedResult && (
          <div className={`text-xs px-4 py-2 rounded-lg font-mono ${seedResult.startsWith("✅") ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {seedResult}
          </div>
        )}
      </header>

      {/* Players list */}
      {players.length === 0 ? (
        <div className="surface-glass-1 rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <User className="w-12 h-12 text-on-surface-variant/40" />
          <p className="text-on-surface font-bold">No players yet</p>
          <p className="text-on-surface-variant text-sm">Add a player with 6 clues to get started.</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg font-bold text-sm">
            <Plus className="w-4 h-4" /> Add Player
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {players.map((p, idx) => (
            <div key={p.id} className="surface-glass-1 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400 text-xs font-black shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{p.playerName}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">{p.clues.length} clues · {p.cluesMl.filter(Boolean).length} ML clues</p>
                  </div>
                  {!p.active && (
                    <span className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full border border-white/10 font-bold">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-on-surface-variant hover:text-white transition-colors"
                  >
                    {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 hover:bg-primary/10 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p)}
                    className="p-1.5 hover:bg-error/10 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === p.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                  {p.clues.map((clue, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-lg px-3 py-2 text-xs">
                        <span className="text-on-surface-variant font-bold block mb-0.5">Clue {i + 1} (EN)</span>
                        <span className="text-white/70">{clue || <span className="italic text-white/20">—</span>}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-2 text-xs">
                        <span className="text-on-surface-variant font-bold block mb-0.5">Clue {i + 1} (ML)</span>
                        <span className="text-white/70">{p.cluesMl[i] || <span className="italic text-white/20">—</span>}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl surface-glass-1 rounded-2xl p-6 flex flex-col gap-5 border border-white/10 my-4">
            <header className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">
                {editingId ? "Edit Player" : "Add Player"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            {saveError && (
              <div className="p-3 bg-error/10 border border-error/30 text-error rounded-lg text-sm">{saveError}</div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Player name search */}
              <div className="relative">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                  Player Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                  <input
                    value={playerSearch}
                    onChange={(e) => handlePlayerSearchChange(e.target.value)}
                    onFocus={() => { if (playerSearch.length >= 2) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search from players table..."
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#101015] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {suggestions.map((s) => (
                        <div
                          key={s.name}
                          onMouseDown={() => selectSuggestion(s.name)}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                        >
                          <span className="text-sm font-semibold text-white/90">{s.name}</span>
                          <span className="text-[10px] text-white/35 uppercase">{s.teamName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Aliases */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                  Accepted Aliases (comma-separated)
                </label>
                <input
                  value={form.aliases}
                  onChange={(e) => setForm((f) => ({ ...f, aliases: e.target.value }))}
                  placeholder="e.g. messi, leo, leo messi"
                  className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* 6 clue pairs */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  Clues (6 required) <span className="text-error">*</span>
                </label>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold block mb-1">Clue {i + 1} — English</span>
                      <textarea
                        value={form.clues[i]}
                        onChange={(e) => setClue(i, e.target.value)}
                        placeholder={`English clue ${i + 1}...`}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-400/70 font-bold block mb-1">Clue {i + 1} — Malayalam</span>
                      <textarea
                        value={form.cluesMl[i]}
                        onChange={(e) => setClueMl(i, e.target.value)}
                        placeholder={`മലയാളം സൂചന ${i + 1}...`}
                        rows={2}
                        className="w-full bg-teal-400/5 border border-teal-400/10 focus:border-teal-400/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`w-10 h-5 rounded-full transition-colors ${form.active ? "bg-secondary" : "bg-white/10"} relative`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.active ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="text-sm text-on-surface-variant">Active (show in game rotation)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg font-bold text-sm text-on-surface transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-secondary text-on-secondary rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Player</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm surface-glass-1 rounded-2xl p-6 flex flex-col gap-5 border border-error/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-white">Delete Player?</h3>
                <p className="text-xs text-white/40">{deleteConfirm.playerName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white/70">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-error/80 hover:bg-error text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
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
