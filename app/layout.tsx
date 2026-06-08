import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { AdProvider } from "@/lib/AdContext";
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
    default: "Skorio — FIFA World Cup 2026 Predictions",
    template: "%s | Skorio",
  },
  description: "Predict FIFA World Cup 2026 match scores, top scorers, and compete on the global leaderboard. Free sports prediction game.",
  keywords: [
    "FIFA World Cup 2026", "World Cup 2026", "world cup predictions", "football predictions",
    "soccer predictions", "match predictor", "sports prediction", "sports quiz", "sports game",
    "cricket prediction", "cricket quiz", "sports leaderboard", "prediction app", "prediction game",
    "formation predictor", "football formation", "first goal predictor", "first goal timer",
    "bracket predictor", "tournament bracket", "score predictor", "exact score prediction",
    "football quiz", "soccer quiz", "sports fantasy", "free prediction game", "football contest",
    "world cup contest", "world cup quiz", "world cup bracket", "world cup leaderboard",
    "man of the match predictor", "football games online", "sports prediction contest",
    "FIFA 2026", "world cup 2026 predictions", "world cup 2026 games", "world cup 2026 bracket",
    "skorio", "predikto", "football prediction app", "soccer prediction app"
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
    title: "Skorio — FIFA World Cup 2026 Predictions",
    description: "Predict FIFA World Cup 2026 match scores, top scorers, and compete on the global leaderboard.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Skorio Logo" }],
  },
  twitter: {
    card: "summary",
    title: "Skorio — FIFA World Cup 2026 Predictions",
    description: "Predict FIFA World Cup 2026 match scores and compete on the global leaderboard.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  other: {
    "3ab35c5b9da6236fff41dc5eca6c57ee4b990300": "3ab35c5b9da6236fff41dc5eca6c57ee4b990300",
    "google-adsense-account": "ca-pub-3775560788605769",
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
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3775560788605769"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="json-ld" type="application/ld+json" strategy="beforeInteractive">{`
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Skorio",
            "url": "${BASE_URL}",
            "description": "Predict FIFA World Cup 2026 match scores, top scorers, and compete on the global leaderboard.",
            "applicationCategory": "SportsApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "author": { "@type": "Organization", "name": "Skorio" }
          }
        `}</Script>
        <AdProvider>
          {children}
          <PwaInstallPrompt />
        </AdProvider>
      </body>
    </html>
  );
}
