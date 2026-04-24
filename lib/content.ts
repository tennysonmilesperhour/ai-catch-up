import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export type ParsedContent<T = Record<string, unknown>> = {
  frontmatter: T;
  body: string;
};

export function loadContent<T = Record<string, unknown>>(
  relativePath: string
): ParsedContent<T> {
  const fullPath = join(process.cwd(), "content", relativePath);
  const raw = readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return { frontmatter: data as T, body: content.trim() };
}

export function loadJson<T = unknown>(relativePath: string): T {
  const fullPath = join(process.cwd(), "content", relativePath);
  const raw = readFileSync(fullPath, "utf8");
  return JSON.parse(raw) as T;
}
