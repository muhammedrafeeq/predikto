"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
}

export default function OnboardingTeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch("/api/collection");
        if (!res.ok) throw new Error("Failed to load teams");
        const data = await res.json();
        setTeams(data.teams || []);
      } catch (err: any) {
        setError("Could not load tournament teams. Please reload.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedTeam) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/favourite-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeam.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save choice");
      }

      // Set cookie or local state indicating onboarding complete, redirect
      router.push("/collection");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-base-bg p-6">
        <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-neutral-800 animate-spin" />
        <p className="mt-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
          Loading Teams...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-base-bg p-6 flex flex-col items-center justify-between pb-10">
      <div className="w-full max-w-2xl text-center mt-6">
        <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-3 py-1 rounded-full font-black tracking-widest uppercase">
          Welcome to Skorio
        </span>
        <h1 className="text-3xl font-black mt-4 tracking-tight">
          CHOOSE YOUR FAVOURITE TEAM
        </h1>
        <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto">
          We will prioritize dropping players from your selected nation to help you complete your first squad! This choice can be changed later.
        </p>

        {/* Search Input */}
        <div className="mt-8 relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search teams (e.g. Mexico, Brazil)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-400 text-xs font-semibold text-center max-w-md w-full">
          {error}
        </div>
      )}

      {/* Grid of Teams */}
      <div className="w-full max-w-2xl my-8 overflow-y-auto max-h-[50vh] p-2 pr-4 scrollbar-thin">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const isSelected = selectedTeam?.id === team.id;
            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`surface-glass-1 rounded-xl p-4 border flex flex-col items-center justify-center gap-3 cursor-pointer select-none transition-all duration-300 hover:scale-[1.03] ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <span className="text-4xl">{team.flag_emoji || "🏳️"}</span>
                <div className="text-center">
                  <p className="font-extrabold text-sm uppercase tracking-wide truncate max-w-[150px]">
                    {team.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                    {team.code}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTeams.length === 0 && (
          <p className="text-center text-zinc-500 text-xs py-10 uppercase tracking-widest font-bold">
            No matching teams found
          </p>
        )}
      </div>

      {/* Footer CTA */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <button
          onClick={handleSubmit}
          disabled={!selectedTeam || submitting}
          className={`w-full py-4 rounded-xl font-bold transition-all text-center tracking-wider text-sm ${
            selectedTeam && !submitting
              ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
              : "bg-neutral-800 text-zinc-500 cursor-not-allowed border border-neutral-900"
          }`}
        >
          {submitting 
            ? "Saving Choice..." 
            : selectedTeam 
              ? `Support ${selectedTeam.name.toUpperCase()}!` 
              : "Select a Team"}
        </button>

        <button
          onClick={() => router.push("/collection")}
          className="text-center text-xs font-semibold text-zinc-500 hover:text-zinc-400 py-1 transition-all cursor-pointer"
        >
          Skip onboarding for now
        </button>
      </div>
    </div>
  );
}
