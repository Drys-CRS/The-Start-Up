import { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/site";

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
      url: `${siteUrl}/privacy`,
      lastModified: "2026-09-14",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: "2026-09-14",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: "2026-09-14",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
