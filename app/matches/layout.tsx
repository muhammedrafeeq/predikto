import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matches",
  description: "Predict FIFA World Cup 2026 match scores, winners and first goal scorers. Submit your exact score predictions and earn points on the leaderboard.",
  keywords: [
    "world cup 2026 matches", "FIFA match predictions", "exact score predictor",
    "football match predictor", "world cup score prediction", "first goal predictor",
    "man of the match predictor", "sports prediction game", "soccer match predictor",
    "world cup 2026 fixtures", "predict football scores"
  ],
  openGraph: {
    title: "FIFA World Cup 2026 Matches | Skorio",
    description: "Predict FIFA World Cup 2026 match scores, winners and first goal scorers. Earn points and climb the leaderboard.",
  },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
