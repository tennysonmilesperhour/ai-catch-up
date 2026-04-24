import { loadContent } from "@/lib/content";

type PlateauFrontmatter = {
  eyebrow?: string;
  headline?: string;
};

export function Plateau() {
  const { frontmatter, body } = loadContent<PlateauFrontmatter>(
    "landing/plateau.mdx"
  );
  const paragraphs = body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-3xl mx-auto">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-8">
          {frontmatter.headline}
        </h2>
      )}
      <div className="text-lg text-[var(--color-muted-dark)] space-y-5 leading-relaxed">
        {paragraphs.length === 0 ? (
          <p className="italic text-[var(--color-muted)]">
            TODO: Plateau copy pending from Strategy Claude.
          </p>
        ) : (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        )}
      </div>
    </section>
  );
}
