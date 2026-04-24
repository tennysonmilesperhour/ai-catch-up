import { Button } from "@/components/shared/Button";
import { loadContent } from "@/lib/content";

type FinalCTAFrontmatter = {
  eyebrow?: string;
  headline?: string;
  button_label?: string;
};

export function FinalCTA() {
  const { frontmatter, body } = loadContent<FinalCTAFrontmatter>(
    "landing/final-cta.mdx"
  );
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";
  const paragraphs = body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="px-6 md:px-12 py-20 md:py-28 max-w-3xl mx-auto text-center">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-8">
          {frontmatter.headline}
        </h2>
      )}
      {paragraphs.length > 0 && (
        <div className="text-lg text-[var(--color-muted-dark)] space-y-4 mb-10 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <Button href={paymentLink} variant="primary">
        {frontmatter.button_label || "Get the onboarding"}
      </Button>
    </section>
  );
}
