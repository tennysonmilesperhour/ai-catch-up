import { loadContent } from "@/lib/content";
import { Starfield } from "@/components/landing/Starfield";
import { Reveal } from "@/components/shared/Reveal";

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
    <section className="relative overflow-hidden">
      {/* Decorative back layer: starfield + orbital rings */}
      <div className="absolute inset-0 -z-10">
        <Starfield />
        <div className="orbit-stack">
          <div className="orbit orbit-ring" />
          <div className="orbit" />
          <div className="orbit" />
          <div className="orbit" />
        </div>
      </div>

      <div className="relative px-6 md:px-12 pt-24 md:pt-32 pb-16 md:pb-20 max-w-5xl mx-auto">
        {frontmatter.eyebrow && (
          <Reveal>
            <p className="label text-[var(--color-muted-dark)] mb-8">
              {frontmatter.eyebrow}
            </p>
          </Reveal>
        )}
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] tracking-tight text-[var(--color-dark)] mb-10">
          {frontmatter.headline_line_1 && (
            <Reveal as="span" delay={40} className="block">
              {frontmatter.headline_line_1}
            </Reveal>
          )}
          {frontmatter.headline_line_2 && (
            <Reveal as="span" delay={120} className="block">
              {frontmatter.headline_line_2}
            </Reveal>
          )}
          {frontmatter.headline_line_3 && (
            <Reveal as="span" delay={220} className="block italic headline-gradient breath">
              {frontmatter.headline_line_3}
            </Reveal>
          )}
        </h1>
        <div className="max-w-2xl text-lg md:text-xl leading-relaxed text-[var(--color-muted-dark)] space-y-5">
          {paragraphs.map((p, i) => (
            <Reveal key={i} delay={300 + i * 80}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
