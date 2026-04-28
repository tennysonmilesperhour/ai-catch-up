import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

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
      {(frontmatter.title_1 || frontmatter.title_2) && (
        <Reveal>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3">
            {frontmatter.title_1}{" "}
            {frontmatter.title_2 && (
              <span className="italic headline-gradient">
                {frontmatter.title_2}
              </span>
            )}
          </h2>
        </Reveal>
      )}
      {frontmatter.lead && (
        <Reveal delay={80}>
          <p className="text-[var(--color-muted-dark)] mb-8 md:mb-12 max-w-3xl leading-relaxed">
            {frontmatter.lead}
          </p>
        </Reveal>
      )}

      <div className="faqs">
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 60}>
            <details className="faq" open={item.open}>
              <summary>
                <span>{item.q}</span>
                <span className="chev" aria-hidden />
              </summary>
              <div className="a">{item.a}</div>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
