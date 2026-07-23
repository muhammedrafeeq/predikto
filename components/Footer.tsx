"use client";

import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, Gamepad2, Trophy, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950/90 border-t border-white/10 text-white/70 py-12 px-4 sm:px-6 mt-16 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-black text-white tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-400 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                S
              </div>
              Skorio
            </Link>
            <p className="text-xs text-white/50 leading-relaxed font-medium">
              Real-time live football scoreboards, minute-by-minute match commentary, schedules, and interactive mini-games.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Navigation</h4>
            <ul className="flex flex-col gap-2 text-xs font-semibold">
              <li>
                <Link href="/matches" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Live Matches
                </Link>
              </li>
              <li>
                <Link href="/games" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> Football Mini-Games
                </Link>
              </li>
              <li>
                <Link href="/games/trivia" className="hover:text-white transition-colors">
                  Football Trivia
                </Link>
              </li>
              <li>
                <Link href="/games/who-am-i" className="hover:text-white transition-colors">
                  Who Am I? Quiz
                </Link>
              </li>
              <li>
                <Link href="/games/flag-quiz" className="hover:text-white transition-colors">
                  Flag Quiz
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Legal & Support</h4>
            <ul className="flex flex-col gap-2 text-xs font-semibold">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Trademark Disclaimer */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Disclaimer
            </h4>
            <p className="text-[11px] text-white/40 leading-relaxed font-medium">
              Skorio is an independent live sports platform. All team names, logos, club crests, and league trademarks belong to their respective owners and are used strictly for identification purposes.
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40 font-medium">
          <div>© {new Date().getFullYear()} Skorio. All rights reserved.</div>
          <div className="flex items-center gap-1 text-[11px]">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" /> for Football Fans
          </div>
        </div>
      </div>
    </footer>
  );
}
