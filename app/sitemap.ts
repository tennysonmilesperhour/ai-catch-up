import type { MetadataRoute } from "next";
import { listPosts } from "@/lib/blog";

// Stable content stamp. Per-page `lastModified` shouldn't be `new Date()`
// at request/build time, because that makes search engines think every URL
// changed on every deploy (it didn't). Bump this constant when the static
// marketing content materially changes; blog posts use their own frontmatter
// date below.
const CONTENT_STAMP = new Date("2026-07-19T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";

  const staticEntries: MetadataRoute.Sitemap = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/preview/dashboard", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/guides/coding", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/glossary", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/thank-you", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/login", priority: 0.3, changeFrequency: "yearly" as const },
    // /setup is now auth- and purchase-gated (middleware), so it is
    // intentionally excluded from the sitemap; crawlers would only hit a
    // redirect to /login.
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: CONTENT_STAMP,
    changeFrequency,
    priority,
  }));

  // Blog posts use their frontmatter date as lastModified, actual signal,
  // not deploy-time. Falls back to build stamp if the date can't be parsed.
  const blogEntries: MetadataRoute.Sitemap = listPosts().map((post) => {
    const parsed = new Date(
      post.date + (post.date.length === 10 ? "T00:00:00Z" : "")
    );
    return {
      url: `${base}/blog/${post.slug}`,
      lastModified: Number.isNaN(parsed.getTime()) ? CONTENT_STAMP : parsed,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...staticEntries, ...blogEntries];
}
