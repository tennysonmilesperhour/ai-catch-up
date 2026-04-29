import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadContent } from "@/lib/content";

export const metadata = { title: "Coding guide" };

type CodingGuideFrontmatter = {
  title?: string;
  subtitle?: string;
};

export default function CodingGuidePage() {
  const { frontmatter, body } = loadContent<CodingGuideFrontmatter>(
    "admin/coding-guide.mdx"
  );

  return (
    <div className="max-w-3xl">
      <header className="admin-header">
        {frontmatter.title && (
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
            {frontmatter.title}
          </h1>
        )}
        {frontmatter.subtitle && (
          <p className="text-[var(--color-muted-dark)] max-w-2xl leading-relaxed">
            {frontmatter.subtitle}
          </p>
        )}
      </header>

      <article className="prose-blog">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </article>
    </div>
  );
}
