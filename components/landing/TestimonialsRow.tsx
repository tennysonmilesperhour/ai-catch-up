import Link from "next/link";
import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

// "Honest signal" block. Renders an editorial paragraph instead of fake
// testimonials while AI Catch Up is brand new. Frontmatter shape:
//   eyebrow, headline_1, headline_2, body, cta_text, cta_href
// When real testers consent and we flip back to a 3-quote layout, restore
// the items[] shape and the .testis grid from the git history.

type TestimonialsFrontmatter = {
  eyebrow?: string;
  headline_1?: string;
  headline_2?: string;
  body?: string;
  cta_text?: string;
  cta_href?: string;
};

export function TestimonialsRow() {
  const { frontmatter } = loadContent<TestimonialsFrontmatter>(
    "landing/testimonials.mdx"
  );

  return (
    <section className="px-6 md:px-12 py-12 md:py-20 max-w-4xl mx-auto">
      {frontmatter.eyebrow && (
        <Reveal>
          <div className="mb-4">
            <SectionEyebrow>{frontmatter.eyebrow}</SectionEyebrow>
          </div>
        </Reveal>
      )}
      {(frontmatter.headline_1 || frontmatter.headline_2) && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-6">
            {frontmatter.headline_1}{" "}
            {frontmatter.headline_2 && (
              <span className="headline-gradient">
                {frontmatter.headline_2}
              </span>
            )}
          </h2>
        </Reveal>
      )}
      {frontmatter.body && (
        <Reveal delay={160}>
          <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-8 leading-relaxed max-w-3xl">
            {frontmatter.body}
          </p>
        </Reveal>
      )}
      {frontmatter.cta_text && frontmatter.cta_href && (
        <Reveal delay={220}>
          <Link
            href={frontmatter.cta_href}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-terracotta)] hover:text-[var(--color-dark)] transition-colors"
          >
            {frontmatter.cta_text}
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      )}
    </section>
  );
}
