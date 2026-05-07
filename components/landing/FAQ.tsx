import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { AutoLearnText } from "@/components/shared/LearnMode";
import { JsonLd } from "@/components/shared/JsonLd";
import { faqPageJsonLd, faqSlug } from "@/lib/structured-data";

type FAQItem = {
  q: string;
  a: string;
  open?: boolean;
};

type FAQFrontmatter = {
  title_1?: string;
  title_2?: string;
  lead?: string;
  items?: FAQItem[];
};

export function FAQ() {
  const { frontmatter } = loadContent<FAQFrontmatter>("landing/faq.mdx");
  const items = frontmatter.items || [];

  return (
    <section
      id="faq"
      className="px-6 md:px-12 py-12 md:py-20 max-w-4xl mx-auto"
    >
      <Reveal>
        <div className="mb-4">
          <SectionEyebrow>Questions</SectionEyebrow>
        </div>
      </Reveal>
      {(frontmatter.title_1 || frontmatter.title_2) && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3">
            {frontmatter.title_1}{" "}
            {frontmatter.title_2 && (
              <span className="headline-gradient">
                {frontmatter.title_2}
              </span>
            )}
          </h2>
        </Reveal>
      )}
      {frontmatter.lead && (
        <Reveal delay={160}>
          <p className="text-[var(--color-muted-dark)] mb-8 md:mb-12 max-w-3xl leading-relaxed">
            {frontmatter.lead}
          </p>
        </Reveal>
      )}

      <div className="faqs">
        {items.map((item, i) => {
          const slug = faqSlug(item.q);
          return (
            <Reveal key={i} delay={i * 60}>
              <details
                id={`faq-${slug}`}
                className="faq"
                open={item.open}
              >
                <summary>
                  <span>{item.q}</span>
                  <span className="chev" aria-hidden />
                </summary>
                <div className="a">
                  <AutoLearnText>{item.a}</AutoLearnText>
                </div>
              </details>
            </Reveal>
          );
        })}
      </div>

      {items.length > 0 && (
        <JsonLd
          data={faqPageJsonLd(items.map(({ q, a }) => ({ q, a })))}
        />
      )}
    </section>
  );
}
