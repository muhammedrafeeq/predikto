"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Question {
  id: number;
  type: "winner" | "score" | "scorer";
  label: string;
  points: number;
}

interface Match {
  id: number;
  teamHome: string;
  teamAway: string;
  matchTime: string;
  status: string;
}

export default function ConfigureQuestions({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const matchId = parseInt(id, 10);

  const [match, setMatch] = useState<Match | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch match details from entries API
        const matchRes = await fetch(`/api/admin/matches/${matchId}/entries`);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          if (matchData.success) {
            setMatch(matchData.match);
          }
        }

        // Fetch questions
        const questionsRes = await fetch(`/api/admin/matches/${matchId}/questions`);
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          if (questionsData.success) {
            setQuestions(questionsData.questions);
          }
        }
      } catch (err) {
        console.error("Failed to load match questions:", err);
        setErrorMsg("Failed to load match details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [matchId]);

  const handleUpdateQuestion = (index: number, field: "label" | "points", value: string | number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx === index) {
          return {
            ...q,
            [field]: field === "points" ? parseInt(value as string, 10) || 0 : value,
          };
        }
        return q;
      })
    );
  };

  const handleSaveQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validate
    for (const q of questions) {
      if (!q.label.trim()) {
        setErrorMsg("All questions must have a label");
        setSaving(false);
        return;
      }
      if (q.points <= 0) {
        setErrorMsg("Points must be greater than zero");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/matches/${matchId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Questions updated successfully");
        setTimeout(() => {
          router.push("/admin/matches");
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to save questions");
      }
    } catch (err) {
      console.error("Save questions error:", err);
      setErrorMsg("Internal server error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Loading Question Config...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back CTA */}
      <button
        onClick={() => router.push("/admin/matches")}
        className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors label-md select-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Match Manager
      </button>

      {/* Header section */}
      <div>
        <h2 className="headline-lg text-on-surface mb-1">Configure Questions</h2>
        {match && (
          <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
            {match.teamHome} vs {match.teamAway}
          </p>
        )}
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error-container/45 text-error rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveQuestions} className="space-y-6">
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="surface-glass-1 p-5 rounded-xl flex flex-col gap-4 relative border-l-4 border-l-primary"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-bold text-primary font-mono">
                  Question {idx + 1} ({q.type})
                </span>
                <span className="text-[10px] text-on-surface-variant uppercase font-mono">
                  Points Weight
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Input Label */}
                <div className="md:col-span-3">
                  <label className="block label-sm text-on-surface-variant mb-1">
                    Question Label
                  </label>
                  <input
                    required
                    value={q.label}
                    onChange={(e) => handleUpdateQuestion(idx, "label", e.target.value)}
                    className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    type="text"
                  />
                </div>

                {/* Points count */}
                <div>
                  <label className="block label-sm text-on-surface-variant mb-1">Points</label>
                  <input
                    required
                    value={q.points}
                    onChange={(e) => handleUpdateQuestion(idx, "points", e.target.value)}
                    className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-mono text-center"
                    type="number"
                    min={1}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(139,128,255,0.3)] rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving Configurations..." : "Save Question Setup"}
        </button>
      </form>
    </div>
  );
}
