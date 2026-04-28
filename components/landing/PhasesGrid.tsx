import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

type Phase = {
  number: string;
  title: string;
  time: string;
  description: string;
};

type PhasesFrontmatter = {
  eyebrow?: string;
  headline?: string;
  intro?: string;
  phases?: Phase[];
};

export function PhasesGrid() {
  const { frontmatter } = loadContent<PhasesFrontmatter>(
    "landing/setup-preview.mdx"
  );
  const phases = frontmatter.phases || [];

  return (
    <section
      id="flow"
      className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto"
    >
      {frontmatter.eyebrow && (
        <Reveal>
          <p className="label text-[var(--color-muted-dark)] mb-3">
            {frontmatter.eyebrow}
          </p>
        </Reveal>
      )}
      {frontmatter.headline && (
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3 max-w-3xl">
            {frontmatter.headline}
          </h2>
        </Reveal>
      )}
      {frontmatter.intro && (
        <Reveal delay={160}>
          <p className="text-[var(--color-muted-dark)] mb-8 md:mb-12 max-w-3xl leading-relaxed">
            {frontmatter.intro}
          </p>
        </Reveal>
      )}

      <div className="phases-grid">
        {phases.map((p, i) => (
          <Reveal key={p.number} delay={i * 80}>
            <article className="glass-card phase-card h-full">
              <p className="num">Phase · {p.number}</p>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="time">
                <span>Duration</span>
                <span className="v">{p.time}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
