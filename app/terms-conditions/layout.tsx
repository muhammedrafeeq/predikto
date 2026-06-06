import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read Skorio's terms and conditions for using our sports prediction platform.",
  alternates: { canonical: "https://www.skorio.in/terms-conditions" },
};

export default function TermsConditionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
