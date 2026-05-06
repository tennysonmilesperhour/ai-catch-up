// POST /api/nexus/nodes
// Hermes (or any agent with the bearer token) can add/update Nexus
// nodes by posting a payload here. The endpoint validates, merges with
// the existing Hermes store, and commits the updated JSON file to GitHub
// via the Contents API (same pattern as the blog publish endpoint, so it
// works on Vercel's serverless runtime without a writable filesystem).

import { NextResponse, type NextRequest } from "next/server";
import {
  HERMES_FILE_PATH,
  EMPTY_STORE,
  type HermesStore,
  type HermesNode,
  type HermesLink,
  upsertNode,
  upsertLink,
  serializeStore,
} from "@/lib/hermes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_OWNER = process.env.GITHUB_BLOG_REPO_OWNER || "tennysonmilesperhour";
const REPO_NAME = process.env.GITHUB_BLOG_REPO || "ai-catch-up";
const REPO_BRANCH = process.env.GITHUB_BLOG_BRANCH || "main";

const VALID_KINDS = new Set(["real", "ghost", "fork"]);
const VALID_STATUS = new Set([
  "connected",
  "partial",
  "needs-setup",
  "not-installed",
]);

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorize(req: NextRequest): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return { ok: false, reason: "server not configured: HERMES_API_KEY missing" };
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, reason: "missing bearer token" };
  if (!constantTimeEqual(m[1], secret)) return { ok: false, reason: "invalid token" };
  return { ok: true };
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && /^[a-z0-9][a-z0-9_-]{0,60}$/i.test(id);
}

function asStringArray(value: unknown, max: number): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > max) return null;
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string") return null;
    if (v.length > 240) return null;
    out.push(v);
  }
  return out;
}

type Payload = {
  node?: unknown;
  links?: unknown;
  hermesNote?: unknown;
};

type IncomingNode = {
  id: string;
  label: string;
  domain: string;
  kind: "real" | "ghost" | "fork";
  weight: number;
  desc: string;
  github?: string;
  homepage?: string;
  examples?: string[];
  gettingStarted?: string;
  connectionChecks?: string[];
  connectionStatus?: "connected" | "partial" | "needs-setup" | "not-installed";
  howToUse?: string;
  triggers?: string[];
  useCases?: string[];
  relatedRepos?: string[];
};

function validateNode(raw: unknown): { ok: true; node: IncomingNode } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "node must be an object" };
  const r = raw as Record<string, unknown>;
  if (!isValidId(r.id)) return { ok: false, error: "node.id must be a slug" };
  if (typeof r.label !== "string" || r.label.length < 1 || r.label.length > 80)
    return { ok: false, error: "node.label is required (1-80 chars)" };
  if (typeof r.domain !== "string" || r.domain.length < 1 || r.domain.length > 40)
    return { ok: false, error: "node.domain is required" };
  if (typeof r.kind !== "string" || !VALID_KINDS.has(r.kind))
    return { ok: false, error: "node.kind must be real | ghost | fork" };
  if (typeof r.weight !== "number" || r.weight < 1 || r.weight > 8)
    return { ok: false, error: "node.weight must be 1..8" };
  if (typeof r.desc !== "string" || r.desc.length < 1 || r.desc.length > 600)
    return { ok: false, error: "node.desc is required (1-600 chars)" };

  const out: IncomingNode = {
    id: r.id as string,
    label: r.label,
    domain: r.domain,
    kind: r.kind as "real" | "ghost" | "fork",
    weight: r.weight,
    desc: r.desc,
  };

  if (r.github !== undefined) {
    if (typeof r.github !== "string" || r.github.length > 100) return { ok: false, error: "node.github must be a string" };
    out.github = r.github;
  }
  if (r.homepage !== undefined) {
    if (typeof r.homepage !== "string" || r.homepage.length > 300) return { ok: false, error: "node.homepage must be a string" };
    out.homepage = r.homepage;
  }
  if (r.gettingStarted !== undefined) {
    if (typeof r.gettingStarted !== "string" || r.gettingStarted.length > 600)
      return { ok: false, error: "node.gettingStarted must be <=600 chars" };
    out.gettingStarted = r.gettingStarted;
  }
  if (r.howToUse !== undefined) {
    if (typeof r.howToUse !== "string" || r.howToUse.length > 600)
      return { ok: false, error: "node.howToUse must be <=600 chars" };
    out.howToUse = r.howToUse;
  }
  if (r.connectionStatus !== undefined) {
    if (typeof r.connectionStatus !== "string" || !VALID_STATUS.has(r.connectionStatus))
      return { ok: false, error: "node.connectionStatus must be connected | partial | needs-setup | not-installed" };
    out.connectionStatus = r.connectionStatus as IncomingNode["connectionStatus"];
  }

  for (const [key, max] of [
    ["examples", 8],
    ["connectionChecks", 8],
    ["triggers", 10],
    ["useCases", 10],
    ["relatedRepos", 12],
  ] as const) {
    const arr = asStringArray(r[key], max);
    if (arr === null) return { ok: false, error: `node.${key} must be a string array <= ${max} items, each <= 240 chars` };
    if (arr.length > 0) (out as Record<string, unknown>)[key] = arr;
  }

  return { ok: true, node: out };
}

async function githubGetFileSha(token: string): Promise<{ sha: string | null; content: string | null }> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(HERMES_FILE_PATH)}?ref=${encodeURIComponent(REPO_BRANCH)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (res.status === 404) return { sha: null, content: null };
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub GET failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { sha?: string; content?: string; encoding?: string };
  let decoded: string | null = null;
  if (json.content && json.encoding === "base64") {
    decoded = Buffer.from(json.content, "base64").toString("utf8");
  }
  return { sha: json.sha ?? null, content: decoded };
}

async function githubPutFile(
  contentBase64: string,
  message: string,
  sha: string | null,
  token: string
): Promise<{ commitSha: string; htmlUrl: string }> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(HERMES_FILE_PATH)}`;
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

export async function POST(req: NextRequest) {
  const auth = authorize(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  const githubToken = process.env.GITHUB_BLOG_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: "server not configured: GITHUB_BLOG_TOKEN missing (reused for Hermes commits)" },
      { status: 500 }
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const validated = validateNode(payload.node);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  let incomingLinks: HermesLink[] = [];
  if (payload.links !== undefined) {
    if (!Array.isArray(payload.links))
      return NextResponse.json({ error: "links must be an array" }, { status: 400 });
    if (payload.links.length > 24)
      return NextResponse.json({ error: "links max 24 per request" }, { status: 400 });
    for (const l of payload.links) {
      if (!l || typeof l !== "object") return NextResponse.json({ error: "each link must be an object" }, { status: 400 });
      const lo = l as Record<string, unknown>;
      if (!isValidId(lo.source) || !isValidId(lo.target))
        return NextResponse.json({ error: "link.source and link.target must be slug ids" }, { status: 400 });
      const strength = typeof lo.strength === "number" ? Math.max(0, Math.min(1, lo.strength)) : 0.3;
      incomingLinks.push({
        source: lo.source as string,
        target: lo.target as string,
        strength,
        source_agent: "hermes",
      });
    }
  }

  const hermesNote =
    typeof payload.hermesNote === "string" && payload.hermesNote.length <= 600
      ? payload.hermesNote
      : undefined;

  let sha: string | null = null;
  let store: HermesStore = { ...EMPTY_STORE };
  try {
    const got = await githubGetFileSha(githubToken);
    sha = got.sha;
    if (got.content) {
      try {
        const parsed = JSON.parse(got.content) as unknown;
        if (parsed && typeof parsed === "object") {
          const p = parsed as HermesStore;
          if (p.version === 1 && Array.isArray(p.nodes) && Array.isArray(p.links)) {
            store = p;
          }
        }
      } catch {
        // Treat unparseable file as empty rather than failing the request.
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "github lookup failed" },
      { status: 502 }
    );
  }

  const node: HermesNode = {
    ...validated.node,
    source: "hermes",
    updatedAt: new Date().toISOString(),
    hermesNote,
  };

  let nextStore = upsertNode(store, node);
  for (const l of incomingLinks) nextStore = upsertLink(nextStore, l);

  const contentBase64 = Buffer.from(serializeStore(nextStore), "utf8").toString("base64");
  const message = `nexus: hermes ${sha ? "update" : "add"} ${node.id}`;

  let result: { commitSha: string; htmlUrl: string };
  try {
    result = await githubPutFile(contentBase64, message, sha, githubToken);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "github commit failed" },
      { status: 502 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      action: sha ? "updated" : "created",
      node,
      linksAdded: incomingLinks.length,
      commitSha: result.commitSha,
      githubUrl: result.htmlUrl,
    },
    { status: sha ? 200 : 201 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "method not allowed; use POST to add a node, or GET /api/nexus to read the graph",
    },
    { status: 405 }
  );
}
