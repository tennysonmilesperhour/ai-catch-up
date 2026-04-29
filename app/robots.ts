import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/preview/dashboard"],
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          // /preview is the post-login locked-tabs page; /preview/dashboard
          // is the public Workspace Pulse playground (allowed above).
          "/preview$",
          "/preview/$",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
