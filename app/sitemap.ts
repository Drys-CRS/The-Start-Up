import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

// Stable dates — only update when content materially changes (avoids
// triggering unnecessary recrawl on every deployment).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: "2026-06-29",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/calculator`,
      lastModified: "2026-06-29",
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/crm-demo`,
      lastModified: "2026-06-29",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/scope-lock`,
      lastModified: "2026-06-29",
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
