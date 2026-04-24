import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";
  const now = new Date();
  const publicRoutes = ["/", "/thank-you", "/login"];
  return publicRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
