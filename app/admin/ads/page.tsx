"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, LayoutGrid, Layers, Maximize2, SidebarOpen, Zap, MousePointerClick, Image, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";

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
  { key: "ad_social_bar", label: "Social Bar", size: "Responsive", type: "Global", placement: "Sticky bottom — all pages", icon: Layers, color: "text-violet-400" },
  { key: "ad_popunder", label: "Popunder", size: "Full screen", type: "Global", placement: "Triggers on first click — all pages", icon: MousePointerClick, color: "text-rose-400" },
  { key: "ad_native_banner", label: "Native Banner", size: "Auto", type: "In-feed", placement: "Between match/contest cards", icon: LayoutGrid, color: "text-sky-400" },
  { key: "ad_medium_rectangle", label: "Medium Rectangle", size: "300×250", type: "In-feed", placement: "Matches page — after 3rd card", icon: Image, color: "text-emerald-400" },
  { key: "ad_leaderboard", label: "Leaderboard", size: "728×90", type: "Desktop only", placement: "Matches + Leaderboard — below header", icon: Monitor, color: "text-amber-400" },
  { key: "ad_full_banner", label: "Full Banner", size: "468×60", type: "All screens", placement: "Contests page — below header", icon: LayoutGrid, color: "text-indigo-400" },
  { key: "ad_mobile_banner", label: "Mobile Banner", size: "320×50", type: "Mobile only", placement: "Matches page — bottom strip", icon: Smartphone, color: "text-pink-400" },
  { key: "ad_wide_skyscraper", label: "Wide Skyscraper", size: "160×600", type: "Desktop only", placement: "Desktop sidebar", icon: SidebarOpen, color: "text-cyan-400" },
  { key: "ad_half_page", label: "Half Page", size: "160×300", type: "Desktop only", placement: "Desktop sidebar", icon: Maximize2, color: "text-orange-400" },
  { key: "ad_interstitial", label: "Interstitial", size: "300×250", type: "Overlay", placement: "After prediction submission", icon: Zap, color: "text-yellow-400" },
  { key: "ad_hilltop_banner", label: "HillTopAds Banner", size: "Responsive", type: "Global", placement: "All pages — injected by HillTopAds", icon: Monitor, color: "text-lime-400" },
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
        if (data.success) {
          // ensure all AD_UNITS keys are present, defaulting to true
          const merged: Record<string, boolean> = {};
          for (const u of AD_UNITS) merged[u.key] = true;
          setSettings({ ...merged, ...data.settings });
        }
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
      // revert on error
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
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${unit.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{unit.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase tracking-wider">
                        {unit.size}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        unit.type === "Global" ? "bg-violet-500/10 border border-violet-500/20 text-violet-400" :
                        unit.type === "Mobile only" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" :
                        unit.type === "Desktop only" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                        unit.type === "Overlay" ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" :
                        "bg-white/5 border border-white/10 text-white/40"
                      }`}>
                        {unit.type}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-0.5 truncate">{unit.placement}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggle(unit.key)}
                    disabled={isSaving}
                    className="shrink-0 cursor-pointer transition-transform active:scale-90"
                    aria-label={`Toggle ${unit.label}`}
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

                {/* Enabled status bar */}
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
