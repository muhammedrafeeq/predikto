"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Team {
  id: number;
  name: string;
  code: string;
  flag_emoji: string;
}

interface PlayerCardAdmin {
  id: number;
  team_id: number;
  player_name: string;
  position: string;
  jersey_number: number;
  rarity: string;
  overall_rating: number;
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    defending: number;
  };
  team_name: string;
  flag_emoji: string;
}

export default function AdminCardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [cards, setCards] = useState<PlayerCardAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();

  // Filters
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Single Card Creation State
  const [teamId, setTeamId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [position, setPosition] = useState("MID");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [rarity, setRarity] = useState("common");
  const [overallRating, setOverallRating] = useState("");
  const [pace, setPace] = useState("");
  const [shooting, setShooting] = useState("");
  const [passing, setPassing] = useState("");
  const [defending, setDefending] = useState("");
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Bulk Import State
  const [bulkJson, setBulkJson] = useState("");
  const [submittingBulk, setSubmittingBulk] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load teams list (from collection API)
      const collRes = await fetch("/api/collection");
      if (collRes.ok) {
        const collData = await collRes.json();
        setTeams(collData.teams || []);
      }

      // 2. Load admin cards list
      await loadFilteredCards();
    } catch (err: any) {
      setError("Failed to load cards metadata.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredCards = async () => {
    try {
      let url = "/api/admin/cards?";
      if (filterTeamId) url += `teamId=${filterTeamId}&`;
      if (filterRarity) url += `rarity=${filterRarity}&`;
      if (filterSearch) url += `search=${encodeURIComponent(filterSearch)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load cards database");
      const data = await res.json();
      setCards(data.cards || []);
    } catch (e: any) {
      console.error(e);
      setError("Error updating cards list.");
    }
  };

  useEffect(() => {
    loadFilteredCards();
  }, [filterTeamId, filterRarity, filterSearch]);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingSingle(true);

    const cardPayload = {
      teamId: parseInt(teamId, 10),
      playerName,
      position,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : null,
      rarity,
      overallRating: parseInt(overallRating, 10),
      stats: {
        pace: parseInt(pace, 10) || 50,
        shooting: parseInt(shooting, 10) || 50,
        passing: parseInt(passing, 10) || 50,
        defending: parseInt(defending, 10) || 50,
      },
    };

    try {
      const res = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create card");
      }

      setSuccess(`Card for ${playerName} created successfully!`);
      setPlayerName("");
      setJerseyNumber("");
      setOverallRating("");
      setPace("");
      setShooting("");
      setPassing("");
      setDefending("");
      
      await loadFilteredCards();
    } catch (err: any) {
      setError(err.message || "Error creating card.");
    } finally {
      setSubmittingSingle(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmittingBulk(true);

    try {
      const parsed = JSON.parse(bulkJson);
      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error("JSON must contain a 'cards' array of player objects");
      }

      const res = await fetch("/api/admin/cards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: parsed.cards }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed bulk import");
      }

      const data = await res.json();
      setSuccess(`Successfully bulk imported ${data.count} player cards!`);
      setBulkJson("");
      
      await loadFilteredCards();
    } catch (err: any) {
      setError(err.message || "Invalid JSON format or network error.");
    } finally {
      setSubmittingBulk(false);
    }
  };

  const handleSeedFromPlayers = async () => {
    const confirmSeed = window.confirm(
      "WARNING: This will delete ALL existing player cards, user card collections, drops, and trades in the database and regenerate them from the players table. Are you sure you want to proceed?"
    );
    if (!confirmSeed) return;

    setError("");
    setSuccess("");
    setSeeding(true);

    try {
      const res = await fetch("/api/admin/cards/seed", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to seed cards database");
      }

      setSuccess(data.message || "Successfully seeded player cards!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Error seeding cards.");
    } finally {
      setSeeding(false);
    }
  };

  // Get statistics
  const totalCount = cards.length;
  const commonCount = cards.filter((c) => c.rarity === "common").length;
  const rareCount = cards.filter((c) => c.rarity === "rare").length;
  const epicCount = cards.filter((c) => c.rarity === "epic").length;
  const legCount = cards.filter((c) => c.rarity === "legendary").length;

  return (
    <div className="min-h-screen text-white bg-base-bg p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
            Admin console
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">
            Player Cards Manager
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedFromPlayers}
            disabled={seeding}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-950 border border-indigo-900 text-indigo-400 hover:bg-indigo-900/40 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {seeding ? "Seeding..." : "Seed from Players"}
          </button>
          <Link
            href="/collection"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:bg-neutral-950 transition-all text-neutral-400 hover:text-white"
          >
            View Collection
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/40 rounded-2xl text-rose-400 text-xs font-semibold text-center w-full">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-emerald-400 text-xs font-semibold text-center w-full">
          {success}
        </div>
      )}

      {/* Grid containing forms and details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Creation Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="surface-glass-1 rounded-2xl border border-neutral-800 p-6">
            <h2 className="text-md font-extrabold uppercase tracking-wider text-indigo-400 mb-4">
              Create Single Player Card
            </h2>
            
            <form onSubmit={handleCreateSingle} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Select Team / Nation
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  required
                  className="bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Choose Nation --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.flag_emoji} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Player Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lionel Messi"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  className="bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="GK">GK (Goalkeeper)</option>
                  <option value="DEF">DEF (Defender)</option>
                  <option value="MID">MID (Midfielder)</option>
                  <option value="FWD">FWD (Forward)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Jersey Number
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className="bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Rarity Tier
                </label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="common">Common (Gray)</option>
                  <option value="rare">Rare (Blue)</option>
                  <option value="epic">Epic (Purple)</option>
                  <option value="legendary">Legendary (Gold)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Overall Rating (1 - 99)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  placeholder="e.g. 88"
                  value={overallRating}
                  onChange={(e) => setOverallRating(e.target.value)}
                  required
                  className="bg-neutral-900/80 border border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Stats Block */}
              <div className="col-span-1 sm:col-span-2 border-t border-neutral-800/80 pt-3 mt-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1 text-center">
                    PACE
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    placeholder="80"
                    value={pace}
                    onChange={(e) => setPace(e.target.value)}
                    className="bg-neutral-900/80 border border-neutral-800 text-center focus:border-indigo-500 focus:outline-none rounded-xl px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1 text-center">
                    SHOOTING
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    placeholder="75"
                    value={shooting}
                    onChange={(e) => setShooting(e.target.value)}
                    className="bg-neutral-900/80 border border-neutral-800 text-center focus:border-indigo-500 focus:outline-none rounded-xl px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1 text-center">
                    PASSING
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    placeholder="78"
                    value={passing}
                    onChange={(e) => setPassing(e.target.value)}
                    className="bg-neutral-900/80 border border-neutral-800 text-center focus:border-indigo-500 focus:outline-none rounded-xl px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1 text-center">
                    DEFENDING
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    placeholder="65"
                    value={defending}
                    onChange={(e) => setDefending(e.target.value)}
                    className="bg-neutral-900/80 border border-neutral-800 text-center focus:border-indigo-500 focus:outline-none rounded-xl px-2 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingSingle}
                  className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer"
                >
                  {submittingSingle ? "Saving..." : "Create Card"}
                </button>
              </div>
            </form>
          </div>

          {/* Cards Inventory List / Table */}
          <div className="surface-glass-1 rounded-2xl border border-neutral-800 p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
              <h2 className="text-md font-extrabold uppercase tracking-wider text-indigo-400">
                Cards Catalog ({cards.length})
              </h2>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterTeamId}
                  onChange={(e) => setFilterTeamId(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-white"
                >
                  <option value="">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.flag_emoji} {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-white"
                >
                  <option value="">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>

                <input
                  type="text"
                  placeholder="Search name..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-white w-24 sm:w-32 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-850 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2">Player</th>
                    <th className="py-2">Nation</th>
                    <th className="py-2 text-center">Pos</th>
                    <th className="py-2 text-center">OVR</th>
                    <th className="py-2 text-center">Rarity</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/20">
                      <td className="py-2.5 font-bold text-neutral-200">
                        {c.player_name} {c.jersey_number && <span className="text-[10px] text-neutral-500">#{c.jersey_number}</span>}
                      </td>
                      <td className="py-2.5 text-neutral-400">
                        {c.flag_emoji} {c.team_name}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-neutral-300">
                        {c.position}
                      </td>
                      <td className="py-2.5 text-center font-bold text-indigo-400">
                        {c.overall_rating}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          c.rarity === "legendary" ? "bg-amber-950 text-amber-400 border border-amber-500" :
                          c.rarity === "epic" ? "bg-purple-950 text-purple-400" :
                          c.rarity === "rare" ? "bg-blue-950 text-blue-400" : "bg-neutral-800 text-neutral-400"
                        }`}>
                          {c.rarity}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {cards.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-zinc-500 uppercase tracking-widest font-black">
                        No cards match filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Bulk Import & Stats */}
        <div className="flex flex-col gap-6">
          {/* Rarities Chart */}
          <div className="surface-glass-1 rounded-2xl border border-neutral-800 p-6">
            <h2 className="text-md font-extrabold uppercase tracking-wider text-indigo-400 mb-4">
              Rarity Distribution
            </h2>

            <div className="flex flex-col gap-3">
              {/* Common */}
              <div className="flex flex-col">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-neutral-400">Common</span>
                  <span>{commonCount} <span className="text-neutral-500 text-[10px]">({totalCount > 0 ? Math.round(commonCount / totalCount * 100) : 0}%)</span></span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-zinc-400" style={{ width: `${totalCount > 0 ? commonCount / totalCount * 100 : 0}%` }} />
                </div>
              </div>

              {/* Rare */}
              <div className="flex flex-col">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-400">Rare</span>
                  <span>{rareCount} <span className="text-neutral-500 text-[10px]">({totalCount > 0 ? Math.round(rareCount / totalCount * 100) : 0}%)</span></span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-blue-500" style={{ width: `${totalCount > 0 ? rareCount / totalCount * 100 : 0}%` }} />
                </div>
              </div>

              {/* Epic */}
              <div className="flex flex-col">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-purple-400">Epic</span>
                  <span>{epicCount} <span className="text-neutral-500 text-[10px]">({totalCount > 0 ? Math.round(epicCount / totalCount * 100) : 0}%)</span></span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-purple-500" style={{ width: `${totalCount > 0 ? epicCount / totalCount * 100 : 0}%` }} />
                </div>
              </div>

              {/* Legendary */}
              <div className="flex flex-col">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-400 font-extrabold">Legendary</span>
                  <span>{legCount} <span className="text-neutral-500 text-[10px]">({totalCount > 0 ? Math.round(legCount / totalCount * 100) : 0}%)</span></span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-amber-400" style={{ width: `${totalCount > 0 ? legCount / totalCount * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Import Box */}
          <div className="surface-glass-1 rounded-2xl border border-neutral-800 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-md font-extrabold uppercase tracking-wider text-indigo-400">
                Bulk Squad Import
              </h2>
              <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                Paste JSON data directly to insert multiple player card definitions into the database simultaneously.
              </p>
            </div>

            <form onSubmit={handleBulkImport} className="flex flex-col gap-3">
              <textarea
                placeholder='{ "cards": [ { "teamId": 1, "playerName": "Edson Álvarez", "position": "MID", "jerseyNumber": 4, "rarity": "rare", "overallRating": 81, "stats": { "pace": 72, "shooting": 68, "passing": 75, "defending": 82 } } ] }'
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                required
                rows={10}
                className="w-full bg-neutral-950 border border-neutral-805 rounded-xl p-3 text-[10px] font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 leading-normal"
              />

              <button
                type="submit"
                disabled={submittingBulk}
                className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer"
              >
                {submittingBulk ? "Importing..." : "Submit Bulk Import"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
