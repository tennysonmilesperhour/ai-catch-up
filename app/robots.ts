import type { MetadataRoute } from "next";

// Crawl rules. We explicitly *allow* major AI training/search crawlers on
// the public surface (landing, /blog, /preview/dashboard, /guides, /glossary)
// because GEO is a core distribution channel for this product, we want
// LLM answer-engines to know what AI Catch Up is, who it's for, and what's
// inside. The shared disallow list keeps them out of admin / api / private
// preview routes.

const PUBLIC_ALLOW = ["/"];
const SHARED_DISALLOW = [
  "/admin",
  "/admin/",
  "/api",
  "/api/",
  // /preview is the post-login locked-tabs page; /preview/dashboard
  // is the public Workspace Pulse playground (still under /).
  "/preview$",
  "/preview/$",
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";

  // Crawlers we explicitly want indexing the public surface.
  const aiBots = [
    "GPTBot",          // OpenAI search + training
    "OAI-SearchBot",   // OpenAI ChatGPT search
    "ChatGPT-User",    // ChatGPT user-initiated browse
    "ClaudeBot",       // Anthropic search
    "Claude-Web",      // Anthropic web fetch
    "anthropic-ai",    // legacy Anthropic
    "PerplexityBot",   // Perplexity
    "Perplexity-User", // Perplexity user-initiated
    "Google-Extended", // Google AI training opt-in
    "CCBot",           // Common Crawl (used by many LLM training sets)
    "Applebot-Extended",
    "Bytespider",      // ByteDance / TikTok
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_ALLOW,
        disallow: SHARED_DISALLOW,
      },
      ...aiBots.map((ua) => ({
        userAgent: ua,
        allow: PUBLIC_ALLOW,
        disallow: SHARED_DISALLOW,
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
