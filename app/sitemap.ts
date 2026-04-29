import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";
  const now = new Date();
  const publicRoutes = [
    "/",
    "/preview/dashboard",
    "/thank-you",
    "/login",
  ];
  return publicRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path === "/preview/dashboard" ? 0.7 : 0.5,
  }));
}
