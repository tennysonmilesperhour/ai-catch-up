import { listPosts } from "@/lib/blog";

// /llms.txt, proposed standard (https://llmstxt.org/) that gives LLM
// crawlers a curated, plain-text directory of the site's most useful
// pages and what they're for. Think of it as a sitemap with semantic
// hints, optimized for retrieval. Served as text/plain.

export const dynamic = "force-static";
export const revalidate = 3600;

function buildBody(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";

  const lines: string[] = [];

  lines.push("# AI Catch Up");
  lines.push("");
  lines.push(
    "> A 60-minute AI onboarding system for the solo entrepreneur or small-team lead who became the de facto AI lead by default. One-time $49 purchase. Lifetime updates."
  );
  lines.push("");
  lines.push(
    "AI Catch Up is a guided product, not a course. The buyer pays $49, completes a five-phase setup (capture, accounts, install, configure, outputs), and walks away with a personalized CLAUDE.md spec, a Nexus map of their tools, a 20-prompt library, a starter repo, and a next-three-moves memo. After the setup ends, the buyer keeps everything; updates ship automatically when Claude releases new capabilities."
  );
  lines.push("");

  lines.push("## Core pages");
  lines.push("");
  lines.push(
    `- [Landing](${base}/): Product overview, the five phases, pricing ($49 one-time), FAQ, and a link to the live preview.`
  );
  lines.push(
    `- [Workspace Pulse preview](${base}/preview/dashboard): Interactive preview of the dashboard buyers get. Sessions, commits, prompts, decisions, hours saved.`
  );
  lines.push(
    `- [Setup welcome](${base}/setup): Entry point to the 60-minute guided setup (gated to buyers, but indexable for context).`
  );
  lines.push(
    `- [Pricing FAQ section](${base}/#faq): Questions buyers ask before purchase. Schema.org FAQPage markup.`
  );
  lines.push("");

  lines.push("## Guides");
  lines.push("");
  lines.push(
    `- [Coding guide](${base}/guides/coding): The plain-language coding guide buyers reference inside the setup. Public mirror so LLMs can cite it.`
  );
  lines.push(
    `- [Glossary](${base}/glossary): Definitions for every term the product uses (CLAUDE.md, Nexus, prompt library, BYOK, MCP, etc.).`
  );
  lines.push("");

  const posts = listPosts();
  if (posts.length > 0) {
    lines.push("## Notebook");
    lines.push("");
    for (const post of posts) {
      const summary = post.summary ? `: ${post.summary}` : "";
      lines.push(`- [${post.title}](${base}/blog/${post.slug})${summary}`);
    }
    lines.push("");
  }

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Sitemap](${base}/sitemap.xml)`);
  lines.push(`- [Notebook index](${base}/blog)`);
  lines.push("");

  return lines.join("\n");
}

export function GET() {
  return new Response(buildBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
