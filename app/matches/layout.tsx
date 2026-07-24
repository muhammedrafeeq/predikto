import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Football Matches & Scorecard Center",
  description: "Get real-time live football match scores, lineups, match commentary, head-to-head records, and fixtures across Premier League, Champions League, La Liga, and international tournaments.",
  keywords: [
    "live football matches",
    "football scorecard",
    "today match live score",
    "football match center",
    "live match commentary",
    "football head to head stats",
    "premier league live score",
    "champions league fixtures",
    "world cup 2026 matches",
    "real time football stats",
    "football schedule today"
  ],
  alternates: { canonical: "https://www.skorio.in/matches" },
  openGraph: {
    title: "Live Football Matches & Scorecard Center | Skorio",
    description: "Get real-time live football match scores, lineups, match commentary, head-to-head records, and fixtures.",
  },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
