import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

type Outcome = {
  glyph: string;
  color: "cyan" | "violet" | "pink" | "amber";
  title: string;
  description: string;
  tag_left?: string;
  tag_right?: string;
};

type OutcomesFrontmatter = {
  eyebrow?: string;
  headline_1?: string;
  headline_2?: string;
  lead?: string;
  items?: Outcome[];
};

export function OutcomesGrid() {
  const { frontmatter } = loadContent<OutcomesFrontmatter>(
    "landing/outcomes.mdx"
  );
  const items = frontmatter.items || [];

  return (
    <section className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto">
      {frontmatter.eyebrow && (
        <Reveal>
          <p className="label text-[var(--color-muted-dark)] mb-3">
            {frontmatter.eyebrow}
          </p>
        </Reveal>
      )}
      {(frontmatter.headline_1 || frontmatter.headline_2) && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3 max-w-3xl">
            {frontmatter.headline_1}{" "}
            {frontmatter.headline_2 && (
              <span className="italic headline-gradient">
                {frontmatter.headline_2}
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

      <div className="outcomes">
        {items.map((o, i) => (
          <Reveal key={o.glyph} delay={i * 80}>
            <article className="glass-card outcome h-full">
              <span className={`glyph ${o.color}`} aria-hidden>
                {o.glyph}
              </span>
              <h3>{o.title}</h3>
              <p>{o.description}</p>
              {(o.tag_left || o.tag_right) && (
                <div className="tag-row">
                  <span>{o.tag_left}</span>
                  <span className="v">{o.tag_right}</span>
                </div>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
