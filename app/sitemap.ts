import { promises as fs } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";
  const now = new Date();
  const publicRoutes = [
    "/",
    "/blog",
    "/preview/dashboard",
    "/thank-you",
    "/login",
    // /setup is gated by purchase but linked from /thank-you and the
    // command palette; including it in the sitemap helps post-purchase
    // search-engine-redirect flows pick it up if anyone deep-links.
    "/setup",
  ];

  // Blog post slugs are derived from the .mdx files in content/blog/. We
  // surface them so search engines can crawl long-form writing alongside
  // the landing page.
  let blogSlugs: string[] = [];
  try {
    const dir = path.join(process.cwd(), "content/blog");
    const entries = await fs.readdir(dir);
    blogSlugs = entries
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    // Missing /content/blog dir is fine; just emit the static routes.
  }

  return [
    ...publicRoutes.map((p) => ({
      url: `${base}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "/" ? 1 : p === "/preview/dashboard" ? 0.7 : 0.5,
    })),
    ...blogSlugs.map((slug) => ({
      url: `${base}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
