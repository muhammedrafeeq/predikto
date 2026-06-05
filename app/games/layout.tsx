import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games",
  description: "Play free FIFA World Cup 2026 sports games — bracket predictor, formation predictor, first goal timer, penalty challenge, sports trivia quiz and more.",
  keywords: [
    "sports games online", "world cup 2026 games", "formation predictor", "football formation game",
    "first goal timer", "first goal predictor", "bracket predictor", "world cup bracket game",
    "penalty challenge game", "sports trivia quiz", "football quiz game", "soccer games online",
    "sports prediction games", "who am i football quiz", "world cup trivia",
    "football mini games", "free sports games", "cricket prediction game"
  ],
  openGraph: {
    title: "Free Sports Games | Skorio",
    description: "Play FIFA World Cup 2026 games — formation predictor, first goal timer, bracket builder, sports trivia and more.",
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
