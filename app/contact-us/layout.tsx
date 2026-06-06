import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Skorio team. We'd love to hear from you.",
  alternates: { canonical: "https://www.skorio.in/contact-us" },
};

export default function ContactUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
