import { loadContent } from "@/lib/content";

type Scenario = { text: string };

type Counterpoint = {
  label: string;
  items: string[];
};

type ThisIsForYouFrontmatter = {
  eyebrow?: string;
  headline?: string;
  scenarios?: Scenario[];
  counterpoint?: Counterpoint;
};

export function ThisIsForYou() {
  const { frontmatter } = loadContent<ThisIsForYouFrontmatter>(
    "landing/this-is-for-you.mdx"
  );
  const scenarios = frontmatter.scenarios || [];
  const counterpoint = frontmatter.counterpoint;

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto">
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-muted-dark)] mb-6">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-10">
          {frontmatter.headline}
        </h2>
      )}

      <ul className="flex flex-col gap-4 mb-16">
        {scenarios.map((s, i) => (
          <li
            key={i}
            className="flex gap-4 text-lg md:text-xl text-[var(--color-dark)] leading-relaxed"
          >
            <span className="text-[var(--color-terracotta)] mt-1.5 shrink-0">
              &bull;
            </span>
            <span>{s.text}</span>
          </li>
        ))}
      </ul>

      {counterpoint && (
        <div className="border-t border-[var(--color-border)] pt-8">
          <p className="label text-[var(--color-muted)] mb-5">
            {counterpoint.label}
          </p>
          <ul className="flex flex-col gap-2">
            {counterpoint.items.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-[var(--color-muted-dark)] leading-relaxed"
              >
                <span className="text-[var(--color-muted)] mt-1 shrink-0">
                  &ndash;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
