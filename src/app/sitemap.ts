import type { MetadataRoute } from "next";
import { listAllHosts } from "@/lib/host-directory";
import { findListings } from "@/lib/public-listings";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [listings, hosts] = await Promise.all([findListings({ limit: 100 }), listAllHosts()]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/classes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/hosts`, changeFrequency: "weekly", priority: 0.6 },
    ...listings.map((l) => ({
      url: `${base}/classes/${l.slug}`,
      lastModified: l.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...hosts.map((h) => ({ url: `${base}/hosts/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
