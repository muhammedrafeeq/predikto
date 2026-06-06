"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, ShieldAlert, FileText, Mail, Trophy, User, UserPlus } from "lucide-react";
import NotificationBar from "./NotificationBar";

interface TopBarProps {
  userName?: string;
  userPoints?: number;
  userRole?: string;
  activeTab?: "matches" | "rankings" | "history" | "contests";
}

export default function TopBar({ userName, userPoints, userRole, activeTab }: TopBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 h-16"
        style={{
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left Side: Logo & App Title */}
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => router.push("/")}>
          <img src="/skorio-logo.png" alt="Skorio Logo" className="w-8 h-8 object-contain rounded-lg" />
          <h1 className="text-xl font-extrabold tracking-tighter text-primary">
            SKO<span className="text-white">RIO</span>
          </h1>
        </div>

        {/* Center: Desktop-only Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => router.push("/")}
            className={`label-md transition-colors cursor-pointer ${
              activeTab === "contests" ? "text-primary font-black" : "text-white/60 hover:text-white"
            }`}
          >
            Contests
          </button>
          <button
            onClick={() => router.push("/matches")}
            className={`label-md transition-colors cursor-pointer ${
              activeTab === "matches" ? "text-primary font-black" : "text-white/60 hover:text-white"
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => router.push("/leaderboard")}
            className={`label-md transition-colors cursor-pointer ${
              activeTab === "rankings" ? "text-primary font-black" : "text-white/60 hover:text-white"
            }`}
          >
            Rankings
          </button>
          <button
            onClick={() => router.push("/history")}
            className={`label-md transition-colors cursor-pointer ${
              activeTab === "history" ? "text-primary font-black" : "text-white/60 hover:text-white"
            }`}
          >
            History
          </button>
        </nav>

        {/* Right Side: User stats & Menu trigger */}
        <div className="flex items-center gap-3">
          {userName && (
            <div className="hidden sm:flex flex-col items-end text-right select-none">
              <span className="text-white/90 text-xs font-bold leading-tight">{userName}</span>
              {typeof userPoints === "number" && (
                <span className="text-amber-400 font-extrabold text-[10px] tracking-wide leading-none mt-0.5">
                  {userPoints} PTS
                </span>
              )}
            </div>
          )}

          {/* Bell Icon for match notifications */}
          <NotificationBar />

          {/* User Initials Avatar Icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs select-none shadow-[0_0_12px_rgba(168,85,247,0.3)] border border-white/10"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
          >
            {getInitials(userName)}
          </div>

          {/* Premium Hamburger Menu Trigger Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Slide-in Navigation Menu Drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer Panel content */}
          <div
            className="relative w-64 h-full bg-slate-950/95 border-l border-white/10 flex flex-col shadow-2xl p-6 z-10 animate-slide-in-right"
            style={{
              background: "linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(5,5,10,0.99) 100%)",
            }}
          >
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slide-in-right {
                animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
              }
            `}</style>

            {/* Header: Logo & Close */}
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-2">
                <img src="/skorio-logo.png" alt="Skorio Logo" className="w-7 h-7 object-contain rounded-md" />
                <span className="font-extrabold text-white text-base tracking-tight">SKORIO</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Info section */}
            {userName && (
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl mb-6 shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm select-none border border-white/10"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                >
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate leading-tight">{userName}</p>
                  <p className="text-white/40 text-[10px] mt-0.5 font-bold uppercase tracking-wider">
                    {userRole === "admin" ? "Admin Staff" : userRole === "guest" ? "Guest Player" : "Competitor"}
                  </p>
                </div>
              </div>
            )}

            {/* Menu Links navigation list */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 mb-1">Navigation</span>
              <button
                onClick={() => { setMenuOpen(false); router.push("/"); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                  activeTab === "contests" ? "text-primary bg-primary/5" : "text-white/70 hover:text-white"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Contests Dashboard
              </button>
              <button
                onClick={() => { setMenuOpen(false); router.push("/matches"); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/5 text-left cursor-pointer ${
                  activeTab === "matches" ? "text-primary bg-primary/5" : "text-white/70 hover:text-white"
                }`}
              >
                <User className="w-4 h-4" />
                Matches Predictor
              </button>

              <div className="h-px bg-white/10 my-4" />

              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 mb-1">Information</span>
              <button
                onClick={() => { setMenuOpen(false); router.push("/privacy-policy"); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-violet-400" />
                Privacy Policy
              </button>
              <button
                onClick={() => { setMenuOpen(false); router.push("/terms-conditions"); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-sky-400" />
                Terms & Conditions
              </button>
              <button
                onClick={() => { setMenuOpen(false); router.push("/contact-us"); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                Contact Us
              </button>
            </div>

            {/* Logout / Create Account Footer */}
            <div className="border-t border-white/10 pt-4 mt-auto shrink-0 flex flex-col gap-2">
              {userRole === "guest" && (
                <button
                  onClick={() => { setMenuOpen(false); router.push("/login"); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-200 active:scale-[0.97] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Real Account
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-[0.97] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
