import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { AutoLearnText } from "@/components/shared/LearnMode";

type Testimonial = {
  initials: string;
  quote: string;
  name: string;
  role: string;
};

type TestimonialsFrontmatter = {
  eyebrow?: string;
  headline?: string;
  items?: Testimonial[];
};

export function TestimonialsRow() {
  const { frontmatter } = loadContent<TestimonialsFrontmatter>(
    "landing/testimonials.mdx"
  );
  const items = frontmatter.items || [];

  return (
    <section className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto">
      {frontmatter.eyebrow && (
        <Reveal>
          <div className="mb-4">
            <SectionEyebrow>{frontmatter.eyebrow}</SectionEyebrow>
          </div>
        </Reveal>
      )}
      <div className="section-head">
        {frontmatter.headline && (
          <Reveal delay={80}>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] max-w-3xl">
              {frontmatter.headline}
            </h2>
          </Reveal>
        )}
        <Reveal delay={160}>
          <p className="section-subhead">
            What changed for the people who finished the 60 minutes.
          </p>
        </Reveal>
      </div>

      <div className="testis">
        {items.map((t, i) => (
          <Reveal key={t.initials + i} delay={i * 80}>
            <article className="glass-card-static testi h-full">
              <q>
                <AutoLearnText>{t.quote}</AutoLearnText>
              </q>
              <div className="who">
                <span className="avatar" aria-hidden>
                  {t.initials}
                </span>
                <div className="flex flex-col">
                  <span className="name">{t.name}</span>
                  <span className="role">{t.role}</span>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
