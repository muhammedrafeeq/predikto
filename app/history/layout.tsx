import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prediction History",
  description: "View your past predictions and results on Skorio.",
  alternates: { canonical: "https://www.skorio.in/history" },
  robots: { index: false, follow: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
