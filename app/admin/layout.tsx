"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  LogOut,
  ChevronRight,
  Menu,
  Shield,
  Layers,
  GitBranch,
  MonitorPlay,
  HelpCircle,
  Flag,
  CreditCard,
} from "lucide-react";

interface AdminUser {
  id: number;
  name: string;
  phone: string;
  role: string;
}

// Soccer Ball Icon
const SoccerBallIcon = ({ className = "w-6 h-6 text-primary" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" />
    <path d="M12 22v-3" />
    <path d="M10 5 6 8.5" />
    <path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" />
    <path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" />
    <path d="M16.5 13 12 15" />
    <path d="M12 15v4" />
    <path d="M12 22 8.5 19.5" />
    <path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" />
    <path d="M16.5 13H20" />
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Fetch logged in admin user
  useEffect(() => {
    async function fetchMe() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === "admin") {
            setAdminUser(data.user);
          } else {
            // Not an admin, redirect to matches
            router.push("/matches");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user session:", err);
      }
    }
    fetchMe();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/api/auth/logout", { method: "POST" });
      // If our endpoint is actually /api/auth/logout (without double api prefix)
      // Let's call /api/auth/logout
      const finalRes = res.ok ? res : await fetch("/api/auth/logout", { method: "POST" });
      if (finalRes.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  const navLinks = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Match Manager", href: "/admin/matches", icon: SoccerBallIcon },
    { label: "Contests", href: "/admin/contests", icon: Layers },
    { label: "Bracket Manager", href: "/admin/bracket", icon: GitBranch },
    { label: "User Registry", href: "/admin/users", icon: Users },
    { label: "Ad Manager", href: "/admin/ads", icon: MonitorPlay },
    { label: "Who Am I", href: "/admin/who-am-i", icon: HelpCircle },
    { label: "Flag Quiz", href: "/admin/flag-quiz", icon: Flag },
    { label: "Cards", href: "/admin/cards", icon: CreditCard },
  ];

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface overflow-x-hidden antialiased">
      {/* Background Dots Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="md:hidden p-2 hover:bg-white/5 transition-colors rounded-lg active:scale-95 flex items-center justify-center"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/skorio-logo.png" alt="Skorio Logo" className="w-7 h-7 object-contain rounded-lg" />
            <h1 className="font-display-lg text-[22px] text-primary tracking-tighter leading-none select-none">
              SKO<span className="text-on-surface">RIO</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="label-md text-on-surface">{adminUser?.name || "Chief Analyst"}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
              Admin Panel
            </span>
          </div>
          <div className="w-9 h-9 rounded-full border border-primary/30 p-[1px]">
            <img
              alt="Admin Profile"
              className="w-full h-full rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTBmdPnNfk9QJYc9I1LiN--viUrJDib5HM1L_DChOM538jR_uUDUj1dRpR-mzG5Aeb_AUvuHgA7f0fYjexUK0zVRw2sqn8R93Q89k8-7glSzcbIZ079F5oYim2ZVkzSpDqDMNYMWYM0qWAwgSJxTPkeghwh9Ho5sJFQO3_gAQ4lGkdDy2nU1nRRZUwmt8wBXy12aqx1f3Rgdt9KHyaUaudkY3oZ03qTho92_2QEPASkNFv5HPbZKBOwnkWmQ5lT_u4nFYYxl7ml4xM"
            />
          </div>
        </div>
      </header>

      {/* Side Navigation Drawer (Desktop) */}
      <aside className="fixed left-0 top-0 h-full z-40 py-6 flex flex-col bg-surface-container-lowest/90 backdrop-blur-2xl border-r border-white/10 w-72 hidden md:flex pt-20">
        <div className="px-6 mb-8">
          <h2 className="headline-md text-primary font-bold tracking-tighter">Elite Stats</h2>
          <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest mt-0.5">
            Admin Terminal v2.4.0
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <a
                key={link.label}
                href={link.href}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container font-semibold translate-x-1"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="label-md">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="px-4 mt-auto flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full p-3 rounded-lg text-error hover:bg-error-container/10 border border-transparent hover:border-error-container/20 transition-all label-md cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              Sign Out
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="p-3 border-t border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="label-md text-on-surface">{adminUser?.name || "Chief Analyst"}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Super Admin
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Drawer Overlay for Mobile */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 z-[60] md:hidden transition-opacity duration-300"
        />
      )}

      {/* Slide-out Navigation Drawer (Mobile) */}
      <nav
        className={`fixed left-0 top-0 h-full z-[70] flex flex-col bg-surface-container-lowest border-r border-white/10 w-72 transition-transform duration-300 md:hidden pt-20 ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
              <Shield className="w-5 h-5 text-on-primary-container" />
            </div>
            <div>
              <p className="label-md text-on-surface">{adminUser?.name || "Chief Analyst"}</p>
              <p className="text-[10px] text-on-surface-variant font-mono">v2.4.0 Stable</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-2 flex-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary-container/20 text-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="label-md">{link.label}</span>
              </a>
            );
          })}

          <hr className="border-white/5 my-2 mx-4" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-error hover:bg-error-container/10 rounded-lg transition-colors label-md w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="md:ml-72 pt-24 pb-24 md:pb-8 px-4 md:px-8 min-h-screen">
        {children}
      </main>

      {/* Fixed Responsive Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface/85 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-4 pb-safe select-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <a
              key={link.label}
              href={link.href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <div className={isActive ? "bg-primary-container/20 px-4 py-1 rounded-full mb-0.5" : "py-1 mb-0.5"}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] select-none ${isActive ? "font-bold" : "font-medium"}`}>
                {link.label.split(" ")[0]} {/* Single word label for mobile spacing */}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
