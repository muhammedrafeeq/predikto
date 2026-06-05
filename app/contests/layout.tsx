import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contests",
  description: "Create or join FIFA World Cup 2026 prediction contests with friends. Compete in private leagues, sports quizzes and prediction challenges.",
  keywords: [
    "world cup prediction contest", "football prediction league", "sports prediction contest",
    "private football contest", "sports quiz contest", "world cup 2026 contest",
    "prediction challenge", "football fantasy contest", "sports game contest",
    "world cup fantasy league", "prediction league"
  ],
  alternates: { canonical: "https://www.skorio.in/contests" },
  openGraph: {
    title: "Sports Prediction Contests | Skorio",
    description: "Create or join FIFA World Cup 2026 prediction contests. Compete in private leagues and sports challenges.",
  },
};

export default function ContestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
