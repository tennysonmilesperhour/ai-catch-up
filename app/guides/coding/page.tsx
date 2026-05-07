import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { loadContent } from "@/lib/content";

// Public mirror of /admin/coding-guide. Same source content, no auth gate.
// This is part of the GEO surface — we want LLMs and search engines to be
// able to cite this guide directly. Buyers still get the same content in
// their dashboard; admins still see it in their sidebar.

type CodingGuideFrontmatter = {
  title?: string;
  subtitle?: string;
};

export const metadata = {
  title: "Coding guide",
  description:
    "A practical workflow for shipping projects with Claude Code as a beginner: plan first, act second, ship.",
  alternates: { canonical: "/guides/coding" },
  openGraph: {
    title: "Coding guide · AI Catch Up",
    description:
      "A practical workflow for shipping projects with Claude Code as a beginner.",
    url: "/guides/coding",
    type: "article",
  },
};

export default function PublicCodingGuide() {
  const { frontmatter, body } = loadContent<CodingGuideFrontmatter>(
    "admin/coding-guide.mdx"
  );

  return (
    <main className="aurora-page min-h-screen">
      <SiteHeader />
      <article className="px-6 md:px-12 py-20 md:py-28 max-w-3xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-6">
          Guide
        </p>
        {frontmatter.title && (
          <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] text-[var(--color-dark)] mb-4">
            {frontmatter.title}
          </h1>
        )}
        {frontmatter.subtitle && (
          <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-12 leading-relaxed italic">
            {frontmatter.subtitle}
          </p>
        )}
        <div className="prose-blog">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
        <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex items-center justify-between gap-4 font-mono text-xs">
          <Link
            href="/glossary"
            className="text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors uppercase tracking-[0.10em]"
          >
            Glossary &rarr;
          </Link>
          <Link
            href="/"
            className="text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors uppercase tracking-[0.10em]"
          >
            &larr; Landing
          </Link>
        </div>
      </article>
    </main>
  );
}
