import { loadContent } from "@/lib/content";

type PlanFrontmatter = {
  title?: string;
  subtitle?: string;
  sections?: { id: string; label: string }[];
};

export const metadata = { title: "Plan" };

type Section = { heading: string; body: string };

function parseSections(body: string): Section[] {
  const clean = body.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim();
  if (!clean) return [];
  const chunks = clean.split(/^##\s+/m).filter(Boolean);
  return chunks.map((chunk) => {
    const [heading, ...rest] = chunk.split("\n");
    return {
      heading: heading.trim(),
      body: rest.join("\n").trim(),
    };
  });
}

export default function PlanPage() {
  const { frontmatter, body } = loadContent<PlanFrontmatter>(
    "admin/plan.mdx"
  );
  const sections = parseSections(body);

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
                {String(i + 1).padStart(2, "0")} &middot; {s.heading}
              </p>
              <div className="text-[var(--color-muted-dark)] leading-relaxed whitespace-pre-line">
                {s.body || (
                  <span className="italic text-[var(--color-muted)]">
                    TODO copy pending.
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
