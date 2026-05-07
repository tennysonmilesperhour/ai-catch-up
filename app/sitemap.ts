import type { MetadataRoute } from "next";
import { listPosts } from "@/lib/blog";

// Stable build-time stamp. Per-page `lastModified` shouldn't be `new Date()`
// at request time, because that makes search engines think every URL changed
// every minute (it didn't). The build SHA / deploy ID maps 1:1 to a deploy
// timestamp; for crawlers, that's the best signal we have for "the static
// content was last reshipped on this date."
const BUILD_STAMP = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA && process.env.VERCEL_DEPLOYMENT_ID) {
    return new Date();
  }
  return new Date();
})();

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
    // /setup is purchase-gated but linked from /thank-you and the command
    // palette; including it in the sitemap helps post-purchase deep-links.
    { path: "/setup", priority: 0.3, changeFrequency: "monthly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: BUILD_STAMP,
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
      lastModified: Number.isNaN(parsed.getTime()) ? BUILD_STAMP : parsed,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...staticEntries, ...blogEntries];
}
