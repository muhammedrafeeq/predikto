"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, LogIn, ShieldAlert, FileText, Mail, Trophy, User, UserPlus } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useLang } from "./LanguageProvider";

interface TopBarProps {
  userName?: string;
  userPoints?: number;
  userRole?: string;
  activeTab?: "matches" | "rankings" | "history" | "contests";
}

export default function TopBar({ userName, userPoints, userRole, activeTab }: TopBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggle: toggleLang } = useLang();

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
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 h-16"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--header-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => router.push("/")}>
          <img src="/skorio-logo.png" alt="Skorio Logo" className="w-8 h-8 object-contain rounded-lg" />
          <h1 className="text-xl font-extrabold tracking-tighter text-primary">
            SKO<span style={{ color: "var(--nav-link-active)" }}>RIO</span>
          </h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {(["scores", "matches", "games"] as const).map((tab) => {
            const labels: Record<string, string> = {
              scores: "Live Scores", matches: "Matches", games: "Mini-Games",
            };
            const routes: Record<string, string> = {
              scores: "/", matches: "/matches", games: "/games",
            };
            const currentTabKey = activeTab === "matches" ? "matches" : activeTab === "contests" ? "scores" : tab;
            return (
              <button
                key={tab}
                onClick={() => router.push(routes[tab])}
                className="label-md transition-colors cursor-pointer"
                style={{
                  color: currentTabKey === tab ? "var(--color-primary)" : "var(--nav-link-color)",
                  fontWeight: currentTabKey === tab ? 900 : undefined,
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {userName && (
            <div className="hidden sm:flex flex-col items-end text-right select-none">
              <span className="text-xs font-bold leading-tight" style={{ color: "var(--nav-link-active)" }}>
                {userName}
              </span>
            </div>
          )}

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs select-none border border-white/10"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
          >
            {getInitials(userName)}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer"
            style={{ color: "var(--nav-icon-color)" }}
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Slide-in Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-100 flex justify-end">
          <div
            className="absolute inset-0 backdrop-blur-sm transition-opacity duration-300"
            style={{ background: "var(--overlay-bg)" }}
            onClick={() => setMenuOpen(false)}
          />

          <div
            className="relative w-64 h-full flex flex-col shadow-2xl p-6 z-10 animate-slide-in-right"
            style={{
              background: "var(--drawer-bg)",
              borderLeft: "1px solid var(--drawer-border)",
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

            {/* Drawer Header */}
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-2">
                <img src="/skorio-logo.png" alt="Skorio Logo" className="w-7 h-7 object-contain rounded-md" />
                <span className="font-extrabold text-base tracking-tight" style={{ color: "var(--nav-link-active)" }}>
                  SKORIO
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-full transition-colors cursor-pointer"
                style={{ color: "var(--nav-icon-color)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile */}
            {userName && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-6 shrink-0"
                style={{ background: "var(--glass-bg-1)", border: "1px solid var(--glass-border)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm select-none border border-white/10"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                >
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate leading-tight" style={{ color: "var(--nav-link-active)" }}>
                    {userName}
                  </p>
                  <p className="text-[10px] mt-0.5 font-bold uppercase tracking-wider" style={{ color: "var(--nav-link-color)" }}>
                    {userRole === "guest" ? "Guest Fan" : "Football Fan"}
                  </p>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "var(--nav-link-color)", opacity: 0.5 }}>
                Navigation
              </span>

              {[
                { tab: "scores", label: "Live Scores & Fixtures", route: "/", Icon: Trophy },
                { tab: "matches", label: "Match Schedule", route: "/matches", Icon: User },
              ].map(({ tab, label, route, Icon }) => (
                <button
                  key={tab}
                  onClick={() => { setMenuOpen(false); router.push(route); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer"
                  style={{
                    color: activeTab === tab ? "var(--color-primary)" : "var(--nav-link-color)",
                    background: activeTab === tab ? "color-mix(in srgb, var(--color-primary) 8%, transparent)" : undefined,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--nav-hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = activeTab === tab
                    ? "color-mix(in srgb, var(--color-primary) 8%, transparent)" : "transparent")}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              <div className="h-px my-4" style={{ background: "var(--glass-border)" }} />

              <div className="h-px my-2" style={{ background: "var(--glass-border)" }} />

              <span className="text-[9px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "var(--nav-link-color)", opacity: 0.5 }}>
                Information
              </span>

              {[
                { label: "Privacy Policy", route: "/privacy-policy", Icon: FileText, iconColor: "#a78bfa" },
                { label: "Terms & Conditions", route: "/terms-conditions", Icon: ShieldAlert, iconColor: "#38bdf8" },
                { label: "Contact Us", route: "/contact-us", Icon: Mail, iconColor: "#fbbf24" },
              ].map(({ label, route, Icon, iconColor }) => (
                <button
                  key={route}
                  onClick={() => { setMenuOpen(false); router.push(route); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer"
                  style={{ color: "var(--nav-link-color)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--nav-hover-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon className="w-4 h-4" style={{ color: iconColor }} />
                  {label}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-4 mt-auto shrink-0 flex flex-col gap-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
              {userName ? (
                <>
                  {userRole === "guest" && (
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/login"); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-[0.97] cursor-pointer"
                      style={{
                        background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                        borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Real Account
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-[0.97] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); router.push("/login"); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-primary text-on-primary hover:brightness-110 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
