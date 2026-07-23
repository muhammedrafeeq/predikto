"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Gamepad2, Calendar, Activity } from "lucide-react";

interface BottomNavProps {
  activeTab?: "matches" | "games";
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = activeTab || (pathname?.startsWith("/games") ? "games" : "matches");

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 md:hidden select-none bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-4">
      <button
        onClick={() => router.push("/matches")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-all ${
          currentTab === "matches"
            ? "text-indigo-400 font-black"
            : "text-white/40 hover:text-white/80"
        }`}
      >
        <div className="relative">
          <Calendar className="w-5 h-5" />
          {currentTab === "matches" && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/80" />
          )}
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase">Matches</span>
      </button>

      <button
        onClick={() => router.push("/games")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-full cursor-pointer transition-all ${
          currentTab === "games"
            ? "text-amber-400 font-black"
            : "text-white/40 hover:text-white/80"
        }`}
      >
        <div className="relative">
          <Gamepad2 className="w-5 h-5" />
          {currentTab === "games" && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/80" />
          )}
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase">Games</span>
      </button>
    </nav>
  );
}
