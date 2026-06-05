import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top FIFA World Cup 2026 prediction game players. Compete globally, earn points for correct predictions and climb the Skorio sports leaderboard.",
  keywords: [
    "sports leaderboard", "world cup 2026 leaderboard", "football prediction leaderboard",
    "prediction game rankings", "sports quiz leaderboard", "top predictors",
    "world cup prediction rankings", "football quiz rankings", "sports contest leaderboard"
  ],
  alternates: { canonical: "https://www.skorio.in/leaderboard" },
  openGraph: {
    title: "Global Sports Leaderboard | Skorio",
    description: "See the top FIFA World Cup 2026 predictors. Earn points and compete globally.",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
