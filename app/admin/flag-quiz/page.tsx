"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Flag, ToggleLeft, ToggleRight } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

interface FlagEntry {
  id: number;
  country_name: string;
  flag_emoji: string;
  difficulty: Difficulty;
  active: boolean;
  created_at: string;
}

const DIFF_COLOR: Record<Difficulty, string> = {
  easy:   "bg-emerald-900/30 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-900/30 text-amber-400 border-amber-500/30",
  hard:   "bg-red-900/30 text-red-400 border-red-500/30",
};

const WC_SEED: { country_name: string; flag_emoji: string; difficulty: Difficulty }[] = [
  { country_name: "Brazil",       flag_emoji: "🇧🇷", difficulty: "easy"   },
  { country_name: "France",       flag_emoji: "🇫🇷", difficulty: "easy"   },
  { country_name: "Germany",      flag_emoji: "🇩🇪", difficulty: "easy"   },
  { country_name: "Spain",        flag_emoji: "🇪🇸", difficulty: "easy"   },
  { country_name: "Argentina",    flag_emoji: "🇦🇷", difficulty: "easy"   },
  { country_name: "England",      flag_emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", difficulty: "easy"   },
  { country_name: "Portugal",     flag_emoji: "🇵🇹", difficulty: "easy"   },
  { country_name: "Netherlands",  flag_emoji: "🇳🇱", difficulty: "easy"   },
  { country_name: "Italy",        flag_emoji: "🇮🇹", difficulty: "easy"   },
  { country_name: "USA",          flag_emoji: "🇺🇸", difficulty: "easy"   },
  { country_name: "Mexico",       flag_emoji: "🇲🇽", difficulty: "easy"   },
  { country_name: "Japan",        flag_emoji: "🇯🇵", difficulty: "easy"   },
  { country_name: "South Korea",  flag_emoji: "🇰🇷", difficulty: "easy"   },
  { country_name: "Australia",    flag_emoji: "🇦🇺", difficulty: "easy"   },
  { country_name: "Canada",       flag_emoji: "🇨🇦", difficulty: "easy"   },
  { country_name: "Morocco",      flag_emoji: "🇲🇦", difficulty: "easy"   },
  { country_name: "Colombia",     flag_emoji: "🇨🇴", difficulty: "medium" },
  { country_name: "Senegal",      flag_emoji: "🇸🇳", difficulty: "medium" },
  { country_name: "Croatia",      flag_emoji: "🇭🇷", difficulty: "medium" },
  { country_name: "Denmark",      flag_emoji: "🇩🇰", difficulty: "medium" },
  { country_name: "Switzerland",  flag_emoji: "🇨🇭", difficulty: "medium" },
  { country_name: "Belgium",      flag_emoji: "🇧🇪", difficulty: "medium" },
  { country_name: "Poland",       flag_emoji: "🇵🇱", difficulty: "medium" },
  { country_name: "Turkey",       flag_emoji: "🇹🇷", difficulty: "medium" },
  { country_name: "Ukraine",      flag_emoji: "🇺🇦", difficulty: "medium" },
  { country_name: "Ecuador",      flag_emoji: "🇪🇨", difficulty: "medium" },
  { country_name: "Uruguay",      flag_emoji: "🇺🇾", difficulty: "medium" },
  { country_name: "Chile",        flag_emoji: "🇨🇱", difficulty: "medium" },
  { country_name: "Serbia",       flag_emoji: "🇷🇸", difficulty: "medium" },
  { country_name: "Hungary",      flag_emoji: "🇭🇺", difficulty: "medium" },
  { country_name: "Greece",       flag_emoji: "🇬🇷", difficulty: "medium" },
  { country_name: "Saudi Arabia", flag_emoji: "🇸🇦", difficulty: "medium" },
  { country_name: "Panama",       flag_emoji: "🇵🇦", difficulty: "hard"   },
  { country_name: "Honduras",     flag_emoji: "🇭🇳", difficulty: "hard"   },
  { country_name: "Jamaica",      flag_emoji: "🇯🇲", difficulty: "hard"   },
  { country_name: "Costa Rica",   flag_emoji: "🇨🇷", difficulty: "hard"   },
  { country_name: "El Salvador",  flag_emoji: "🇸🇻", difficulty: "hard"   },
  { country_name: "Paraguay",     flag_emoji: "🇵🇾", difficulty: "hard"   },
  { country_name: "Bolivia",      flag_emoji: "🇧🇴", difficulty: "hard"   },
  { country_name: "Venezuela",    flag_emoji: "🇻🇪", difficulty: "hard"   },
  { country_name: "Cameroon",     flag_emoji: "🇨🇲", difficulty: "hard"   },
  { country_name: "Mali",         flag_emoji: "🇲🇱", difficulty: "hard"   },
  { country_name: "DR Congo",     flag_emoji: "🇨🇩", difficulty: "hard"   },
  { country_name: "Albania",      flag_emoji: "🇦🇱", difficulty: "hard"   },
  { country_name: "Slovakia",     flag_emoji: "🇸🇰", difficulty: "hard"   },
  { country_name: "Georgia",      flag_emoji: "🇬🇪", difficulty: "hard"   },
  { country_name: "Iraq",         flag_emoji: "🇮🇶", difficulty: "hard"   },
  { country_name: "New Zealand",  flag_emoji: "🇳🇿", difficulty: "hard"   },
];

export default function AdminFlagQuizPage() {
  const [flags, setFlags] = useState<FlagEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDiff, setFilterDiff] = useState<"all" | Difficulty>("all");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FlagEntry | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [formDiff, setFormDiff] = useState<Difficulty>("medium");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<FlagEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const loadFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/flag-quiz");
      const data = await res.json();
      if (data.success) setFlags(data.flags);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFlags(); }, [loadFlags]);

  const openCreate = () => {
    setEditing(null);
    setFormName(""); setFormEmoji(""); setFormDiff("medium"); setFormActive(true); setFormError("");
    setShowModal(true);
  };

  const openEdit = (f: FlagEntry) => {
    setEditing(f);
    setFormName(f.country_name); setFormEmoji(f.flag_emoji); setFormDiff(f.difficulty); setFormActive(f.active); setFormError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmoji.trim()) { setFormError("Name and emoji are required"); return; }
    setSaving(true); setFormError("");
    try {
      const url = editing ? `/api/admin/flag-quiz/${editing.id}` : "/api/admin/flag-quiz";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryName: formName.trim(), flagEmoji: formEmoji.trim(), difficulty: formDiff, active: formActive }),
      });
      const data = await res.json();
      if (data.success) { setShowModal(false); await loadFlags(); }
      else setFormError(data.error ?? "Save failed");
    } catch { setFormError("Network error"); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (f: FlagEntry) => {
    try {
      await fetch(`/api/admin/flag-quiz/${f.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !f.active }),
      });
      setFlags((prev) => prev.map((x) => x.id === f.id ? { ...x, active: !x.active } : x));
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/flag-quiz/${deleteTarget.id}`, { method: "DELETE" });
      setFlags((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  const handleSeedWC = async () => {
    setSeeding(true); setSeedMsg("");
    const existing = new Set(flags.map((f) => f.country_name.toLowerCase()));
    let added = 0;
    for (const entry of WC_SEED) {
      if (existing.has(entry.country_name.toLowerCase())) continue;
      try {
        const res = await fetch("/api/admin/flag-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryName: entry.country_name, flagEmoji: entry.flag_emoji, difficulty: entry.difficulty }),
        });
        if (res.ok) added++;
      } catch { /* ignore */ }
    }
    await loadFlags();
    setSeedMsg(added > 0 ? `✅ Added ${added} nations` : "✅ All WC 2026 nations already present");
    setSeeding(false);
    setTimeout(() => setSeedMsg(""), 4000);
  };

  const displayed = filterDiff === "all" ? flags : flags.filter((f) => f.difficulty === filterDiff);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="headline-md font-black text-on-surface flex items-center gap-2">
            <Flag className="w-6 h-6 text-primary" /> Flag Quiz
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">{flags.length} flags · {flags.filter((f) => f.active).length} active</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedWC}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-sm text-on-surface transition-all disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "🌍"}
            Seed WC 2026
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Flag
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-semibold">
          {seedMsg}
        </div>
      )}

      {/* Difficulty filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "easy", "medium", "hard"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setFilterDiff(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              filterDiff === d
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            {d === "all" ? `All (${flags.length})` : `${d.charAt(0).toUpperCase() + d.slice(1)} (${flags.filter((f) => f.difficulty === d).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No flags yet. Seed WC 2026 nations to get started.</p>
        </div>
      ) : (
        <div className="surface-glass-1 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-widest">Flag</th>
                <th className="px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-widest">Country</th>
                <th className="px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-widest hidden sm:table-cell">Difficulty</th>
                <th className="px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-widest">Active</th>
                <th className="px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((f, i) => (
                <tr key={f.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                  <td className="px-4 py-3 text-3xl">{f.flag_emoji}</td>
                  <td className="px-4 py-3 font-semibold text-on-surface">{f.country_name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${DIFF_COLOR[f.difficulty]}`}>
                      {f.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(f)} className="transition-opacity hover:opacity-80">
                      {f.active
                        ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                        : <ToggleLeft className="w-6 h-6 text-white/30" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container w-full max-w-md rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-on-surface">{editing ? "Edit Flag" : "Add Flag"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">Country Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Brazil"
                  className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">Flag Emoji</label>
                <input
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  placeholder="e.g. 🇧🇷"
                  className="w-full bg-surface-container-low border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
                {formEmoji && <div className="mt-2 text-5xl text-center">{formEmoji}</div>}
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormDiff(d)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        formDiff === d ? DIFF_COLOR[d] : "border-white/10 bg-white/5 text-white/40"
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/70">Active</span>
                <button type="button" onClick={() => setFormActive((v) => !v)}>
                  {formActive
                    ? <ToggleRight className="w-7 h-7 text-emerald-400" />
                    : <ToggleLeft className="w-7 h-7 text-white/30" />}
                </button>
              </div>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white/70">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-surface-container w-full max-w-sm rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-black text-on-surface">Delete Flag?</h2>
            <p className="text-sm text-white/60">Remove <span className="text-white font-semibold">{deleteTarget.flag_emoji} {deleteTarget.country_name}</span> from the quiz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white/70">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
