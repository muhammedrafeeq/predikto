"use client";

import React, { useState, useEffect } from "react";
import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function PrivacyPolicy() {
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
        console.error("Failed to load user in privacy policy:", err);
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
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Page Title Header */}
        <section className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 surface-glass-1 border border-primary/20">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Trust & Security</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 text-sm mt-1.5 font-medium">Last updated: June 2026</p>
        </section>

        {/* Policy Content Card */}
        <div className="surface-glass-1 rounded-2xl border border-white/8 p-6 sm:p-8 space-y-8 backdrop-blur-xl shadow-2xl">
          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-violet-400" />
              1. Information We Collect
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Skorio only collects data necessary to operate our prediction platform. This includes:
            </p>
            <ul className="list-disc pl-5 text-white/50 text-xs space-y-1.5 leading-relaxed">
              <li>
                <strong>Profile Information:</strong> Your name and phone number provided at registration to identify your account and score standings.
              </li>
              <li>
                <strong>Predictions & Game Data:</strong> Match outcomes, scores, and custom lineup projections submitted during active contests.
              </li>
              <li>
                <strong>Push Subscriptions:</strong> VAPID authentication keys if you choose to opt-in for push notifications.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-emerald-400" />
              2. Data Protection & Security
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              We prioritize the safety of your information. Account PINs are cryptographically hashed using industry-standard bcrypt algorithms before storing them in our database. Your active sessions are secured using cryptographically signed JSON Web Tokens (JWT).
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-amber-400" />
              3. Cookies & Session Storage
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Skorio uses local HTTP-only session cookies to authenticate user sessions and securely store login state. These cookies do not track your activity on third-party websites. No advertising cookies are placed on your device.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-sky-400" />
              4. Sharing of Data
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Your personal data, leaderboard scores, and prediction history are shared publicly only within joined contest dashboards for competitor rankings. We will never sell, rent, or distribute your details to external marketing agencies or third parties.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <p className="text-white/40 text-xs text-center leading-relaxed">
              If you have any questions or wish to delete your account, please send us a query through our{" "}
              <a href="/contact-us" className="text-primary hover:underline font-bold">
                Contact Page
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
