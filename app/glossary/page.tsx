import Link from "next/link";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/shared/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/structured-data";

// Public glossary. The same terms LearnMode shows in tooltips on the
// landing page, but flattened to a single SEO/GEO-indexable page so
// LLMs and search engines can cite the definitions directly.

type GlossaryEntry = {
  brief: string;
  more?: string;
  kind?: string;
};

type GlossaryFile = {
  terms: Record<string, GlossaryEntry>;
};

async function loadGlossary(): Promise<GlossaryFile> {
  const path = join(process.cwd(), "content", "glossary.json");
  const raw = await fs.readFile(path, "utf8");
  return JSON.parse(raw) as GlossaryFile;
}

export const metadata = {
  title: "Glossary",
  description:
    "Definitions for every term AI Catch Up uses: CLAUDE.md, Nexus map, prompt library, Workspace Pulse, BYOK, MCP, and more.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "Glossary · AI Catch Up",
    description:
      "Plain-language definitions for AI workspace terms.",
    url: "/glossary",
    type: "article",
  },
};

export default async function GlossaryPage() {
  const data = await loadGlossary();
  const entries = Object.entries(data.terms || {})
    .filter(([key]) => key !== "$schema")
    .sort(([a], [b]) => a.localeCompare(b));

  // DefinedTermSet JSON-LD so LLMs can ingest term/definition pairs
  // structurally rather than scraping. One DefinedTerm per entry, all
  // grouped under a single set.
  const definedTermSet = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${SITE_NAME} Glossary`,
    url: `${SITE_URL}/glossary`,
    hasDefinedTerm: entries.map(([term, def]) => ({
      "@type": "DefinedTerm",
      name: term,
      description: def.brief,
      inDefinedTermSet: `${SITE_URL}/glossary`,
    })),
  };

  return (
    <main className="aurora-page min-h-screen">
      <JsonLd data={definedTermSet} />
      <SiteHeader />
      <div className="px-6 md:px-12 py-20 md:py-28 max-w-3xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-6">
          Glossary
        </p>
        <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] text-[var(--color-dark)] mb-6">
          Every term, in plain language.
        </h1>
        <p className="text-lg text-[var(--color-muted-dark)] mb-14 max-w-2xl leading-relaxed">
          The same definitions LearnMode shows on the landing page, listed
          here for quick reference. {entries.length} terms.
        </p>

        <dl className="flex flex-col divide-y divide-[var(--color-border)]">
          {entries.map(([term, def]) => {
            const id = term
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            return (
              <div key={term} id={id} className="py-6 first:pt-0 scroll-mt-24">
                <dt className="font-serif text-xl md:text-2xl text-[var(--color-dark)] mb-2 leading-snug">
                  {term}
                  {def.kind && (
                    <span className="ml-3 align-middle font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {def.kind}
                    </span>
                  )}
                </dt>
                <dd className="text-[var(--color-muted-dark)] leading-relaxed">
                  {def.brief}
                  {def.more && (
                    <span className="block mt-2 text-[var(--color-muted)] text-[15px]">
                      {def.more}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex items-center justify-between gap-4 font-mono text-xs">
          <Link
            href="/guides/coding"
            className="text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors uppercase tracking-[0.10em]"
          >
            &larr; Coding guide
          </Link>
          <Link
            href="/"
            className="text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors uppercase tracking-[0.10em]"
          >
            Landing &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
