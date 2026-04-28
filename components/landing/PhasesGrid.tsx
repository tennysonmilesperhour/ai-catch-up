import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

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
          <div className="mb-4">
            <SectionEyebrow>{frontmatter.eyebrow}</SectionEyebrow>
          </div>
        </Reveal>
      )}
      <div className="section-head">
        {frontmatter.headline && (
          <Reveal delay={80}>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] max-w-3xl">
              A guided 60-minute flow,{" "}
              <span className="headline-gradient">five phases.</span>
            </h2>
          </Reveal>
        )}
        {frontmatter.intro && (
          <Reveal delay={160}>
            <p className="section-subhead">
              Read top-to-bottom. Each phase ends with a working artifact in
              your workspace.
            </p>
          </Reveal>
        )}
      </div>

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
