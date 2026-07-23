import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/matches", "/games", "/login", "/privacy-policy", "/terms-conditions", "/contact-us"],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.skorio.in/sitemap.xml",
  };
}
