import { loadContent, loadJson } from "@/lib/content";
import { resolveCheckout } from "@/lib/checkout";
import { Reveal } from "@/components/shared/Reveal";
// Lazy-loaded client wrapper around the Three.js globe so the ~150KB
// scene doesn't ship in the landing's initial bundle.
import { OpsPanelGlobeClient as OpsPanelGlobe } from "@/components/landing/OpsPanelGlobeClient";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { AutoLearnText, LearnHint } from "@/components/shared/LearnMode";

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
  const checkout = resolveCheckout();
  // Prompt library count tracks Strategy Claude's actual library size
  // so the hero stat stays in sync if the JSON grows.
  const promptsRaw = loadJson<unknown>("admin/prompts.json");
  const promptCount = Array.isArray(promptsRaw)
    ? promptsRaw.length
    : Array.isArray((promptsRaw as { prompts?: unknown[] }).prompts)
      ? (promptsRaw as { prompts: unknown[] }).prompts.length
      : 0;

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
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl xl:text-[5.25rem] leading-[1.02] tracking-[-0.02em] text-[var(--color-dark)] mb-8">
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
                  <p>
                    <AutoLearnText>{p}</AutoLearnText>
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={680}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <LearnHint
                  title="Begin onboarding"
                  body="Goes to the Stripe checkout for the $49 one-time payment. After payment you're redirected to /setup where the 60-minute guided setup begins."
                  more="Set STRIPE_PAYMENT_LINK in Vercel env vars to wire the real checkout. Without it, the button falls back to a copy-only label."
                  side="bottom-right"
                >
                  <MagneticButton href={checkout.href}>
                    <span className="glass-button-primary inline-flex items-center justify-center px-7 py-3.5 font-mono text-sm uppercase tracking-[0.12em]">
                      {checkout.ready ? "Begin onboarding →" : checkout.fallbackLabel}
                    </span>
                  </MagneticButton>
                </LearnHint>
                <LearnHint
                  title="The price"
                  body="$49, paid once. Every future update is included as Claude gains capabilities. No subscription, no tiers, no upsells. 30-day refund, no questions."
                  side="top-left"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted-dark)]">
                    <strong className="font-display text-2xl text-[var(--color-dark)] tracking-tight">
                      $49
                    </strong>{" "}
                    <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">
                      one-time · 30-day refund
                    </span>
                  </p>
                </LearnHint>
              </div>
            </Reveal>

            <Reveal delay={780}>
              <div className="hero-stats">
                <LearnHint
                  title="Setup time"
                  body="The full guided onboarding takes 60 minutes start to finish. Best done in one sitting; pause and resume any time — progress saves locally."
                  side="top-left"
                >
                  <div className="cell">
                    <span className="k">Setup time</span>
                    <span className="v num-tab">
                      60 <span className="delta pos">min · one sitting</span>
                    </span>
                  </div>
                </LearnHint>
                <LearnHint
                  title="Prompt library"
                  body={`${promptCount} prompts across 9 categories, each with a Run button. Strategy Claude maintains and expands the library; updates ship to your workspace automatically.`}
                  side="top-left"
                >
                  <div className="cell">
                    <span className="k">Prompt library</span>
                    <span className="v num-tab">
                      {promptCount} <span className="delta pos">tuned to your voice</span>
                    </span>
                  </div>
                </LearnHint>
                <LearnHint
                  title="Updates"
                  body="Lifetime access means new prompts, new Claude features, and new heuristics ship to your workspace as they're built. No upgrade path; no version lock-in."
                  side="top-right"
                >
                  <div className="cell">
                    <span className="k">Updates</span>
                    <span className="v num-tab">
                      lifetime <span className="delta pos">with Claude</span>
                    </span>
                  </div>
                </LearnHint>
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
