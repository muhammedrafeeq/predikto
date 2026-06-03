"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowRight,
  User,
  PlusCircle,
  FileCheck,
  CheckCircle,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalMatches: number;
  totalPredictions: number;
  resultedMatches: number;
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
  });
  const [activeMarkets, setActiveMarkets] = useState<ActiveMarket[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/admin/dashboard");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.stats);
            setActiveMarkets(data.activeMarkets);
            setRecentActivity(data.recentActivity);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

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

  // Helper to trigger hover transition effects on card icons
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      trend: "+12%",
      icon: Users,
      colorClass: "text-primary",
    },
    {
      title: "Matches Created",
      value: stats.totalMatches.toLocaleString(),
      trend: "+5",
      icon: Calendar,
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
            Predikto Admin Terminal
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
              onClick={() => router.push("/admin/matches")}
              className="w-full h-16 rounded-xl bg-surface-container-highest border border-white/10 hover:bg-white/5 active:scale-98 flex items-center justify-between px-6 text-on-surface label-md font-bold transition-all"
            >
              <span className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-secondary" />
                Enter Match Results
              </span>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>
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
    </div>
  );
}
