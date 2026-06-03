import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Predikto - FIFA World Cup 2026 Prediction App",
    short_name: "Predikto",
    description: "Predict FIFA World Cup 2026 match outcomes, top scorers, and compete in the leaderboards.",
    start_url: "/matches",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#a855f7",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
