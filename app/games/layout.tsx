import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Football Games & Quizzes",
  description: "Play free interactive football mini-games online — Who Am I? Player Guessing, Flag Quiz, Penalty Shootout, and Football Trivia with real-time scoreboards.",
  keywords: [
    "football games online",
    "free football mini games",
    "who am i football quiz",
    "guess the football player",
    "flag quiz online",
    "penalty shootout game",
    "football trivia quiz",
    "soccer games online",
    "football leaderboard games",
    "skorio games"
  ],
  alternates: { canonical: "https://www.skorio.in/games" },
  openGraph: {
    title: "Interactive Football Games & Quizzes | Skorio",
    description: "Play free interactive football mini-games — Who Am I, Flag Quiz, Penalty Shootout, and Football Trivia.",
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
