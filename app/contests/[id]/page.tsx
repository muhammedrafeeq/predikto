"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Trophy, Users, Calendar, LayoutGrid, ArrowLeft, 
  Copy, Check, Shield, ShieldAlert, Sparkles, UserPlus 
} from "lucide-react";
import MatchPredictionContestView from "@/components/MatchPredictionContestView";
import FirstGoalContestView from "@/components/FirstGoalContestView";
import FormationContestView from "@/components/FormationContestView";
import BracketContestView from "@/components/BracketContestView";

interface ContestMetadata {
  id: number;
  name: string;
  gameType: "match_prediction" | "first_goal" | "formation" | "bracket";
  joinCode: string;
  createdAt: string;
  creatorId: number | null;
  tournamentName: string;
  tournamentId: number;
}

interface ContestMember {
  id: number;
  name: string;
  role: string;
  joinedAt: string;
}

interface RankMember {
  id: number;
  name: string;
  points: number;
}

type TabType = "play" | "standings" | "members";

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("play");
  
  const [contest, setContest] = useState<ContestMetadata | null>(null);
  const [members, setMembers] = useState<ContestMember[]>([]);
  const [rankings, setRankings] = useState<RankMember[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isNaN(contestId)) return;

    async function loadContestDetails() {
      try {
        const res = await fetch(`/api/contests/${contestId}`);
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          else router.push("/contests");
          return;
        }

        const data = await res.json();
        if (data.success) {
          setContest(data.contest);
          setMembers(data.members);
        }
      } catch (err) {
        console.error("Failed to load contest", err);
      } finally {
        setLoading(false);
      }
    }
    loadContestDetails();
  }, [contestId, router]);

  // Load standings when Standings tab is selected
  useEffect(() => {
    if (activeTab !== "standings" || isNaN(contestId)) return;

    async function loadStandings() {
      setRankingsLoading(true);
      try {
        const res = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRankings(data.rankings);
          }
        }
      } catch (err) {
        console.error("Failed to load standings", err);
      } finally {
        setRankingsLoading(false);
      }
    }
    loadStandings();
  }, [activeTab, contestId]);

  const handleCopyCode = () => {
    if (!contest) return;
    navigator.clipboard.writeText(contest.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">Loading Contest Room…</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-base-bg text-on-surface">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <p className="text-sm">Contest not found</p>
        <button onClick={() => router.push("/contests")} className="text-primary text-xs underline font-bold">Go back</button>
      </div>
    );
  }

  const gameModeLabel = {
    match_prediction: "Match Predictor",
    first_goal: "First Goal Timer",
    formation: "Formation Predictor",
    bracket: "Tournament Bracket"
  }[contest.gameType];

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 bg-pitch overflow-x-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.push("/contests")} className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white font-black text-sm tracking-wide uppercase truncate max-w-[50%]">
          {contest.name}
        </h1>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/8 text-white transition-colors"
          title="Share join code"
        >
          <span className="tracking-wide">{contest.joinCode}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-secondary" /> : <UserPlus className="w-3.5 h-3.5 text-white/40" />}
        </button>
      </header>

      {/* Main Content viewport */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-20">

        {/* Contest Header Block */}
        <section className="py-4 text-left fade-up">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">
              {gameModeLabel}
            </span>
            <span className="text-[10px] text-white/35 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {contest.tournamentName}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{contest.name}</h2>
          <p className="text-white/40 text-xs mt-1">Share the code <span className="font-mono text-yellow-400 font-bold">{contest.joinCode}</span> to invite other members to this contest.</p>
        </section>

        {/* Navigation Tabs */}
        <section className="mb-6 fade-up">
          <div className="flex border-b border-white/5 text-center">
            {[
              { id: "play", label: "Play Game", count: null },
              { id: "standings", label: "Standings", count: null },
              { id: "members", label: "Members", count: members.length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                    isActive ? "text-primary border-primary" : "text-white/30 border-transparent hover:text-white/50"
                  }`}
                >
                  {tab.label} {tab.count !== null && `(${tab.count})`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tab View Contents */}
        <section className="fade-up" style={{ animationDelay: "0.08s" }}>
          
          {/* PLAY TAB VIEW */}
          {activeTab === "play" && (
            <div>
              {contest.gameType === "match_prediction" && (
                <MatchPredictionContestView contestId={contestId} onNavigate={(path) => router.push(path)} />
              )}
              {contest.gameType === "first_goal" && (
                <FirstGoalContestView contestId={contestId} />
              )}
              {contest.gameType === "formation" && (
                <FormationContestView contestId={contestId} />
              )}
              {contest.gameType === "bracket" && (
                <BracketContestView contestId={contestId} />
              )}
            </div>
          )}

          {/* STANDINGS TAB VIEW */}
          {activeTab === "standings" && (
            <div>
              {rankingsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : rankings.length === 0 ? (
                <div className="text-center py-16 text-white/30 surface-glass-1 border border-white/5 rounded-2xl">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-white" />
                  <p className="text-sm font-semibold">No predictions graded yet.</p>
                  <p className="text-xs mt-1 text-white/20">Standings will populate once matches are graded by the Admin.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Standings Podium for Top 3 */}
                  {rankings.length >= 1 && (
                    <div className="flex items-end justify-center gap-4 pt-6 pb-2">
                      {/* Rank 2 (Silver) */}
                      {rankings[1] && (
                        <div className="flex flex-col items-center gap-1.5 w-24">
                          <div className="w-12 h-12 rounded-full border-2 border-silver bg-silver/10 flex items-center justify-center font-black text-silver text-sm">2</div>
                          <span className="text-[11px] font-bold text-white/80 truncate w-full text-center">{rankings[1].name}</span>
                          <span className="text-[11px] font-black text-silver">{rankings[1].points} pts</span>
                        </div>
                      )}

                      {/* Rank 1 (Gold) */}
                      {rankings[0] && (
                        <div className="flex flex-col items-center gap-1.5 w-28 -translate-y-2">
                          <Trophy className="w-5 h-5 text-gold animate-bounce" />
                          <div className="w-14 h-14 rounded-full border-2 border-gold bg-gold/15 flex items-center justify-center font-black text-gold text-base shadow-[0_0_15px_rgba(255,215,0,0.15)]">1</div>
                          <span className="text-xs font-black text-white truncate w-full text-center">{rankings[0].name}</span>
                          <span className="text-xs font-black text-gold">{rankings[0].points} pts</span>
                        </div>
                      )}

                      {/* Rank 3 (Bronze) */}
                      {rankings[2] && (
                        <div className="flex flex-col items-center gap-1.5 w-24">
                          <div className="w-12 h-12 rounded-full border-2 border-bronze bg-bronze/10 flex items-center justify-center font-black text-bronze text-sm">3</div>
                          <span className="text-[11px] font-bold text-white/80 truncate w-full text-center">{rankings[2].name}</span>
                          <span className="text-[11px] font-black text-bronze">{rankings[2].points} pts</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leaderboard Table List */}
                  <div className="surface-glass-1 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    {rankings.map((member, index) => {
                      const rank = index + 1;
                      const isPodium = rank <= 3;
                      const metallicColor = rank === 1 ? "text-gold" : rank === 2 ? "text-silver" : rank === 3 ? "text-bronze" : "text-white/40";
                      
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${metallicColor} ${isPodium ? "bg-white/[0.03]" : ""}`}>
                              {rank}
                            </span>
                            <span className="text-sm font-bold text-white/90">{member.name}</span>
                          </div>
                          <span className="text-sm font-black text-primary font-mono">{member.points} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB VIEW */}
          {activeTab === "members" && (
            <div className="space-y-3">
              {members.map((member) => {
                const isCreator = contest.creatorId === member.id;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 border border-white/5 rounded-xl surface-glass-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-xs font-black select-none text-white">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{member.name}</p>
                        <p className="text-[10px] text-white/30">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      {isCreator ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/10 border border-amber-400/20 text-amber-400">
                          <Shield className="w-2.5 h-2.5" /> Creator
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-white/45 uppercase tracking-wide">Member</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
