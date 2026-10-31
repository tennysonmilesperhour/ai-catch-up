// POST /api/nexus/nodes   add or update a node (plus optional links)
// DELETE /api/nexus/nodes?id=<id>   remove a node this store added
//
// Two callers: Hermes (or any agent with the HERMES_API_KEY bearer token),
// and the admin on the Nexus page (signed-in admin session cookie, same
// origin only). The endpoint validates, merges with
// the existing Hermes store, and commits the updated JSON file to GitHub
// via the Contents API (same pattern as the blog publish endpoint, so it
// works on Vercel's serverless runtime without a writable filesystem).
// The endpoint validates, merges with
// the existing Hermes store, and commits the updated JSON file to GitHub
// via the Contents API (same pattern as the blog publish endpoint, so it
// works on Vercel's serverless runtime without a writable filesystem).

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import {
  HERMES_FILE_PATH,
  HERMES_REPO_BRANCH,
  HERMES_REPO_NAME,
  HERMES_REPO_OWNER,
  removeNode,
  EMPTY_STORE,
  type HermesStore,
  type HermesNode,
  type HermesLink,
  upsertNode,
  upsertLink,
  serializeStore,
} from "@/lib/hermes-store";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_OWNER = HERMES_REPO_OWNER;
const REPO_NAME = HERMES_REPO_NAME;
const REPO_BRANCH = HERMES_REPO_BRANCH;

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

type Actor = "hermes" | "admin";

// Cookie-authenticated writes must come from our own pages. Stricter than
// the login form: a request with neither Sec-Fetch-Site nor Origin is
// rejected, because a cookie alone should never be enough.
function isStrictSameOrigin(req: NextRequest): boolean {
  const sfs = req.headers.get("sec-fetch-site");
  if (sfs) return sfs === "same-origin";
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

async function authorize(
  req: NextRequest
): Promise<{ ok: true; actor: Actor } | { ok: false; reason: string }> {
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const secret = process.env.HERMES_API_KEY;
    if (!secret) return { ok: false, reason: "server not configured: HERMES_API_KEY missing" };
    if (!constantTimeEqual(m[1], secret)) return { ok: false, reason: "invalid token" };
    return { ok: true, actor: "hermes" };
  }
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session?.role === "admin") {
    if (!isStrictSameOrigin(req)) return { ok: false, reason: "cross-origin request refused" };
    return { ok: true, actor: "admin" };
  }
  return { ok: false, reason: "missing bearer token or admin session" };
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
    console.error("[nexus/nodes] GitHub GET failed", res.status, detail.slice(0, 300));
    throw new Error(`GitHub GET failed: ${res.status}`);
  }
  const json = (await res.json()) as { sha?: string; content?: string; encoding?: string };
  let decoded: string | null = null;
  if (json.content && json.encoding === "base64") {
    decoded = Buffer.from(json.content, "base64").toString("utf8");
  }
  return { sha: json.sha ?? null, content: decoded };
}

class GitHubConflictError extends Error {}

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
    console.error("[nexus/nodes] GitHub PUT failed", res.status, detail.slice(0, 300));
    // 409 = someone else committed since our read (stale sha).
    if (res.status === 409) throw new GitHubConflictError("GitHub PUT conflict");
    throw new Error(`GitHub PUT failed: ${res.status}`);
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
  // Coarse abuse guard on top of the bearer check: a leaked token can't
  // hammer the GitHub Contents API without limit. Per-instance (see
  // lib/rate-limit), so it's a guardrail, not a hard cap.
  const rl = rateLimit("nexus-nodes", clientKey(req.headers), 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests, try again shortly" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
        },
      }
    );
  }

  const auth = await authorize(req);
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

  const incomingLinks: HermesLink[] = [];
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
        ...(auth.actor === "hermes" ? { source_agent: "hermes" as const } : {}),
      });
    }
  }

  const hermesNote =
    auth.actor === "hermes" &&
    typeof payload.hermesNote === "string" &&
    payload.hermesNote.length <= 600
      ? payload.hermesNote
      : undefined;

  const node: HermesNode = {
    ...validated.node,
    source: auth.actor,
    updatedAt: new Date().toISOString(),
    ...(hermesNote ? { hermesNote } : {}),
  };

  const outcome = await commitStore(
    githubToken,
    (store) => {
      let next = upsertNode(store, node);
      for (const l of incomingLinks) next = upsertLink(next, l);
      return next;
    },
    (existed) => `nexus: ${auth.actor} ${existed ? "update" : "add"} ${node.id}`
  );
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 502 });
  }

  return NextResponse.json(
    {
      ok: true,
      action: outcome.fileExisted ? "updated" : "created",
      node,
      links: incomingLinks,
      linksAdded: incomingLinks.length,
      commitSha: outcome.commitSha,
      githubUrl: outcome.htmlUrl,
    },
    { status: outcome.fileExisted ? 200 : 201 }
  );
}

function parseStore(content: string | null): HermesStore {
  if (!content) return { ...EMPTY_STORE };
  try {
    const parsed = JSON.parse(content) as unknown;
    if (parsed && typeof parsed === "object") {
      const p = parsed as HermesStore;
      if (p.version === 1 && Array.isArray(p.nodes) && Array.isArray(p.links)) {
        return p;
      }
    }
  } catch {
    // Treat unparseable file as empty rather than failing the request.
  }
  return { ...EMPTY_STORE };
}

// Read, change, commit. If another writer committed between our read and
// our write (409), re-read and apply the change again once.
async function commitStore(
  token: string,
  mutate: (store: HermesStore) => HermesStore | null,
  message: (fileExisted: boolean) => string
): Promise<
  | { ok: true; fileExisted: boolean; commitSha: string; htmlUrl: string; unchanged?: boolean }
  | { ok: false; error: string; notFound?: boolean }
> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let sha: string | null;
    let store: HermesStore;
    try {
      const got = await githubGetFileSha(token);
      sha = got.sha;
      store = parseStore(got.content);
    } catch {
      return { ok: false, error: "github lookup failed" };
    }
    const next = mutate(store);
    if (!next) return { ok: false, error: "not found", notFound: true };
    const contentBase64 = Buffer.from(serializeStore(next), "utf8").toString("base64");
    try {
      const result = await githubPutFile(contentBase64, message(!!sha), sha, token);
      return { ok: true, fileExisted: !!sha, ...result };
    } catch (err) {
      if (err instanceof GitHubConflictError && attempt === 0) continue;
      return { ok: false, error: "github commit failed" };
    }
  }
  return { ok: false, error: "github commit failed" };
}

export async function DELETE(req: NextRequest) {
  const rl = rateLimit("nexus-nodes", clientKey(req.headers), 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests, try again shortly" }, { status: 429 });
  }
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  const githubToken = process.env.GITHUB_BLOG_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: "server not configured: GITHUB_BLOG_TOKEN missing (reused for Hermes commits)" },
      { status: 500 }
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!isValidId(id)) return NextResponse.json({ error: "id must be a slug" }, { status: 400 });

  const outcome = await commitStore(
    githubToken,
    (store) => (store.nodes.some((n) => n.id === id) ? removeNode(store, id) : null),
    () => `nexus: ${auth.actor} remove ${id}`
  );
  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.notFound ? "node not found in the Hermes store" : outcome.error },
      { status: outcome.notFound ? 404 : 502 }
    );
  }
  return NextResponse.json({ ok: true, removed: id, commitSha: outcome.commitSha });
}

export async function GET() {
  return NextResponse.json(
    {
      error: "method not allowed; use POST to add a node, DELETE ?id= to remove one, or GET /api/nexus to read the graph",
    },
    { status: 405 }
  );
}
