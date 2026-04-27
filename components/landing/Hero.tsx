import { loadContent } from "@/lib/content";

type HeroFrontmatter = {
  eyebrow?: string;
  headline_line_1?: string;
  headline_line_2?: string;
  headline_line_3?: string;
};

export function Hero() {
  const { frontmatter, body } = loadContent<HeroFrontmatter>("landing/hero.mdx");
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);

  return (
    <section className="px-6 md:px-12 pt-24 md:pt-32 pb-16 md:pb-20 max-w-5xl mx-auto">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-8">
          {frontmatter.eyebrow}
        </p>
      )}
      <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] tracking-tight text-[var(--color-dark)] mb-10">
        {frontmatter.headline_line_1 && (
          <span className="block">{frontmatter.headline_line_1}</span>
        )}
        {frontmatter.headline_line_2 && (
          <span className="block">{frontmatter.headline_line_2}</span>
        )}
        {frontmatter.headline_line_3 && (
          <span className="block italic text-[var(--color-terracotta)] cosmic-glow">
            {frontmatter.headline_line_3}
          </span>
        )}
      </h1>
      <div className="max-w-2xl text-lg md:text-xl leading-relaxed text-[var(--color-muted-dark)] space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
