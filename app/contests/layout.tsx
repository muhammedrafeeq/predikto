import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contests",
  description: "Create or join FIFA World Cup 2026 prediction contests with friends. Compete in private leagues.",
  openGraph: {
    title: "Prediction Contests | Skorio",
    description: "Create or join FIFA World Cup 2026 prediction contests with friends.",
  },
};

export default function ContestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
