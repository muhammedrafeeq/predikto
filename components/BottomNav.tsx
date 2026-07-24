"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Trophy, Newspaper, Gamepad2, User } from "lucide-react";

interface BottomNavProps {
  activeTab?: "home" | "leagues" | "news" | "games" | "profile" | "matches";
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab =
    activeTab === "games" || pathname?.startsWith("/games")
      ? "games"
      : "home";

  const navItems = [
    { id: "home", label: "Home", icon: Home, route: "/" },
    { id: "games", label: "Games", icon: Gamepad2, route: "/games" },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-[#0e0e0e]/90 backdrop-blur-2xl border-t border-[#c3f400]/10 rounded-t-xl">
      <div className="w-full flex justify-around items-center px-4 py-2.5 max-w-container-max mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className={`flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-all duration-200 ${
                isActive
                  ? "text-[#c3f400] font-bold"
                  : "text-[#c4c9ac]/60 hover:text-[#c3f400]/80"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c3f400] shadow-[0_0_8px_#c3f400]" />
                )}
              </div>
              <span className="font-label-mono text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
