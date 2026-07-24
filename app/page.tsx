"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Trophy,
  Gamepad2,
  Calendar,
  Sparkles,
  ArrowRight,
  Activity,
  Zap,
  Globe,
  SlidersHorizontal,
  Flame
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { HomeSkeleton } from "@/components/Skeletons";

interface Match {
  id: string | number;
  status: "live" | "upcoming" | "finished" | string;
  statusDetail?: string;
  matchTime: string;
  teamHome: string;
  teamHomeLogo?: string;
  scoreHome?: number;
  teamAway: string;
  teamAwayLogo?: string;
  scoreAway?: number;
  league?: string;
  round?: string;
}

// Fallback high-impact marquee matches for Instant Visual WOW Factor
const MOCK_VOLT_MATCHES: Match[] = [
  {
    id: "v-live-1",
    status: "live",
    statusDetail: "78'",
    matchTime: new Date().toISOString(),
    teamHome: "MAN CITY",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdsF8Lw5CumtrZAHoGd4ZkkYFJ1M-bI6VrFncQfrDWXfzPRy3cQyIAH9xsuHsmv0HOrprnLA3hUVCZzhhlBL00J6wuWlM6idBw6w5JHKkHIra47C67whWoRmHwWfKHkMmNLmGdYeYQcwCPMO-q89FadtzZfJ5WhUvdBj2u5n5E1fgTn9o3v7VmEXfjq-aqzgjX2RGeb57BznWq8rnJ1kNy1iA4Le_vfejVbI-S2bUBAb1FWhPqpaS3GHIjrBtXYN8PwOMJRbbipS0",
    scoreHome: 2,
    teamAway: "ARSENAL",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOF7cYvg8YjWa0P6IB_bUkDdkL6ZPLgiCo1MPBGQ5cl2dKgPu-ss4s2bE15_k8sSfGgVpsalUErNsCT8yJ7FS7YLIYLSiWkltVMBL8UTzkovwTOV5Ln7nkhzT8CNNjatkM0Q4R1ZKlYrDBbY4Nj-VZqmOoHYZZFc9SW55CC4eN6wxsBujpSFguspC_166pij-ZkPelU3icTl_2eOffSc2Rk-5MYNVyMEjGPvkErxAtwMn8mGJS_t06GMU3at_4TwFrKHblRw-jp5g",
    scoreAway: 1,
    league: "PREMIER LEAGUE",
  },
  {
    id: "v-live-2",
    status: "live",
    statusDetail: "32'",
    matchTime: new Date().toISOString(),
    teamHome: "REAL MADRID",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVtpgAn5jC4fERyPVxxlv4F9Soz6en7KE02RwyN7-Ri1rebwWWJBsRRVprQNUASPNq2h8kuvz_1YZb2rm4-xeoBjn-EKu76pOiRG2j55rOz9UKlafuFAC7lyZzGh08dGBCb3J7uBrUueoVj46DeMb4_nKh6FnfnYo_c_wM6soxTE-v1BuiFnf0l6Ma1WJ6ePY-ZGB5NoGtuIKy6-LA-wP-7KO5D9ZjdLzYbNJxtdD61ksvgbihkQ8vpFzNcLx9tLWv_6HiGPTm02o",
    scoreHome: 0,
    teamAway: "BARCELONA",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4P2HBzTK-Rvh5qa86-qB0sXh8D2bk-ASICNXnHItIEovrvp8s3wDOeTCN-PoJ2JD07QHwbu640RIH8YyFY1EW5H48TY9D5Ly24xQ_jRrgPA-RhKdHj5U4HulxFdehqGOn_wzsP8qXT-zGFP1GrGUSpeefrICHfkBpb2C4EJnln-QvU0cbZ1tFjl1aoFx8AJuGu342jOGaCIL1ez5pq1rofo-gG41dhKNrPMlFsfLi_n5otTA2cO1e8MUFXNb3PtTx4OS57u56Lqk",
    scoreAway: 0,
    league: "LA LIGA",
  },
  {
    id: "v-up-1",
    status: "upcoming",
    statusDetail: "20:00",
    matchTime: new Date(Date.now() + 86400000).toISOString(),
    teamHome: "LIVERPOOL",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3Yze2jBGE3J-XcjielrBl7v8frCA4Lipt2H81-IA2Ya43Cu4mQbxRyXeUe6ufk1ecQ8wBRvPGIAoy1uEUB8lPW5q-VGKUK9gsOXu9JvIRw1sEZvd6wkatCxNyY3YtZ_ct-4Hb45LDbpTZGObY__QH07N_wnvrRC95y3UDPtQjPZJSCk15d4vXCWeufX56cOHPriSHbGdtZfh2SwOG5huBWLDMTFbBtnInwyC4JrF3-PJUhZ4vM_stbERtp_jw3JXvNYPOBAVUI7Y",
    teamAway: "CHELSEA",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2-UmM6_igTGOZTPV702JKJzyrqBD6y8sKfkOp6AM_48OwIhQR0JWyzESJRHxQfeZ_bmSh7hoJPXZ6IM3Nccp7jdTgD-Q1xTDEgqjNRWXPD59pGenC7IuByacmVStlZeHqyX_xaYWricjeLAMvC3I9zcdxVbkzDrv7BrOLI5xpRXLvAxIBgu1AYniEa_sxMbMjlcbYqxeH0vZgLLnK2q5M-6xN2s6roG9otmujPd2KwIHQTPdHupkg_BsvC7VivyznQdjeooCwObI",
    league: "PREMIER LEAGUE",
  },
  {
    id: "v-up-2",
    status: "upcoming",
    statusDetail: "21:45",
    matchTime: new Date(Date.now() + 86400000).toISOString(),
    teamHome: "INTER MILAN",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVMXCrOxj9Z05Y6zq1ZoI1IIvuf5lo3-WGZL7rdGXC80eJ6fwFBmBpRvwCpRXjx6PfZEsq8Jy-vW4psuOOJLoLZMj7Y0mnGffyg1MnecrQwPddz5Sg9Jh6t-fwQ5oqlSmK1dw3w6_eXwfldociVIg_lvr5eaCHS8rTY7tKuf47z_j1MUJZU8IYWlpiJO1S0hohEpBeLGlqRFpGeFMDBmZBDPcUhX1KXx9DGnDzZiyGNC3UES6-kwuJmsmj85AtVcHn_DkldwTNN8w",
    teamAway: "JUVENTUS",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDr41q-QjhCyXyz6rfdYAcHN71krFzA7CuUDb8QmFYkXTHq5fqdYyfVejY4DBaANi0ocaXvNHjt_M8Q04zHOIHpe400A8W-pttA6nLlKi3C8j6xnGuTst02uOC8PfwB0qQ2csDIfzA_24eWCrDG5qwD8B6XidPEYz1Ud0U8H70nPyXkVFYXl2Vb6N467yJlE3N4PQZUQQg7ijkiwreyupk0piNKwwJzesrfZMH-hOVZ8zcE60_o1T4P83uFlJwy6VwUWx4T4sBs6oE",
    league: "SERIE A",
  },
  {
    id: "v-up-3",
    status: "upcoming",
    statusDetail: "15:30",
    matchTime: new Date(Date.now() + 172800000).toISOString(),
    teamHome: "BAYERN",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFUPzR6iE9mQOrl6ivcM2HV7SjN0iQdeSNZV7O4kRGAmqFJpukt7DX3Aot6LBX0K05VgGuHjhUNRxRNR41sFaZwzUg_u-yVk94fdHB62B28i1Vn5-v7vvBBu6DZIbD76kpyNEdw6R_8HPNxBJhdYpnijuYqK6s6Z5hBcVow1SQET3MR0LmtOGXlSz7rqAxP8ZUclSKjsxzsQl_oGuGyWPkE-7zSB7wVjUbp1fNUvQoIB_o9Ukw96RponPmXzD2l5KZSi8RnFnw2q4",
    teamAway: "DORTMUND",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDllYMiWnTqKaAA_9Rw9Hx0-qr2K__ta0UPUOjySEtoNXDWXRrNUc28oz2ml59ObMaMxrcL8b0lJO46TPwsRR4njagafhdsXgtA9LMW7xBtOmrUa1VKCoH2MgAu82m_d36TuGYEm94NVsALzIYwqtk5DndHEeqhvU3_jxzaqo0eSINSNk4RGbox-0ZgMjusvFNwaESOy74AkOzmsANgGhfMU-fr8BM-C2GFnHeGnSUBz1x8ZPSq5w8c2huhymaTwzXC8oIspHW2Ofo",
    league: "BUNDESLIGA",
  },
  {
    id: "v-fin-1",
    status: "finished",
    statusDetail: "FT",
    matchTime: new Date(Date.now() - 86400000).toISOString(),
    teamHome: "BARCELONA",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4P2HBzTK-Rvh5qa86-qB0sXh8D2bk-ASICNXnHItIEovrvp8s3wDOeTCN-PoJ2JD07QHwbu640RIH8YyFY1EW5H48TY9D5Ly24xQ_jRrgPA-RhKdHj5U4HulxFdehqGOn_wzsP8qXT-zGFP1GrGUSpeefrICHfkBpb2C4EJnln-QvU0cbZ1tFjl1aoFx8AJuGu342jOGaCIL1ez5pq1rofo-gG41dhKNrPMlFsfLi_n5otTA2cO1e8MUFXNb3PtTx4OS57u56Lqk",
    scoreHome: 3,
    teamAway: "REAL MADRID",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVtpgAn5jC4fERyPVxxlv4F9Soz6en7KE02RwyN7-Ri1rebwWWJBsRRVprQNUASPNq2h8kuvz_1YZb2rm4-xeoBjn-EKu76pOiRG2j55rOz9UKlafuFAC7lyZzGh08dGBCb3J7uBrUueoVj46DeMb4_nKh6FnfnYo_c_wM6soxTE-v1BuiFnf0l6Ma1WJ6ePY-ZGB5NoGtuIKy6-LA-wP-7KO5D9ZjdLzYbNJxtdD61ksvgbihkQ8vpFzNcLx9tLWv_6HiGPTm02o",
    scoreAway: 2,
    league: "LA LIGA",
  },
  {
    id: "v-fin-2",
    status: "finished",
    statusDetail: "FT",
    matchTime: new Date(Date.now() - 172800000).toISOString(),
    teamHome: "CHELSEA",
    teamHomeLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2-UmM6_igTGOZTPV702JKJzyrqBD6y8sKfkOp6AM_48OwIhQR0JWyzESJRHxQfeZ_bmSh7hoJPXZ6IM3Nccp7jdTgD-Q1xTDEgqjNRWXPD59pGenC7IuByacmVStlZeHqyX_xaYWricjeLAMvC3I9zcdxVbkzDrv7BrOLI5xpRXLvAxIBgu1AYniEa_sxMbMjlcbYqxeH0vZgLLnK2q5M-6xN2s6roG9otmujPd2KwIHQTPdHupkg_BsvC7VivyznQdjeooCwObI",
    scoreHome: 1,
    teamAway: "MAN CITY",
    teamAwayLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdsF8Lw5CumtrZAHoGd4ZkkYFJ1M-bI6VrFncQfrDWXfzPRy3cQyIAH9xsuHsmv0HOrprnLA3hUVCZzhhlBL00J6wuWlM6idBw6w5JHKkHIra47C67whWoRmHwWfKHkMmNLmGdYeYQcwCPMO-q89FadtzZfJ5WhUvdBj2u5n5E1fgTn9o3v7VmEXfjq-aqzgjX2RGeb57BznWq8rnJ1kNy1iA4Le_vfejVbI-S2bUBAb1FWhPqpaS3GHIjrBtXYN8PwOMJRbbipS0",
    scoreAway: 3,
    league: "PREMIER LEAGUE",
  },
];

const LEAGUES_LIST = [
  {
    id: "all",
    code: "ALL",
    name: "All Leagues",
    logo: null,
  },
  {
    id: "epl",
    code: "EPL",
    name: "Premier League",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png",
  },
  {
    id: "laliga",
    code: "LA LIGA",
    name: "La Liga",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
  },
  {
    id: "ucl",
    code: "UCL",
    name: "UEFA Champions League",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png",
  },
  {
    id: "bundes",
    code: "BUNDES",
    name: "Bundesliga",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/10.png",
  },
  {
    id: "seriea",
    code: "SERIE A",
    name: "Serie A",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/12.png",
  },
  {
    id: "ligue1",
    code: "LIGUE 1",
    name: "Ligue 1",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/9.png",
  },
  {
    id: "mls",
    code: "MLS",
    name: "Major League Soccer",
    logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/19.png",
  },
];

export default function VoltScoreHome() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>(MOCK_VOLT_MATCHES);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "finished">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch live matches from API
  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches);
        }
      }
    } catch (e) {
      console.error("Matches load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 10000);
    return () => clearInterval(interval);
  }, [loadMatches]);

  // Interactive mouse glow logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".glass-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
        (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Filter matches by league, search query, & status
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          m.teamHome.toLowerCase().includes(q) ||
          m.teamAway.toLowerCase().includes(q) ||
          (m.league && m.league.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== "all") {
        if (filterStatus === "live" && m.status !== "live") return false;
        if (filterStatus === "finished" && (m.status !== "finished" && m.status !== "completed" && m.status !== "resulted")) return false;
      }

      // League filter
      if (selectedLeague === "all") return true;

      const lg = (m.league || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const sel = selectedLeague.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (sel === "epl") return lg.includes("premier") || lg.includes("eng1") || lg.includes("epl") || lg.includes("english");
      if (sel === "laliga") return lg.includes("laliga") || lg.includes("esp1") || lg.includes("spanish") || lg.includes("spain");
      if (sel === "ucl") return lg.includes("champions") || lg.includes("uefa") || lg.includes("ucl");
      if (sel === "bundes") return lg.includes("bundesliga") || lg.includes("ger1") || lg.includes("german");
      if (sel === "seriea") return lg.includes("seriea") || lg.includes("ita1") || lg.includes("italy") || lg.includes("italian");
      if (sel === "ligue1") return lg.includes("ligue1") || lg.includes("fra1") || lg.includes("french");
      if (sel === "mls") return lg.includes("mls") || lg.includes("majorleague") || lg.includes("usa1");

      return lg.includes(sel);
    });
  }, [matches, selectedLeague, filterStatus, searchQuery]);

  const liveMatches = useMemo(
    () => filteredMatches.filter((m) => m.status === "live"),
    [filteredMatches]
  );

  const upcomingMatches = useMemo(
    () => filteredMatches.filter((m) => m.status === "upcoming" || m.status === "open"),
    [filteredMatches]
  );

  const finishedMatches = useMemo(
    () => filteredMatches.filter((m) => m.status === "finished" || m.status === "completed" || m.status === "resulted"),
    [filteredMatches]
  );

  // Group upcoming matches by day
  const groupedUpcoming = useMemo(() => {
    const groups: { [key: string]: Match[] } = {};
    upcomingMatches.forEach((m) => {
      const d = new Date(m.matchTime);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
      if (d.toDateString() === now.toDateString()) {
        key = "TODAY";
      } else if (d.toDateString() === tomorrow.toDateString()) {
        key = `TOMORROW, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [upcomingMatches]);

  const parseMinuteWidth = (statusDetail?: string) => {
    if (!statusDetail) return 50;
    const match = statusDetail.match(/(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      return Math.min(Math.max((min / 90) * 100, 5), 100);
    }
    return 65;
  };

  return (
    <div className="min-h-screen text-[#e5e2e1] bg-[#0A0A0A] font-body-md selection:bg-[#c3f400] selection:text-[#0A0A0A]">
      {/* Top App Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#131313]/80 border-b border-[#c3f400]/10">
        <div className="flex justify-between items-center px-4 sm:px-6 h-16 w-full max-w-[1200px] mx-auto">
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c3f400]/10 border border-[#c3f400]/30 flex items-center justify-center text-[#c3f400] group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-[#c3f400]" />
            </div>
            <h1 className="font-headline-lg-mobile text-[22px] sm:text-[26px] text-[#c3f400] tracking-wider leading-none">
              SKORIO
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full glass-card hover:border-[#c3f400]/50 text-[#c4c9ac] hover:text-[#c3f400] transition-colors active:scale-95 cursor-pointer"
              title="Search matches or teams"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Search Overlay Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md flex flex-col items-center pt-20 px-4">
          <div className="w-full max-w-[600px] glass-card rounded-2xl p-4 shadow-2xl relative border border-[#c3f400]/30">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <Search className="w-5 h-5 text-[#c3f400]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team, league, or match..."
                className="flex-1 bg-transparent text-white font-body-lg outline-none placeholder:text-[#c4c9ac]/50"
                autoFocus
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-full text-[#c4c9ac] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {searchQuery.trim() && (
              <div className="mt-3 max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                <p className="font-label-mono text-[11px] text-[#c4c9ac] mb-2">
                  RESULTS ({filteredMatches.length})
                </p>
                {filteredMatches.length === 0 ? (
                  <p className="text-center py-6 text-[#c4c9ac] text-sm">No matches found for "{searchQuery}"</p>
                ) : (
                  filteredMatches.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/matches/${m.id}`);
                      }}
                      className="glass-card rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-[#c3f400]/40 transition-colors"
                    >
                      <span className="font-body-md text-[#e5e2e1] truncate">{m.teamHome} vs {m.teamAway}</span>
                      <span className="font-label-caps text-[#c3f400] text-[11px] shrink-0 ml-2">{m.statusDetail || m.status}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className="pt-20 pb-28 px-4 sm:px-6 max-w-[1200px] mx-auto space-y-10">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* Top Leagues Horizontal Scroll Section */}
            <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-label-caps text-[12px] text-[#c4c9ac] tracking-widest uppercase">
              TOP LEAGUES
            </h2>
            {selectedLeague !== "all" && (
              <button
                onClick={() => setSelectedLeague("all")}
                className="font-label-mono text-[11px] text-[#c3f400] hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 select-none">
            {LEAGUES_LIST.map((lg) => {
              const isSelected = selectedLeague === lg.id;

              return (
                <div
                  key={lg.id}
                  onClick={() => setSelectedLeague(lg.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div
                    className={`w-16 h-16 rounded-full glass-card flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? "border-2 border-[#c3f400] bg-[#c3f400]/15 shadow-[0_0_20px_rgba(195,244,0,0.3)] scale-105"
                        : "group-hover:border-[#c3f400]"
                    }`}
                  >
                    {lg.logo ? (
                      <img
                        className="w-10 h-10 object-contain drop-shadow-md"
                        src={lg.logo}
                        alt={lg.name}
                      />
                    ) : (
                      <Globe className={`w-7 h-7 ${isSelected ? "text-[#c3f400]" : "text-[#c4c9ac] group-hover:text-[#c3f400]"}`} />
                    )}
                  </div>
                  <span
                    className={`font-label-mono text-[11px] tracking-wide transition-colors ${
                      isSelected ? "text-[#c3f400] font-bold" : "text-[#c4c9ac] group-hover:text-[#c3f400]"
                    }`}
                  >
                    {lg.code}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Now Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-headline-md text-[20px] text-[#ffffff] tracking-wider uppercase">
                LIVE NOW
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#c3f400] live-pulse shadow-[0_0_12px_#c3f400]" />
                <span className="font-label-mono text-[11px] text-[#c3f400] tracking-wider font-semibold">
                  {liveMatches.length} MATCHES ACTIVE
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(["all", "live", "finished"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-full font-label-caps text-[11px] transition-all cursor-pointer ${
                    filterStatus === st
                      ? "bg-[#c3f400] text-[#0A0A0A] font-bold shadow-[0_0_15px_rgba(195,244,0,0.3)]"
                      : "text-[#c4c9ac] hover:text-[#c3f400] hover:bg-white/5"
                  }`}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state when zero matches match overall */}
          {filterStatus === "all" && liveMatches.length === 0 && finishedMatches.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-[#c4c9ac] mb-8">
              <Activity className="w-8 h-8 text-[#c3f400] mx-auto mb-2 opacity-60 animate-pulse" />
              <p className="font-body-lg text-white">No matches found for the selected league.</p>
              <p className="font-label-mono text-[12px] text-[#c4c9ac] mt-1">
                Try selecting "ALL" leagues to view active or recent games.
              </p>
            </div>
          )}

          {/* Live Matches Section */}
          {(filterStatus === "all" || filterStatus === "live") && (
            <div className="mb-8">
              {filterStatus === "live" && (
                <h2 className="font-headline-md text-[20px] text-[#ffffff] tracking-wider uppercase mb-6">
                  LIVE MATCHES
                </h2>
              )}

              {liveMatches.length === 0 ? (
                filterStatus === "live" && (
                  <div className="glass-card rounded-xl p-8 text-center text-[#c4c9ac]">
                    <Activity className="w-8 h-8 text-[#c3f400] mx-auto mb-2 opacity-60 animate-pulse" />
                    <p className="font-body-lg text-white">No active live matches for this league.</p>
                    <p className="font-label-mono text-[12px] text-[#c4c9ac] mt-1">
                      Check finished results or switch league filters.
                    </p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map((m) => {
                    const widthPercent = parseMinuteWidth(m.statusDetail);

                    return (
                      <div
                        key={m.id}
                        onClick={() => router.push(`/matches/${m.id}`)}
                        className="glass-card rounded-xl p-6 relative overflow-hidden group cursor-pointer hover:border-[#c3f400]/40 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-[#c3f400]/10 text-[#c3f400] px-3 py-1 rounded-full font-label-mono text-[11px] border border-[#c3f400]/30 shadow-[0_0_10px_rgba(195,244,0,0.15)] font-bold">
                            {m.statusDetail || "LIVE"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-label-mono text-[11px] text-[#c4c9ac] tracking-wider uppercase font-semibold">
                              {m.league || "SOCCER"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                          {/* Home Team */}
                          <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                            {m.teamHomeLogo ? (
                              <img
                                className="w-14 h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform"
                                src={m.teamHomeLogo}
                                alt={m.teamHome}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-headline-md text-white">
                                {m.teamHome.slice(0, 2)}
                              </div>
                            )}
                            <span className="font-body-lg text-[17px] text-white leading-tight font-medium uppercase truncate max-w-full">
                              {m.teamHome}
                            </span>
                          </div>

                          {/* Score Arena */}
                          <div className="flex flex-col items-center">
                            <div className="font-display-score text-[48px] md:text-[56px] text-white leading-none flex gap-3 tracking-wider">
                              <span>{m.scoreHome ?? 0}</span>
                              <span className="text-[#c4c9ac]/30">-</span>
                              <span>{m.scoreAway ?? 0}</span>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                            {m.teamAwayLogo ? (
                              <img
                                className="w-14 h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform"
                                src={m.teamAwayLogo}
                                alt={m.teamAway}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-headline-md text-white">
                                {m.teamAway.slice(0, 2)}
                              </div>
                            )}
                            <span className="font-body-lg text-[17px] text-white leading-tight font-medium uppercase truncate max-w-full">
                              {m.teamAway}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#201f1f]">
                          <div
                            className="h-full bg-[#c3f400] transition-all duration-500 shadow-[0_0_10px_#c3f400]"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Completed Matches / Recent Results Section */}
        {(filterStatus === "all" || filterStatus === "finished") && (
          <section className="mb-8">
            <h2 className="font-headline-md text-[20px] text-[#ffffff] tracking-wider uppercase mb-6">
              RECENT RESULTS & COMPLETED MATCHES
            </h2>

            {finishedMatches.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-[#c4c9ac]">
                <Activity className="w-8 h-8 text-[#c3f400] mx-auto mb-2 opacity-60 animate-pulse" />
                <p className="font-body-lg text-white">No finished match results for this league.</p>
                <p className="font-label-mono text-[12px] text-[#c4c9ac] mt-1">
                  Select "ALL" leagues or switch status filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finishedMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => router.push(`/matches/${m.id}`)}
                    className="glass-card rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-[#c3f400]/40 transition-all duration-300 flex flex-col justify-between gap-4 shadow-lg hover:scale-[1.005]"
                  >
                    <div className="flex justify-between items-center text-[11px] font-label-mono text-[#c4c9ac]">
                      <span className="bg-[#c3f400]/10 text-[#c3f400] px-3 py-0.5 rounded-full font-bold border border-[#c3f400]/20">
                        {m.statusDetail || "FT"}
                      </span>
                      <span className="uppercase tracking-wider font-semibold">
                        {m.league || "SOCCER"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      {/* Home Team */}
                      <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                        {m.teamHomeLogo ? (
                          <img
                            className="w-12 h-12 object-contain drop-shadow"
                            src={m.teamHomeLogo}
                            alt={m.teamHome}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                            {m.teamHome.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-body-md text-[16px] text-white font-bold uppercase truncate max-w-full">
                          {m.teamHome}
                        </span>
                      </div>

                      {/* Final Score */}
                      <div className="flex flex-col items-center">
                        <div className="font-display-score text-[42px] text-white leading-none flex gap-3 tracking-wider">
                          <span>{m.scoreHome ?? 0}</span>
                          <span className="text-[#c4c9ac]/30">-</span>
                          <span>{m.scoreAway ?? 0}</span>
                        </div>
                        <span className="font-label-mono text-[10px] text-[#c3f400] mt-1 font-bold tracking-widest uppercase">
                          FINAL RESULT
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                        {m.teamAwayLogo ? (
                          <img
                            className="w-12 h-12 object-contain drop-shadow"
                            src={m.teamAwayLogo}
                            alt={m.teamAway}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                            {m.teamAway.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-body-md text-[16px] text-white font-bold uppercase truncate max-w-full">
                          {m.teamAway}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Interactive Football Games Showcase Banner */}
        <section className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#c3f400]/10 via-[#00e3fd]/10 to-[#c3f400]/5 border border-[#c3f400]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(195,244,0,0.1)] relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#c3f400]/20 border border-[#c3f400]/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(195,244,0,0.2)]">
              <Sparkles className="w-7 h-7 text-[#c3f400]" />
            </div>
            <div>
              <h3 className="font-headline-md text-[22px] text-white uppercase tracking-wider">
                Football Mini-Games Arena
              </h3>
              <p className="font-body-md text-[#c4c9ac] text-[15px] mt-1">
                Penalty Shootout, Football Trivia, Flag Quiz & Who Am I? Challenge your skills!
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/games")}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-[#c3f400] hover:bg-[#abd600] text-[#161e00] font-headline-md text-[16px] tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(195,244,0,0.3)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-[#c3f400]"
          >
            Play Mini-Games <ArrowRight className="w-4 h-4" />
          </button>
        </section>
          </>
        )}
      </main>

      <Footer />
      <BottomNav activeTab="home" />
    </div>
  );
}
