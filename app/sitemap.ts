import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.skorio.in";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/matches`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/games`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms-conditions`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact-us`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
