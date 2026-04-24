import { loadContent } from "@/lib/content";

type Scenario = {
  when: string;
  mode?: "with" | "without";
  user_prompt: string;
  ai_response: string;
  outcome: string;
};

type BeforeAfterFrontmatter = {
  eyebrow?: string;
  headline?: string;
  intro?: string;
  scenarios?: Scenario[];
};

export function BeforeAfter() {
  const { frontmatter } = loadContent<BeforeAfterFrontmatter>(
    "landing/before-after.mdx"
  );
  const scenarios = frontmatter.scenarios || [];

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-6 max-w-3xl">
          {frontmatter.headline}
        </h2>
      )}
      {frontmatter.intro && (
        <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-12 max-w-3xl leading-relaxed">
          {frontmatter.intro}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((s, i) => {
          const isWith = s.mode === "with";
          const labelClass = isWith
            ? "text-[var(--color-terracotta)]"
            : "text-[var(--color-muted-dark)]";
          const panelClass = isWith
            ? "bg-[var(--color-cream)] border-[var(--color-terracotta)]"
            : "bg-white/40 border-[var(--color-border)]";
          const userBubbleClass = isWith
            ? "bg-white border border-[var(--color-border)] text-[var(--color-dark)]"
            : "bg-white/60 border border-[var(--color-border)] text-[var(--color-muted-dark)]";
          const aiBubbleClass = isWith
            ? "bg-[var(--color-terracotta)]/10 border border-[var(--color-terracotta)] text-[var(--color-dark)]"
            : "bg-[var(--color-muted)]/10 border border-[var(--color-muted)] text-[var(--color-muted-dark)]";
          return (
            <article
              key={i}
              className={`border p-6 md:p-8 flex flex-col gap-5 ${panelClass}`}
            >
              <p className={`label ${labelClass}`}>{s.when}</p>

              <div className="flex flex-col gap-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  You
                </p>
                <div
                  className={`p-4 leading-relaxed ${userBubbleClass}`}
                >
                  {s.user_prompt}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  Claude
                </p>
                <div
                  className={`p-4 leading-relaxed ${aiBubbleClass}`}
                >
                  {s.ai_response}
                </div>
              </div>

              <p className="font-serif italic text-[var(--color-muted-dark)] leading-relaxed">
                {s.outcome}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
