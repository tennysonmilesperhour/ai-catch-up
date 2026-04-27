import { loadContent } from "@/lib/content";

type CommunityFrontmatter = {
  eyebrow?: string;
  headline?: string;
  url?: string;
  button_text?: string;
  disclosure?: string;
};

type Props = {
  tone?: "light" | "dark";
};

export function CommunityCTA({ tone = "light" }: Props) {
  const { frontmatter, body } = loadContent<CommunityFrontmatter>(
    "landing/community.mdx"
  );
  const url = frontmatter.url;
  if (!url) return null;

  const isDark = tone === "dark";
  const bgClass = isDark
    ? "glass-card-static cosmic-glow-soft text-[var(--color-dark)]"
    : "glass-card text-[var(--color-dark)]";
  const bodyClass = isDark
    ? "text-[var(--color-muted-dark)]"
    : "text-[var(--color-muted-dark)]";
  const disclosureClass = "text-[var(--color-muted)]";

  return (
    <aside className={`${bgClass} p-6 md:p-8`}>
      {frontmatter.eyebrow && (
        <p className="label text-[var(--color-terracotta)] mb-3">
          {frontmatter.eyebrow}
        </p>
      )}
      {frontmatter.headline && (
        <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-4">
          {frontmatter.headline}
        </h2>
      )}
      {body && (
        <p className={`leading-relaxed mb-6 max-w-2xl ${bodyClass}`}>
          {body.trim()}
        </p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="glass-button-primary inline-flex items-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em]"
      >
        {frontmatter.button_text || "Visit the community"}
        <span aria-hidden className="ml-2">
          &rarr;
        </span>
      </a>
      {frontmatter.disclosure && (
        <p className={`font-mono text-[10px] uppercase tracking-[0.1em] mt-5 ${disclosureClass}`}>
          {frontmatter.disclosure}
        </p>
      )}
    </aside>
  );
}
