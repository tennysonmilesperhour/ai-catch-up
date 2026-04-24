import { Button } from "@/components/shared/Button";
import { loadContent } from "@/lib/content";

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
    <section className="px-6 md:px-12 py-20 md:py-28 max-w-3xl mx-auto text-center">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {(frontmatter.headline_line_1 || frontmatter.headline_line_2) && (
        <h2 className="font-serif text-3xl md:text-6xl leading-[1.1] text-[var(--color-dark)] mb-6">
          {frontmatter.headline_line_1 && (
            <span className="block">{frontmatter.headline_line_1}</span>
          )}
          {frontmatter.headline_line_2 && (
            <span className="block italic text-[var(--color-terracotta)]">
              {frontmatter.headline_line_2}
            </span>
          )}
        </h2>
      )}
      {frontmatter.subhead && (
        <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-10 leading-relaxed">
          {frontmatter.subhead}
        </p>
      )}
      <Button href={paymentLink} variant="primary">
        {frontmatter.button_text || "Get the onboarding"}
      </Button>
      {frontmatter.footnote && (
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted)] mt-6">
          {frontmatter.footnote}
        </p>
      )}
    </section>
  );
}
