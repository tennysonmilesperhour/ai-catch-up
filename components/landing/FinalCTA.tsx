import { loadContent } from "@/lib/content";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { Reveal } from "@/components/shared/Reveal";

type FinalCTAFrontmatter = {
  eyebrow?: string;
  headline_line_1?: string;
  headline_line_2?: string;
  subhead?: string;
  button_text?: string;
  footnote?: string;
};

export function FinalCTA() {
  const { frontmatter } = loadContent<FinalCTAFrontmatter>(
    "landing/final-cta.mdx"
  );
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";

  return (
    <section className="final px-6 md:px-12 py-20 md:py-28 max-w-3xl mx-auto text-center">
      {frontmatter.eyebrow && (
        <Reveal>
          <p className="label text-[var(--color-muted-dark)] mb-6">
            {frontmatter.eyebrow}
          </p>
        </Reveal>
      )}
      {(frontmatter.headline_line_1 || frontmatter.headline_line_2) && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-6xl leading-[1.1] text-[var(--color-dark)] mb-6">
            {frontmatter.headline_line_1 && (
              <span className="block">{frontmatter.headline_line_1}</span>
            )}
            {frontmatter.headline_line_2 && (
              <span className="block headline-gradient">
                {frontmatter.headline_line_2}
              </span>
            )}
          </h2>
        </Reveal>
      )}
      {frontmatter.subhead && (
        <Reveal delay={160}>
          <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-10 leading-relaxed">
            {frontmatter.subhead}
          </p>
        </Reveal>
      )}
      <Reveal delay={240}>
        <MagneticButton href={paymentLink}>
          <span className="glass-button-primary inline-flex items-center justify-center px-8 py-4 font-mono text-sm uppercase tracking-[0.08em]">
            {frontmatter.button_text || "Get the onboarding"}
          </span>
        </MagneticButton>
      </Reveal>
      {frontmatter.footnote && (
        <Reveal delay={320}>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted)] mt-6">
            {frontmatter.footnote}
          </p>
        </Reveal>
      )}
    </section>
  );
}
