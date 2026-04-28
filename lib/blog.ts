import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  author?: string;
  body: string;
};

const BLOG_DIR = join(process.cwd(), "content", "blog");

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,80}[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

function parsePost(filename: string): BlogPost | null {
  if (!filename.endsWith(".mdx") && !filename.endsWith(".md")) return null;
  const slug = filename.replace(/\.(mdx|md)$/, "");
  const fullPath = join(BLOG_DIR, filename);
  const raw = readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Partial<BlogPost>;
  if (!fm.title || !fm.date) return null;
  return {
    slug: fm.slug || slug,
    title: String(fm.title),
    date: String(fm.date),
    summary: String(fm.summary ?? ""),
    author: fm.author ? String(fm.author) : undefined,
    body: content.trim(),
  };
}

export function listPosts(): BlogPost[] {
  if (!existsSync(BLOG_DIR)) return [];
  const files = readdirSync(BLOG_DIR);
  const posts = files
    .map((f) => parsePost(f))
    .filter((p): p is BlogPost => p !== null);
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

export function getPost(slug: string): BlogPost | null {
  if (!isValidSlug(slug)) return null;
  for (const ext of ["mdx", "md"] as const) {
    const path = join(BLOG_DIR, `${slug}.${ext}`);
    if (existsSync(path)) {
      return parsePost(`${slug}.${ext}`);
    }
  }
  return null;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
