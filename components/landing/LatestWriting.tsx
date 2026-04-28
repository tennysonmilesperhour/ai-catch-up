import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";
import { formatDate, listPosts } from "@/lib/blog";

export function LatestWriting() {
  const posts = listPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section className="px-6 md:px-12 py-20 md:py-28 max-w-5xl mx-auto">
      <Reveal>
        <p className="label text-[var(--color-terracotta)] mb-4">
          The notebook
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-4">
          Latest writing.
        </h2>
      </Reveal>
      <Reveal delay={140}>
        <p className="text-lg text-[var(--color-muted-dark)] mb-12 max-w-2xl leading-relaxed">
          One short post a week. Same content as the newsletter, kept here so
          it stays easy to find.
        </p>
      </Reveal>

      <ul className="grid gap-6 md:grid-cols-3">
        {posts.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={200 + i * 60}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block h-full glass-card p-6 transition-colors hover:bg-[rgba(251,191,36,0.04)]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-3">
                {formatDate(p.date)}
              </p>
              <h3 className="font-serif text-xl md:text-2xl text-[var(--color-dark)] mb-3 leading-snug">
                {p.title}
              </h3>
              {p.summary && (
                <p className="text-[var(--color-muted-dark)] leading-relaxed mb-5">
                  {p.summary}
                </p>
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-terracotta)] group-hover:text-[var(--color-dark)] transition-colors">
                Read &rarr;
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={420}>
        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="font-mono text-xs uppercase tracking-[0.10em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            Browse the full archive &rarr;
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
