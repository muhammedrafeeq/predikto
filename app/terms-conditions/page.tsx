"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Calendar, CheckSquare, Award, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function TermsConditions() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; points: number; role?: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to load user in terms-conditions:", err);
      }
    }
    loadUser();
  }, []);

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 bg-pitch overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #c6c0ff, transparent)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #43df9e, transparent)" }}
        />
      </div>

      <TopBar
        userName={user?.name}
        userPoints={user?.points}
        userRole={user?.role}
      />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-24">
        {/* Back Button */}
        <button
          onClick={() => router.push("/contests")}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Page Title Header */}
        <section className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 surface-glass-1 border border-primary/20">
            <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Contest Rules</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Terms & Conditions</h1>
          <p className="text-white/40 text-sm mt-1.5 font-medium">Last updated: June 2026</p>
        </section>

        {/* Terms Content Card */}
        <div className="surface-glass-1 rounded-2xl border border-white/8 p-6 sm:p-8 space-y-8 backdrop-blur-xl shadow-2xl">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-violet-400" />
              1. Prediction Deadlines & Timelines
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Predictions for any fixture must be submitted before the countdown deadline, which is set to the match kickoff time.
            </p>
            <ul className="list-disc pl-5 text-white/50 text-xs space-y-1.5 leading-relaxed">
              <li>
                Matches unlock progressively 24 hours before their scheduled kickoff.
              </li>
              <li>
                Once the deadline passes, predictions are locked and cannot be modified or edited.
              </li>
              <li>
                The server time controls all deadlines; client-side variations do not extend deadline access.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              2. Score Grading & Point System
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Point awards are processed by contest administrators based on official game results:
            </p>
            <ul className="list-disc pl-5 text-white/50 text-xs space-y-1.5 leading-relaxed">
              <li>
                <strong>Match Winner:</strong> Predict the winner or draw to earn points.
              </li>
              <li>
                <strong>Exact Scoreline:</strong> Correctly predict the exact score line to earn high points.
              </li>
              <li>
                <strong>Man of the Match:</strong> Correctly predict the outstanding player to receive bonus points.
              </li>
            </ul>
            <p className="text-white/60 text-sm leading-relaxed">
              Grading results are final. Standings are recalculated and populated on contest leaderboards once matches are marked as "resulted" by our staff.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              3. Contest Fair Play & Conduct
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              We promote a clean and friendly competitive environment. Users found exploiting system vulnerabilities, script-submitting mass automated accounts, or engaging in coordinated malicious behaviors will have their accounts immediately terminated and all contest points voided.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <p className="text-white/40 text-xs text-center leading-relaxed">
              By participating in Skorio tournaments, you confirm that you have read, understood, and agreed to these terms. Enjoy the game!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
