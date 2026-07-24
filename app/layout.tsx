import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import ThemeProvider from "@/components/ThemeProvider";
import LanguageProvider from "@/components/LanguageProvider";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const BASE_URL = "https://www.skorio.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Skorio — Live Football Scores, Match Center & Football Games",
    template: "%s | Skorio",
  },
  description: "Follow live football scores, real-time match center stats, head-to-head records, and play interactive football mini-games including Who Am I, Flag Quiz, Penalty Shootout, and Football Trivia.",
  keywords: [
    "Skorio",
    "live football scores",
    "live soccer scores",
    "football match center",
    "today football matches",
    "live score updates",
    "football H2H stats",
    "football mini games",
    "football games online",
    "who am i football quiz",
    "flag quiz online",
    "penalty shootout game",
    "football trivia quiz",
    "World Cup 2026",
    "Premier League live scores",
    "UEFA Champions League",
    "La Liga live scores",
    "football match stats",
    "free sports games",
    "skorio.in"
  ],
  authors: [{ name: "Skorio" }],
  creator: "Skorio",
  publisher: "Skorio",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Skorio",
    title: "Skorio — Live Football Scores, Match Center & Football Games",
    description: "Follow live football scores, real-time match center stats, head-to-head records, and play interactive football mini-games.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Skorio Logo" }],
  },
  twitter: {
    card: "summary",
    title: "Skorio — Live Football Scores, Match Center & Football Games",
    description: "Follow live football scores, real-time match center stats, head-to-head records, and play interactive football mini-games.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  other: {
    "google-site-verification": "OpmBFVnkW2OQfgrjMq9Xjx6B8h_IUA25fxCDAEgfk3c",
    "msvalidate.01": "F6C1D4E137D25EBDF8BCF8861C265154",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="json-ld" type="application/ld+json" strategy="beforeInteractive">{`
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Skorio",
            "url": "${BASE_URL}",
            "description": "Live football scores, match schedules, and interactive football mini-games.",
            "applicationCategory": "SportsApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "author": { "@type": "Organization", "name": "Skorio" }
          }
        `}</Script>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <PwaInstallPrompt />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
