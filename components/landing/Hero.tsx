import { loadContent } from "@/lib/content";
import { Starfield } from "@/components/landing/Starfield";
import { Reveal } from "@/components/shared/Reveal";
import { OpsPanelGlobe } from "@/components/landing/OpsPanelGlobe";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

type HeroFrontmatter = {
  eyebrow?: string;
  headline_line_1?: string;
  headline_line_2?: string;
  headline_line_3?: string;
  headline_line_4?: string;
  headline_line_5?: string;
};

export function Hero() {
  const { frontmatter, body } = loadContent<HeroFrontmatter>("landing/hero.mdx");
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";

  const plainLines = [
    frontmatter.headline_line_1,
    frontmatter.headline_line_2,
    frontmatter.headline_line_3,
  ].filter(Boolean);
  const gradientLines = [
    frontmatter.headline_line_4,
    frontmatter.headline_line_5,
  ].filter(Boolean);

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

      <div className="relative px-6 md:px-12 pt-12 md:pt-20 pb-16 md:pb-20 max-w-7xl mx-auto">
        <div className="hero-grid">
          <div>
            {frontmatter.eyebrow && (
              <Reveal>
                <div className="mb-7">
                  <SectionEyebrow>{frontmatter.eyebrow}</SectionEyebrow>
                </div>
              </Reveal>
            )}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl xl:text-7xl leading-[1.05] tracking-tight text-[var(--color-dark)] mb-8">
              {plainLines.map((line, i) => (
                <Reveal as="span" delay={40 + i * 80} key={`pl-${i}`} className="block">
                  {line}
                </Reveal>
              ))}
              {gradientLines.map((line, i) => (
                <Reveal
                  as="span"
                  delay={40 + (plainLines.length + i) * 80}
                  key={`gl-${i}`}
                  className="block headline-gradient"
                >
                  {line}
                </Reveal>
              ))}
            </h1>
            <div className="max-w-2xl text-base md:text-lg leading-relaxed text-[var(--color-muted-dark)] space-y-4 mb-9">
              {paragraphs.map((p, i) => (
                <Reveal key={i} delay={500 + i * 80}>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={680}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <MagneticButton href={paymentLink}>
                  <span className="glass-button-primary inline-flex items-center justify-center px-7 py-3.5 font-mono text-sm uppercase tracking-[0.12em]">
                    Begin onboarding →
                  </span>
                </MagneticButton>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted-dark)]">
                  <strong className="font-display text-2xl text-[var(--color-dark)] tracking-tight">
                    $49
                  </strong>{" "}
                  <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">
                    one-time · lifetime access
                  </span>
                </p>
              </div>
            </Reveal>

            <Reveal delay={780}>
              <div className="hero-stats">
                <div className="cell">
                  <span className="k">Active builds</span>
                  <span className="v num-tab">
                    1,284 <span className="delta pos">↑ 12%</span>
                  </span>
                </div>
                <div className="cell">
                  <span className="k">Hours saved</span>
                  <span className="v num-tab">
                    9k <span className="delta pos">/ mo</span>
                  </span>
                </div>
                <div className="cell">
                  <span className="k">Anomalies</span>
                  <span className="v num-tab">
                    34 <span className="delta warn">active</span>
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={220}>
            <OpsPanelGlobe />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
