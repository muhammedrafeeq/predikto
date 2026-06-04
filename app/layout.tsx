import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

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

export const metadata: Metadata = {
  title: "Skorio - FIFA World Cup 2026 Prediction App",
  description: "Predict FIFA World Cup 2026 match outcomes, top scorers, and compete in the leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
