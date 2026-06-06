import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contest",
  description: "View and participate in your FIFA World Cup 2026 prediction contest.",
};

export default function ContestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
