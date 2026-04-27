import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

type Phase = {
  number: string;
  title: string;
  time: string;
  description: string;
};

type SetupPreviewFrontmatter = {
  eyebrow?: string;
  headline?: string;
  intro?: string;
  phases?: Phase[];
};

export function SetupPreview() {
  const { frontmatter } = loadContent<SetupPreviewFrontmatter>(
    "landing/setup-preview.mdx"
  );
  const phases = frontmatter.phases || [];

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto">
      {frontmatter.eyebrow && (
        <Reveal>
          <p className="label text-[var(--color-muted-dark)] mb-6">
            {frontmatter.eyebrow}
          </p>
        </Reveal>
      )}
      {frontmatter.headline && (
        <Reveal delay={60}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-6">
            {frontmatter.headline}
          </h2>
        </Reveal>
      )}
      {frontmatter.intro && (
        <Reveal delay={140}>
          <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-14 max-w-3xl leading-relaxed">
            {frontmatter.intro}
          </p>
        </Reveal>
      )}
      <ol className="relative flex flex-col gap-6">
        {/* Hot-wired connector behind the bullets */}
        <span
          aria-hidden
          className="hotwire absolute left-[1.125rem] top-6 bottom-6 w-px bg-[var(--color-border)]"
        />
        {phases.map((p, i) => (
          <Reveal as="li" key={i} delay={i * 70}>
            <div className="relative glass-card p-5 md:p-6 flex gap-4 md:gap-6 items-start">
              <span className="relative z-10 shrink-0 w-9 h-9 rounded-full bg-[var(--color-cream)] border border-[var(--color-terracotta)] flex items-center justify-center font-mono text-xs text-[var(--color-terracotta)] cosmic-glow-soft">
                {p.number}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 md:gap-4 mb-2">
                  <h3 className="font-serif text-xl md:text-2xl text-[var(--color-dark)] leading-tight">
                    {p.title}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {p.time}
                  </span>
                </div>
                <p className="text-[var(--color-muted-dark)] leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
