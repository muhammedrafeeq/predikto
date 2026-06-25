"use client";

import React, { useState } from "react";
import { Zap } from "lucide-react";

interface LiveWindow {
  id: number;
  question: string;
  options?: string[];
}

interface LivePredictionBannerProps {
  matchId: string;
  teamHome: string;
  teamAway: string;
  window: LiveWindow;
  onSubmitted?: () => void;
}

export default function LivePredictionBanner({
  matchId,
  teamHome,
  teamAway,
  window: win,
  onSubmitted,
}: LivePredictionBannerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const options = win.options ?? [teamHome, teamAway, "Draw"];

  const handleSubmit = async (option: string) => {
    if (submitted || loading) return;
    setSelected(option);
    setLoading(true);
    try {
      await fetch(`/api/matches/${matchId}/live-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windowId: win.id, answer: option }),
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
        <span className="text-xs font-black uppercase tracking-widest text-violet-400">Live Prediction</span>
      </div>
      <p className="text-sm font-semibold text-white/90">{win.question}</p>
      {submitted ? (
        <p className="text-xs text-emerald-400 font-bold">✓ Locked in: {selected}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSubmit(opt)}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/8 border border-white/10 text-sm font-semibold text-white hover:bg-white/15 hover:border-white/20 transition-all disabled:opacity-50 text-left"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
