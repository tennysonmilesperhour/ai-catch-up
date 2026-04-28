import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

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
          <p className="label text-[var(--color-muted-dark)] mb-3">
            {frontmatter.eyebrow}
          </p>
        </Reveal>
      )}
      {frontmatter.headline && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-8 md:mb-12 max-w-3xl">
            {frontmatter.headline}
          </h2>
        </Reveal>
      )}

      <div className="testis">
        {items.map((t, i) => (
          <Reveal key={t.initials + i} delay={i * 80}>
            <article className="glass-card-static testi h-full">
              <q>{t.quote}</q>
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
