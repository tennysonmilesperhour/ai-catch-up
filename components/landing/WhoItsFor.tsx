import { loadContent } from "@/lib/content";

type WhoItsForFrontmatter = {
  eyebrow?: string;
  headline?: string;
};

export function WhoItsFor() {
  const { frontmatter, body } = loadContent<WhoItsForFrontmatter>(
    "landing/who-its-for.mdx"
  );
  const paragraphs = body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="bg-[var(--color-dark)] text-[var(--color-cream)] py-20 md:py-28">
      <div className="px-6 md:px-12 max-w-3xl mx-auto">
        {frontmatter.eyebrow && (
          <p className="label text-[var(--color-terracotta)] mb-6">
            {frontmatter.eyebrow}
          </p>
        )}
        {frontmatter.headline && (
          <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-10">
            {frontmatter.headline}
          </h2>
        )}
        <div className="text-lg space-y-5 leading-relaxed text-[var(--color-cream)]/90">
          {paragraphs.length === 0 ? (
            <p className="italic text-[var(--color-muted)]">
              TODO: Who-its-for copy pending from Strategy Claude.
            </p>
          ) : (
            paragraphs.map((p, i) => <p key={i}>{p}</p>)
          )}
        </div>
      </div>
    </section>
  );
}
