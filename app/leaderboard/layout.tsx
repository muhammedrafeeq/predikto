import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top FIFA World Cup 2026 predictors. Compete globally and climb the Skorio leaderboard.",
  openGraph: {
    title: "Global Leaderboard | Skorio",
    description: "See the top FIFA World Cup 2026 predictors and compete globally.",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
