"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  User,
  PlusCircle,
  FileCheck,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Database,
  Layers,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalMatches: number;
  totalPredictions: number;
  resultedMatches: number;
  totalContests: number;
}

interface ActiveMarket {
  matchId: number;
  teams: string;
  entryCount: number;
  capacityPercent: number;
}

interface ActivityItem {
  userName: string;
  teams: string;
  matchId: number;
  timeText: string;
  league: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMatches: 0,
    totalPredictions: 0,
    resultedMatches: 0,
    totalContests: 0,
  });
  const [activeMarkets, setActiveMarkets] = useState<ActiveMarket[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState("");
  const [allowContestCreation, setAllowContestCreation] = useState(true);
  const [savingSetting, setSavingSetting] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [dashResponse, settingsResponse] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/settings"),
        ]);

        if (dashResponse.ok) {
          const data = await dashResponse.json();
          if (data.success) {
            setStats(data.stats);
            setActiveMarkets(data.activeMarkets);
            setRecentActivity(data.recentActivity);
          }
        }

        if (settingsResponse.ok) {
          const sData = await settingsResponse.json();
          if (sData.success) {
            setAllowContestCreation(sData.settings.allow_contest_creation);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data/settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleToggleContestCreation = async (newValue: boolean) => {
    setAllowContestCreation(newValue);
    setSavingSetting(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "allow_contest_creation", value: newValue ? "true" : "false" }),
      });
      if (!res.ok) {
        // Rollback
        setAllowContestCreation(!newValue);
      }
    } catch {
      // Rollback
      setAllowContestCreation(!newValue);
    } finally {
      setSavingSetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Analytics Dashboard...
        </p>
      </div>
    );
  }

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResetMsg("All predictions, results and scores cleared.");
        setShowResetConfirm(false);
        setTimeout(() => setResetMsg(""), 4000);
      }
    } catch {
      setResetMsg("Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationMsg("Starting database migration...");
    try {
      const res = await fetch("/api/admin/contests-migrate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMigrationMsg("Contest migration completed successfully!");
      } else {
        setMigrationMsg(`Migration failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setMigrationMsg("Failed to connect to migration endpoint.");
    } finally {
      setMigrating(false);
      setTimeout(() => setMigrationMsg(""), 6000);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      trend: "+12%",
      icon: Users,
      colorClass: "text-primary",
    },
    {
      title: "Total Contests",
      value: stats.totalContests.toLocaleString(),
      trend: "Active",
      icon: Layers,
      colorClass: "text-secondary",
    },
    {
      title: "Predictions Submitted",
      value: stats.totalPredictions.toLocaleString(),
      trend: "+1.2k",
      icon: TrendingUp,
      colorClass: "text-tertiary",
    },
    {
      title: "Matches Resulted",
      value: stats.resultedMatches.toLocaleString(),
      trend: "Total",
      icon: CheckCircle,
      colorClass: "text-primary-container",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="headline-lg text-on-surface font-extrabold tracking-tight">Overview</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-6 bg-primary rounded-full" />
          <p className="text-on-surface-variant label-sm uppercase tracking-widest">
            Skorio Admin Terminal
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="surface-glass-1 p-6 rounded-xl flex flex-col gap-2 hover:bg-white/5 hover:border-white/15 transition-all duration-300 transform hover:-translate-y-1 group"
            >
              <div className="flex justify-between items-start">
                <Icon className={`w-6 h-6 ${card.colorClass} group-hover:scale-110 transition-transform duration-300`} />
                <span className="text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {card.trend}
                </span>
              </div>
              <h3 className="text-on-surface-variant label-md font-medium mt-2">{card.title}</h3>
              <p className="text-white headline-lg font-extrabold tracking-tight font-mono">
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity (Left Column, Span 2) */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="headline-md text-on-surface font-bold tracking-tight">Recent Activity</h3>
            <button
              onClick={() => router.push("/admin/matches")}
              className="text-primary label-md font-semibold hover:underline flex items-center gap-1 transition-all"
            >
              View Matches <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="surface-glass-1 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant label-md">
                  No recent predictions submitted.
                </div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/5">
                        <User className="w-5 h-5 text-on-surface-variant" />
                      </div>
                      <div>
                        <p className="label-md text-on-surface">
                          {activity.userName}{" "}
                          <span className="text-on-surface-variant font-normal">predicted</span>{" "}
                          {activity.teams}
                        </p>
                        <p className="label-sm text-on-surface-variant mt-0.5 font-mono text-[11px]">
                          {activity.timeText}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {activity.league}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions & Markets (Right Column) */}
        <section className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <div className="flex flex-col gap-4">
            <h3 className="headline-md text-on-surface font-bold tracking-tight px-1">Quick Actions</h3>

            <button
              onClick={() => router.push("/admin/matches")}
              className="w-full h-16 rounded-xl bg-gradient-to-r from-primary-container to-inverse-primary hover:shadow-[0_0_20px_rgba(139,128,255,0.3)] active:scale-98 flex items-center justify-between px-6 text-on-primary-container label-md font-bold transition-all"
            >
              <span className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5" />
                Schedule New Match
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => router.push("/admin/contests")}
              className="w-full h-16 rounded-xl bg-gradient-to-r from-secondary-container/40 to-secondary/20 border border-secondary/20 hover:shadow-[0_0_20px_rgba(67,223,158,0.2)] active:scale-98 flex items-center justify-between px-6 text-on-surface label-md font-bold transition-all"
            >
              <span className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-secondary" />
                Manage Contests
              </span>
              <ChevronRight className="w-5 h-5 text-secondary/60" />
            </button>

            <button
              onClick={() => router.push("/admin/matches")}
              className="w-full h-16 rounded-xl bg-surface-container-highest border border-white/10 hover:bg-white/5 active:scale-98 flex items-center justify-between px-6 text-on-surface label-md font-bold transition-all"
            >
              <span className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-secondary" />
                Enter Match Results
              </span>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>

            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full h-16 rounded-xl bg-surface-container-highest border border-white/10 hover:bg-white/5 active:scale-98 flex items-center justify-between px-6 text-on-surface label-md font-bold transition-all disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                {migrating ? "Migrating Database..." : "Run Contest Migration"}
              </span>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full h-16 rounded-xl bg-error/5 border border-error/20 hover:bg-error/10 active:scale-98 flex items-center justify-between px-6 text-error label-md font-bold transition-all"
            >
              <span className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                Reset All Data
              </span>
              <ChevronRight className="w-5 h-5 text-error/50" />
            </button>

            {resetMsg && (
              <p className="text-xs text-secondary text-center font-semibold">{resetMsg}</p>
            )}

            {migrationMsg && (
              <p className="text-xs text-primary text-center font-semibold">{migrationMsg}</p>
            )}
          </div>

          {/* System Settings Panel */}
          <div className="surface-glass-1 p-6 rounded-xl flex flex-col gap-4">
            <h3 className="label-md font-extrabold uppercase tracking-widest text-on-surface-variant border-b border-white/5 pb-2">
              System Settings
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="body-md font-semibold text-on-surface">Allow Contest Creation</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  If disabled, standard users cannot create contests.
                </p>
              </div>
              <button
                onClick={() => handleToggleContestCreation(!allowContestCreation)}
                disabled={savingSetting}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  allowContestCreation ? "bg-primary" : "bg-white/10"
                } ${savingSetting ? "opacity-50 cursor-wait" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    allowContestCreation ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Markets Panel */}
          <div className="surface-glass-1 p-6 rounded-xl flex flex-col gap-4">
            <h3 className="label-md font-extrabold uppercase tracking-widest text-on-surface-variant border-b border-white/5 pb-2">
              Active Markets
            </h3>

            <div className="space-y-4">
              {activeMarkets.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No active prediction markets.</p>
              ) : (
                activeMarkets.map((market) => (
                  <div key={market.matchId} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="body-md font-semibold text-on-surface">{market.teams}</span>
                      <span className="text-[10px] font-bold text-secondary uppercase bg-secondary/15 px-2 py-0.5 rounded-full">
                        {market.capacityPercent > 70 ? "High Vol" : "Stable"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-primary-container rounded-full shadow-[0_0_10px_rgba(139,128,255,0.4)]"
                        style={{ width: `${market.capacityPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1 font-mono">
                      <span>{market.entryCount} entries</span>
                      <span>{market.capacityPercent}% Capacity</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm surface-glass-1 rounded-2xl p-6 flex flex-col gap-5 border border-error/20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Reset All Data?</h3>
                <p className="text-xs text-white/50 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              This will permanently delete all <span className="text-white font-semibold">predictions</span>, <span className="text-white font-semibold">results</span>, and <span className="text-white font-semibold">scores</span>, and reset all matches to upcoming status.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white/70 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-3 rounded-xl bg-error/80 hover:bg-error text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {resetting ? "Clearing..." : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
