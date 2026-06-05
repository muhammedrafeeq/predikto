"use client";

import React, { useState, useEffect } from "react";
import { Monitor, ToggleLeft, ToggleRight, RefreshCw, Layers } from "lucide-react";

interface AdUnit {
  key: string;
  label: string;
  size: string;
  type: string;
  placement: string;
  icon: React.ElementType;
  color: string;
}

const AD_UNITS: AdUnit[] = [
  { key: "ad_hilltop_banner",       label: "HillTopAds Banner",       size: "Responsive", type: "Global",   placement: "All pages — injected by HillTopAds",          icon: Monitor, color: "text-lime-400"   },
  { key: "ad_games_hub_300x250",    label: "Games Hub — Rectangle",   size: "300×250",    type: "Adsterra", placement: "Games hub — below game grid",                  icon: Monitor, color: "text-sky-400"    },
  { key: "ad_games_hub_native",     label: "Games Hub — Native",      size: "Native",     type: "Adsterra", placement: "Games hub — below game grid (native)",         icon: Layers,  color: "text-violet-400" },
  { key: "ad_trivia_320x50",        label: "Trivia — Mobile Strip",   size: "320×50",     type: "Adsterra", placement: "Trivia game — under answer options",           icon: Monitor, color: "text-green-400"  },
  { key: "ad_leaderboard_728x90",   label: "Leaderboard — Desktop",   size: "728×90",     type: "Adsterra", placement: "Leaderboard — after podium (desktop only)",    icon: Monitor, color: "text-amber-400"  },
  { key: "ad_leaderboard_300x250",  label: "Leaderboard — Mobile",    size: "300×250",    type: "Adsterra", placement: "Leaderboard — after podium (mobile only)",     icon: Monitor, color: "text-amber-400"  },
  { key: "ad_leaderboard_160x600",  label: "Leaderboard — Sidebar",   size: "160×600",    type: "Adsterra", placement: "Leaderboard — fixed right sidebar (desktop)",  icon: Monitor, color: "text-rose-400"   },
  { key: "ad_contest_160x300",      label: "Contest Detail — Half",   size: "160×300",    type: "Adsterra", placement: "Contest detail page — below contest header",   icon: Monitor, color: "text-teal-400"   },
  { key: "ad_match_result_468x60",  label: "Match Result — Banner",   size: "468×60",     type: "Adsterra", placement: "Match result page — above action buttons",     icon: Monitor, color: "text-indigo-400" },
];

export default function AdsManagerPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: string; enabled: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ads")
      .then((r) => r.json())
      .then((data) => {
        const merged: Record<string, boolean> = {};
        for (const u of AD_UNITS) merged[u.key] = true;
        if (data.success) setSettings({ ...merged, ...data.settings });
        else setSettings(merged);
      })
      .catch(() => {
        const fallback: Record<string, boolean> = {};
        for (const u of AD_UNITS) fallback[u.key] = true;
        setSettings(fallback);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: string) => {
    const newVal = !settings[key];
    setSaving(key);
    setSettings((prev) => ({ ...prev, [key]: newVal }));

    try {
      await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: newVal }),
      });
      setToast({ key, enabled: newVal });
      setTimeout(() => setToast(null), 2500);
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !newVal }));
    } finally {
      setSaving(null);
    }
  };

  const enabledCount = AD_UNITS.filter((u) => settings[u.key] !== false).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-surface-container border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className={`w-2 h-2 rounded-full ${toast.enabled ? "bg-emerald-400" : "bg-rose-400"}`} />
          <span className="text-sm font-semibold text-on-surface">
            {AD_UNITS.find((a) => a.key === toast.key)?.label} {toast.enabled ? "enabled" : "disabled"}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
          <Layers className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Ad Management</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Ad Placements</h1>
        <p className="text-white/40 text-sm mt-1.5">
          Toggle individual ad units on or off. Changes apply instantly for all users.
        </p>
      </div>

      {/* Stats Bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="surface-glass-1 rounded-xl p-4 border border-white/5 text-center">
            <span className="text-2xl font-black text-white">{AD_UNITS.length}</span>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Total Units</p>
          </div>
          <div className="surface-glass-1 rounded-xl p-4 border border-emerald-500/20 text-center">
            <span className="text-2xl font-black text-emerald-400">{enabledCount}</span>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Enabled</p>
          </div>
          <div className="surface-glass-1 rounded-xl p-4 border border-rose-500/20 text-center">
            <span className="text-2xl font-black text-rose-400">{AD_UNITS.length - enabledCount}</span>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Disabled</p>
          </div>
        </div>
      )}

      {/* Ad Units List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {AD_UNITS.map((unit) => {
            const Icon = unit.icon;
            const enabled = settings[unit.key] !== false;
            const isSaving = saving === unit.key;

            return (
              <div
                key={unit.key}
                className={`surface-glass-1 rounded-xl border transition-all duration-200 ${
                  enabled ? "border-white/8" : "border-white/4 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${unit.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{unit.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase tracking-wider">
                        {unit.size}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 uppercase tracking-wider">
                        {unit.type}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">{unit.placement}</p>
                  </div>

                  <button
                    onClick={() => toggle(unit.key)}
                    disabled={isSaving}
                    className="shrink-0 cursor-pointer transition-transform active:scale-90"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-7 h-7 text-white/30 animate-spin" />
                    ) : enabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-white/25" />
                    )}
                  </button>
                </div>

                {enabled && (
                  <div className="mx-4 mb-3 h-0.5 rounded-full bg-gradient-to-r from-emerald-500/30 via-emerald-400/20 to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
