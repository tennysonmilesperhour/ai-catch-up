import { loadContent } from "@/lib/content";

type WhatYouGetItem = {
  number?: string;
  title: string;
  text: string;
};

type WhatYouGetFrontmatter = {
  eyebrow?: string;
  headline?: string;
  items?: WhatYouGetItem[];
};

export function WhatYouGet() {
  const { frontmatter } = loadContent<WhatYouGetFrontmatter>(
    "landing/what-you-get.mdx"
  );
  const items = frontmatter.items || [];

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-16 max-w-3xl">
          {frontmatter.headline}
        </h2>
      )}
      <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {items.map((item, i) => (
          <li key={i} className="flex gap-6">
            <span className="font-mono text-sm text-[var(--color-terracotta)] pt-1 min-w-[2rem]">
              {item.number ?? String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-serif text-xl text-[var(--color-dark)] mb-2">
                {item.title}
              </h3>
              <p className="text-[var(--color-muted-dark)] leading-relaxed">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
