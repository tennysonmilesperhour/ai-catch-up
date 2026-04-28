import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";
import { MagneticButton } from "@/components/shared/MagneticButton";

type AsideRow = { k: string; v: string; small?: string };

type PricingFrontmatter = {
  eyebrow?: string;
  headline?: string;
  headline_em?: string;
  sub?: string;
  amount?: string;
  amount_qualifier?: string;
  button_text?: string;
  features?: string[];
  aside?: AsideRow[];
};

export function Pricing() {
  const { frontmatter } = loadContent<PricingFrontmatter>(
    "landing/pricing.mdx"
  );
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";
  const features = frontmatter.features || [];
  const aside = frontmatter.aside || [];

  return (
    <section
      id="pricing"
      className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto"
    >
      {frontmatter.eyebrow && (
        <Reveal>
          <p className="label text-[var(--color-muted-dark)] mb-3">
            {frontmatter.eyebrow}
          </p>
        </Reveal>
      )}
      {(frontmatter.headline || frontmatter.headline_em) && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3 max-w-3xl">
            {frontmatter.headline}{" "}
            {frontmatter.headline_em && (
              <span className="italic headline-gradient">
                {frontmatter.headline_em}
              </span>
            )}
          </h2>
        </Reveal>
      )}
      {frontmatter.sub && (
        <Reveal delay={160}>
          <p className="text-[var(--color-muted-dark)] mb-8 md:mb-12 max-w-3xl leading-relaxed">
            {frontmatter.sub}
          </p>
        </Reveal>
      )}

      <div className="pricing">
        <Reveal>
          <article className="glass-card price-card h-full">
            <div>
              <span className="amount num-tab">{frontmatter.amount}</span>
              {frontmatter.amount_qualifier && (
                <sub>{frontmatter.amount_qualifier}</sub>
              )}
            </div>
            <ul className="features">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="mt-2">
              <MagneticButton href={paymentLink}>
                <span className="glass-button-primary inline-flex items-center justify-center w-full px-7 py-3.5 font-mono text-sm uppercase tracking-[0.08em]">
                  {frontmatter.button_text || "Buy and start setup"}
                </span>
              </MagneticButton>
            </div>
          </article>
        </Reveal>

        <Reveal delay={80}>
          <aside className="glass-card-static price-aside h-full">
            {aside.map((row) => (
              <div key={row.k} className="aside-row">
                <span className="glyph-mark" aria-hidden>
                  ¤
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[var(--color-muted)]">{row.k}</span>
                  <span className="v">{row.v}</span>
                </div>
                {row.small && <span className="s">{row.small}</span>}
              </div>
            ))}
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
