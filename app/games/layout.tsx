import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games",
  description: "Play FIFA World Cup 2026 mini-games — bracket builder, first goal predictor, formation picker and more.",
  openGraph: {
    title: "World Cup Games | Skorio",
    description: "Play FIFA World Cup 2026 mini-games — bracket builder, first goal predictor and more.",
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
