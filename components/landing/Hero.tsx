import { loadContent } from "@/lib/content";
import { Starfield } from "@/components/landing/Starfield";
import { Reveal } from "@/components/shared/Reveal";
import { OpsPanelGlobe } from "@/components/landing/OpsPanelGlobe";
import { MagneticButton } from "@/components/shared/MagneticButton";

type HeroFrontmatter = {
  eyebrow?: string;
  headline_line_1?: string;
  headline_line_2?: string;
  headline_line_3?: string;
};

export function Hero() {
  const { frontmatter, body } = loadContent<HeroFrontmatter>("landing/hero.mdx");
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";

  return (
    <section id="overview" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Starfield />
        <div className="orbit-stack">
          <div className="orbit orbit-ring" />
          <div className="orbit" />
          <div className="orbit" />
          <div className="orbit" />
        </div>
      </div>

      <div className="relative px-6 md:px-12 pt-16 md:pt-24 pb-16 md:pb-20 max-w-6xl mx-auto">
        <div className="hero-grid">
          <div>
            {frontmatter.eyebrow && (
              <Reveal>
                <p className="hero-eyebrow mb-7">
                  <span className="dot" aria-hidden />
                  {frontmatter.eyebrow}
                </p>
              </Reveal>
            )}
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] tracking-tight text-[var(--color-dark)] mb-8">
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
            <div className="max-w-2xl text-base md:text-lg leading-relaxed text-[var(--color-muted-dark)] space-y-4 mb-9">
              {paragraphs.map((p, i) => (
                <Reveal key={i} delay={300 + i * 80}>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={460}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <MagneticButton href={paymentLink}>
                  <span className="glass-button-primary inline-flex items-center justify-center px-7 py-3.5 font-mono text-sm uppercase tracking-[0.08em]">
                    Begin onboarding
                  </span>
                </MagneticButton>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted-dark)]">
                  <strong className="text-[var(--color-dark)]">$49</strong>{" "}
                  one-time, lifetime access
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <OpsPanelGlobe />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
