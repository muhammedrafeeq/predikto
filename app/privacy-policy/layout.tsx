import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read Skorio's privacy policy to understand how we collect, use, and protect your data.",
  alternates: { canonical: "https://www.skorio.in/privacy-policy" },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
