import { loadContent } from "@/lib/content";

type Layer = {
  label: string;
  title: string;
  subtitle: string;
  items: string[];
};

type WhatYouGetFrontmatter = {
  eyebrow?: string;
  headline?: string;
  intro?: string;
  layers?: Layer[];
};

export function WhatYouGet() {
  const { frontmatter } = loadContent<WhatYouGetFrontmatter>(
    "landing/what-you-get.mdx"
  );
  const layers = frontmatter.layers || [];

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-6 max-w-3xl">
          {frontmatter.headline}
        </h2>
      )}
      {frontmatter.intro && (
        <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-16 max-w-3xl leading-relaxed">
          {frontmatter.intro}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {layers.map((layer, i) => (
          <article
            key={i}
            className="bg-[var(--color-surface)]/55 border border-[var(--color-border)] p-6 md:p-8 flex flex-col"
          >
            <p className="label text-[var(--color-terracotta)] mb-4">
              {layer.label}
            </p>
            <h3 className="font-serif text-2xl text-[var(--color-terracotta)] mb-2 leading-tight">
              {layer.title}
            </h3>
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)] mb-6">
              {layer.subtitle}
            </p>
            <ul className="flex flex-col gap-3 text-[var(--color-muted-dark)] leading-relaxed">
              {layer.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span className="text-[var(--color-terracotta)] mt-1.5 shrink-0">
                    &bull;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
