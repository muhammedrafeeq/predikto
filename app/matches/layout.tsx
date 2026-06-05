import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matches",
  description: "View all FIFA World Cup 2026 matches and submit your score predictions. Open fixtures, upcoming games, and results.",
  openGraph: {
    title: "FIFA World Cup 2026 Matches | Skorio",
    description: "View all FIFA World Cup 2026 matches and submit your score predictions.",
  },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
