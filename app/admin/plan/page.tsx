import { loadContent } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

type PlanSection = { title: string; content: string };
type PlanFrontmatter = {
  title?: string;
  subtitle?: string;
  sections?: PlanSection[];
};

export const metadata = { title: "Plan" };

export default function PlanPage() {
  const { frontmatter } = loadContent<PlanFrontmatter>("admin/plan.mdx");
  const sections = frontmatter.sections || [];

  return (
    <div>
      <header className="admin-header">
        {frontmatter.title && (
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
            {frontmatter.title}
          </h1>
        )}
        {frontmatter.subtitle && (
          <p className="text-[var(--color-muted-dark)]">{frontmatter.subtitle}</p>
        )}
      </header>

      <div className="grid gap-6">
        {sections.length === 0 ? (
          <p className="italic text-[var(--color-muted)]">TODO: Plan sections pending.</p>
        ) : (
          sections.map((s, i) => (
            <Reveal key={i} delay={i * 60}>
              <article className="glass-card p-6 md:p-8 grid grid-cols-[auto_1fr] gap-6 items-start">
                <span className="idx-numeral select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="label text-[var(--color-terracotta)] mb-3">{s.title}</p>
                  <p className="text-[var(--color-muted-dark)] leading-relaxed">
                    {s.content}
                  </p>
                </div>
              </article>
            </Reveal>
          ))
        )}
      </div>
    </div>
  );
}
