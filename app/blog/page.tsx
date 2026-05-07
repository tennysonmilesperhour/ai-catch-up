import Link from "next/link";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { formatDate, listPosts } from "@/lib/blog";

export const metadata = {
  title: "Notebook",
  description:
    "Weekly writing from AI Catch Up, practical notes on AI workflows, prompt patterns, and the de facto AI lead's day.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Notebook · AI Catch Up",
    description:
      "Weekly writing on AI workflows for solo entrepreneurs and small-team leads.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = listPosts();

  return (
    <main className="aurora-page min-h-screen">
      <SiteHeader />
      <div className="px-6 md:px-12 py-20 md:py-28 max-w-3xl mx-auto">
        <p className="label text-[var(--color-terracotta)] mb-6">
          The notebook
        </p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] text-[var(--color-dark)] mb-6">
          Weekly writing.
        </h1>
        <p className="text-lg text-[var(--color-muted-dark)] mb-14 max-w-xl leading-relaxed">
          Each post is the same thing the newsletter sends out, kept here so
          the archive stays readable.
        </p>

        {posts.length === 0 ? (
          <p className="italic text-[var(--color-muted)]">
            Nothing published yet. Subscribe and the next one will land in
            your inbox and here at the same time.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {posts.map((p) => (
              <li key={p.slug} className="py-6 first:pt-0">
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col gap-2 transition-colors"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {formatDate(p.date)}
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-dark)] leading-snug group-hover:text-[var(--color-terracotta)] transition-colors">
                    {p.title}
                  </h2>
                  {p.summary && (
                    <p className="text-[var(--color-muted-dark)] leading-relaxed">
                      {p.summary}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16 pt-8 border-t border-[var(--color-border)]">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.10em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            &larr; Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
