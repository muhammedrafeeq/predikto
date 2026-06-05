import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Skorio to start predicting FIFA World Cup 2026 matches and compete on the leaderboard.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
