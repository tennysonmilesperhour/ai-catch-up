import { loadContent } from "@/lib/content";

type PlanSection = {
  title: string;
  content: string;
};

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
      <header className="mb-10">
        {frontmatter.title && (
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
            {frontmatter.title}
          </h1>
        )}
        {frontmatter.subtitle && (
          <p className="text-[var(--color-muted-dark)]">
            {frontmatter.subtitle}
          </p>
        )}
      </header>

      <div className="grid gap-6">
        {sections.length === 0 ? (
          <p className="italic text-[var(--color-muted)]">
            TODO: Plan sections pending.
          </p>
        ) : (
          sections.map((s, i) => (
            <article
              key={i}
              className="bg-white/60 border border-[var(--color-border)] p-6 md:p-8"
            >
              <p className="label text-[var(--color-terracotta)] mb-3">
                {String(i + 1).padStart(2, "0")} &middot; {s.title}
              </p>
              <p className="text-[var(--color-muted-dark)] leading-relaxed">
                {s.content}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
