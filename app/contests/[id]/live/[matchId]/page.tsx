"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import LivePredictionBanner from "@/components/LivePredictionBanner";

interface LiveMatchPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

const COUNTRY_FLAGS: Record<string, string> = {
  "mexico": "mx", "south africa": "za", "south korea": "kr", "czech republic": "cz",
  "canada": "ca", "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba",
  "qatar": "qa", "switzerland": "ch", "brazil": "br", "morocco": "ma", "haiti": "ht",
  "scotland": "gb-sct", "usa": "us", "paraguay": "py", "australia": "au", "turkey": "tr",
  "germany": "de", "curaçao": "cw", "curacao": "cw", "ivory coast": "ci", "ecuador": "ec",
  "netherlands": "nl", "japan": "jp", "sweden": "se", "tunisia": "tn", "belgium": "be",
  "egypt": "eg", "iran": "ir", "new zealand": "nz", "spain": "es", "cape verde": "cv",
  "saudi arabia": "sa", "uruguay": "uy", "france": "fr", "senegal": "sn", "iraq": "iq",
  "norway": "no", "argentina": "ar", "algeria": "dz", "austria": "at", "jordan": "jo",
  "portugal": "pt", "dr congo": "cd", "uzbekistan": "uz", "colombia": "co", "england": "gb-eng",
  "croatia": "hr", "ghana": "gh", "panama": "pa", "korea republic": "kr", "czechia": "cz",
  "chile": "cl", "peru": "pe", "serbia": "rs", "cameroon": "cm", "nigeria": "ng",
  "thailand": "th", "slovakia": "sk", "venezuela": "ve", "cuba": "cu",
};

const getFlag = (name: string) => {
  const code = COUNTRY_FLAGS[name.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

export default function ContestLiveMatchPage({ params }: LiveMatchPageProps) {
  const router = useRouter();
  const { id: cid, matchId: mid } = use(params);
  const contestId = parseInt(cid, 10);
  const matchId = parseInt(mid, 10);

  const [match, setMatch] = useState<any>(null);
  const [liveWindows, setLiveWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load match data
  useEffect(() => {
    async function loadMatch() {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) { router.push(`/contests/${contestId}`); return; }
        const data = await res.json();
        if (data.success) setMatch(data.match);
      } catch {
        router.push(`/contests/${contestId}`);
      } finally {
        setLoading(false);
      }
    }
    loadMatch();
  }, [matchId, contestId, router]);

  // Poll live prediction windows
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}/live-prediction`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.windows) {
          setLiveWindows(data.windows.filter((w: any) => w.status === "open"));
        } else {
          setLiveWindows([]);
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  const getPeriodLabel = (m: any) => {
    const period = m.livePeriod ?? m.live_period;
    const clock = m.liveClock ?? m.live_clock;
    if (clock === "Halftime") return "HT";
    if (period === 1) return "1st Half";
    if (period === 2) return "2nd Half";
    return "In Progress";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-bg text-on-surface gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/40 font-mono animate-pulse">Loading Live Match...</p>
      </div>
    );
  }

  if (!match) return null;

  const homeScore = match.liveHomeScore ?? match.live_home_score ?? 0;
  const awayScore = match.liveAwayScore ?? match.live_away_score ?? 0;
  const clock = match.liveClock ?? match.live_clock ?? "00:00";
  const isKnockout = match.isKnockout || match.is_knockout;

  return (
    <div className="min-h-screen bg-base-bg text-on-surface pb-16">
      {/* AppBar */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-3 h-16"
        style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Live · {clock}</span>
        </div>
        <div className="w-16" />
      </header>

      <main className="container mx-auto px-5 pt-20 max-w-lg flex flex-col gap-5">
        {/* Match Card */}
        <section className="relative rounded-2xl overflow-hidden border border-white/8 surface-glass-1 p-5 shadow-xl text-center">
          <div className="flex justify-between items-center mb-4">
            {isKnockout ? (
              <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded border border-violet-500/20">
                Knockout Extras Active
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded border border-slate-500/20">
                Group Stage
              </span>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded">
              {getPeriodLabel(match)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2">
            {/* Home */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shadow-xl bg-white/5 flex items-center justify-center">
                {getFlag(match.teamHome) ? (
                  <img src={getFlag(match.teamHome)!} alt={match.teamHome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xs">{match.teamHome.substring(0, 3).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-black uppercase truncate max-w-20 text-center">{match.teamHome}</span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center px-4">
              <span className="text-5xl font-black font-mono tracking-tight text-white select-none">
                {homeScore} – {awayScore}
              </span>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shadow-xl bg-white/5 flex items-center justify-center">
                {getFlag(match.teamAway) ? (
                  <img src={getFlag(match.teamAway)!} alt={match.teamAway} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-xs">{match.teamAway.substring(0, 3).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-black uppercase truncate max-w-20 text-center">{match.teamAway}</span>
            </div>
          </div>
        </section>

        {/* Live Prediction Cards */}
        {liveWindows.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-violet-400" /> Live Predictions
              </span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
            {liveWindows.map((w) => (
              <LivePredictionBanner
                key={w.id}
                matchId={String(matchId)}
                teamHome={match.teamHome}
                teamAway={match.teamAway}
                window={w}
                onSubmitted={() => {
                  // Refresh windows after submission
                  fetch(`/api/matches/${matchId}/live-prediction`)
                    .then(r => r.json())
                    .then(data => {
                      if (data.success && data.windows) {
                        setLiveWindows(data.windows.filter((win: any) => win.status === "open"));
                      }
                    })
                    .catch(() => {});
                }}
              />
            ))}
          </section>
        ) : (
          <section className="text-center py-16 surface-glass-1 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
            <Zap className="w-10 h-10 text-violet-400/30" />
            <p className="text-sm font-semibold text-white/30">No active live predictions</p>
            <p className="text-xs text-white/20">Predictions will appear here when windows open during the match.</p>
          </section>
        )}
      </main>
    </div>
  );
}
