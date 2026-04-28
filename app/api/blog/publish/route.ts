import { NextResponse, type NextRequest } from "next/server";
import { isValidSlug } from "@/lib/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_OWNER = process.env.GITHUB_BLOG_REPO_OWNER || "tennysonmilesperhour";
const REPO_NAME = process.env.GITHUB_BLOG_REPO || "ai-catch-up";
const REPO_BRANCH = process.env.GITHUB_BLOG_BRANCH || "main";
const BLOG_DIR = "content/blog";

const MAX_TITLE = 200;
const MAX_SUMMARY = 500;
const MAX_BODY = 50_000;
const MAX_AUTHOR = 80;

type Payload = {
  title?: unknown;
  body?: unknown;
  slug?: unknown;
  date?: unknown;
  summary?: unknown;
  author?: unknown;
  overwrite?: unknown;
};

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorize(req: NextRequest): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.BLOG_PUBLISH_SECRET;
  if (!secret) return { ok: false, reason: "server not configured" };
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, reason: "missing bearer token" };
  if (!constantTimeEqual(m[1], secret)) return { ok: false, reason: "invalid token" };
  return { ok: true };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeYaml(value: string): string {
  // Simple safe YAML scalar: wrap in double quotes and escape backslashes
  // and double quotes. Reject control chars (caller should pre-strip).
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildMdx(meta: {
  title: string;
  slug: string;
  date: string;
  summary: string;
  author?: string;
}, body: string): string {
  const lines = [
    "---",
    `title: ${escapeYaml(meta.title)}`,
    `slug: ${escapeYaml(meta.slug)}`,
    `date: ${escapeYaml(meta.date)}`,
    `summary: ${escapeYaml(meta.summary)}`,
  ];
  if (meta.author) lines.push(`author: ${escapeYaml(meta.author)}`);
  lines.push("---", "", body.trim(), "");
  return lines.join("\n");
}

async function githubGetFileSha(path: string, token: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(REPO_BRANCH)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub GET failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { sha?: string };
  return json.sha ?? null;
}

async function githubPutFile(
  path: string,
  contentBase64: string,
  message: string,
  sha: string | null,
  token: string
): Promise<{ commitSha: string; htmlUrl: string }> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}`;
  const body: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch: REPO_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    commit?: { sha?: string; html_url?: string };
    content?: { html_url?: string };
  };
  return {
    commitSha: json.commit?.sha ?? "",
    htmlUrl: json.content?.html_url ?? json.commit?.html_url ?? "",
  };
}

function isPrintableLine(s: string): boolean {
  // Reject NUL and most C0 controls except tab/newline/carriage-return.
  // Allows extended UTF-8; only blocks chars that corrupt YAML or commits.
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0x09 || c === 0x0a || c === 0x0d) continue;
    if (c < 0x20) return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  const auth = authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const githubToken = process.env.GITHUB_BLOG_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: "server not configured: GITHUB_BLOG_TOKEN missing" },
      { status: 500 }
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const title =
    typeof payload.title === "string" ? payload.title.trim() : "";
  const body =
    typeof payload.body === "string" ? payload.body : "";
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 });
  if (title.length > MAX_TITLE)
    return NextResponse.json({ error: `title exceeds ${MAX_TITLE} chars` }, { status: 400 });
  if (body.length > MAX_BODY)
    return NextResponse.json({ error: `body exceeds ${MAX_BODY} chars` }, { status: 400 });
  if (!isPrintableLine(title))
    return NextResponse.json({ error: "title has control characters" }, { status: 400 });

  const summary =
    typeof payload.summary === "string" ? payload.summary.trim() : "";
  if (summary.length > MAX_SUMMARY)
    return NextResponse.json({ error: `summary exceeds ${MAX_SUMMARY} chars` }, { status: 400 });
  if (summary && !isPrintableLine(summary))
    return NextResponse.json({ error: "summary has control characters" }, { status: 400 });

  const author =
    typeof payload.author === "string" ? payload.author.trim() : "";
  if (author.length > MAX_AUTHOR)
    return NextResponse.json({ error: `author exceeds ${MAX_AUTHOR} chars` }, { status: 400 });

  const date =
    typeof payload.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(payload.date)
      ? payload.date
      : todayUtc();

  const rawSlug =
    typeof payload.slug === "string" && payload.slug.trim().length > 0
      ? slugify(payload.slug)
      : slugify(title);

  if (!isValidSlug(rawSlug)) {
    return NextResponse.json(
      { error: "could not derive a valid slug; pass an explicit `slug`" },
      { status: 400 }
    );
  }

  const overwrite = payload.overwrite === true;
  const path = `${BLOG_DIR}/${rawSlug}.mdx`;

  let sha: string | null;
  try {
    sha = await githubGetFileSha(path, githubToken);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "github lookup failed" },
      { status: 502 }
    );
  }

  if (sha && !overwrite) {
    return NextResponse.json(
      {
        error: "post with this slug already exists",
        slug: rawSlug,
        path,
        hint: "pass `overwrite: true` to replace it, or use a different slug",
      },
      { status: 409 }
    );
  }

  const mdx = buildMdx(
    { title, slug: rawSlug, date, summary, author: author || undefined },
    body
  );
  const contentBase64 = Buffer.from(mdx, "utf8").toString("base64");
  const message = sha
    ? `blog: update ${rawSlug}`
    : `blog: publish ${rawSlug}`;

  let result: { commitSha: string; htmlUrl: string };
  try {
    result = await githubPutFile(path, contentBase64, message, sha, githubToken);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "github commit failed" },
      { status: 502 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      slug: rawSlug,
      path,
      action: sha ? "updated" : "created",
      commitSha: result.commitSha,
      githubUrl: result.htmlUrl,
      blogUrl: `/blog/${rawSlug}`,
    },
    { status: sha ? 200 : 201 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
