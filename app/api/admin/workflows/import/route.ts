import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import {
  extractFromJsonText,
  workflowSlug,
} from "@/lib/workflow-extract";
import {
  upsertExtraction,
  WORKFLOWS_INDEX_PATH,
  WORKFLOW_RAW_DIR,
  type WorkflowsIndex,
} from "@/lib/workflows-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only paste-import for n8n workflow JSONs (Path A).
//
// Companion to the bulk script at scripts/import-n8n.ts. Same extractor,
// just one file at a time. On commit:
//   1. Validates and parses the pasted JSON via lib/workflow-extract.
//   2. Reads content/admin/workflows.json from GitHub (Contents API).
//   3. Upserts the extracted metadata into the index (match-by-slug,
//      else falls into a target section if specified, else a per-day
//      Imports bucket).
//   4. PUTs the raw JSON to content/workflows/<slug>.json on GitHub.
//   5. PUTs the updated index back.
//
// Two GitHub commits per import. Vercel auto-redeploys on push.
//
// Modes:
//   { mode: "preview", body: "..." }                   -> extract only, no commit
//   { mode: "commit", body: "...", fileName, sectionId? }
//
// Reuses GITHUB_BLOG_TOKEN since the scope (Contents: Read/Write on
// this repo) is identical. If that ever splits, switch to a dedicated
// GITHUB_WORKFLOWS_TOKEN env var.

const REPO_OWNER =
  process.env.GITHUB_BLOG_REPO_OWNER || "tennysonmilesperhour";
const REPO_NAME = process.env.GITHUB_BLOG_REPO || "ai-catch-up";
const REPO_BRANCH = process.env.GITHUB_BLOG_BRANCH || "main";

const MAX_BODY_BYTES = 5_000_000; // 5 MB hard cap per workflow JSON

type Payload = {
  mode?: unknown;
  body?: unknown;
  fileName?: unknown;
  sectionId?: unknown;
};

type GithubFile = { sha: string; content: string; encoding: string };

async function ghGet(path: string, token: string): Promise<GithubFile | null> {
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
  return (await res.json()) as GithubFile;
}

async function ghPut(
  path: string,
  contentBase64: string,
  message: string,
  sha: string | null,
  token: string
): Promise<{ commitSha: string }> {
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
  const json = (await res.json()) as { commit?: { sha?: string } };
  return { commitSha: json.commit?.sha ?? "" };
}

function decodeContent(file: GithubFile): string {
  if (file.encoding !== "base64") {
    throw new Error(`unexpected encoding: ${file.encoding}`);
  }
  return Buffer.from(file.content, "base64").toString("utf8");
}

export async function POST(req: NextRequest) {
  // Admin auth (matches /api/admin/connections/test pattern).
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const mode = payload.mode === "commit" ? "commit" : "preview";
  const body = typeof payload.body === "string" ? payload.body : "";
  const fileName =
    typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const sectionId =
    typeof payload.sectionId === "string" && payload.sectionId.trim().length > 0
      ? payload.sectionId.trim()
      : null;

  if (!body) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `body exceeds ${MAX_BODY_BYTES} bytes` },
      { status: 400 }
    );
  }

  const result = extractFromJsonText(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // For preview, return the extracted metadata + a suggested slug.
  const slug = workflowSlug(fileName || result.metadata.name);
  if (!slug) {
    return NextResponse.json(
      { error: "could not derive a slug from fileName or workflow name" },
      { status: 400 }
    );
  }

  if (mode === "preview") {
    return NextResponse.json({
      ok: true,
      mode: "preview",
      slug,
      metadata: result.metadata,
    });
  }

  // Commit branch.
  const githubToken = process.env.GITHUB_BLOG_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      {
        error:
          "server not configured: GITHUB_BLOG_TOKEN missing (needed for commit)",
      },
      { status: 500 }
    );
  }
  if (!fileName) {
    return NextResponse.json(
      { error: "fileName required for commit mode" },
      { status: 400 }
    );
  }

  // 1. Read the current index from GitHub.
  let index: WorkflowsIndex;
  let indexSha: string | null = null;
  try {
    const file = await ghGet(WORKFLOWS_INDEX_PATH, githubToken);
    if (!file) {
      return NextResponse.json(
        {
          error: `index file ${WORKFLOWS_INDEX_PATH} missing on remote; run the scaffold first`,
        },
        { status: 500 }
      );
    }
    indexSha = file.sha;
    const indexText = decodeContent(file);
    index = JSON.parse(indexText) as WorkflowsIndex;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "github fetch failed" },
      { status: 502 }
    );
  }

  // 2. Upsert metadata locally (in-memory).
  const rawPath = `${WORKFLOW_RAW_DIR}/${slug}.json`;
  const upsert = upsertExtraction(index, slug, {
    fileName,
    rawPath,
    fileSize: Buffer.byteLength(body, "utf8"),
    extracted: result.metadata,
    targetSectionId: sectionId ?? undefined,
  });

  // 3. Commit raw JSON.
  let rawSha: string | null = null;
  try {
    const existing = await ghGet(rawPath, githubToken);
    rawSha = existing?.sha ?? null;
  } catch {
    rawSha = null;
  }
  try {
    await ghPut(
      rawPath,
      Buffer.from(body, "utf8").toString("base64"),
      `workflows: import ${slug}`,
      rawSha,
      githubToken
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `raw JSON put failed: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 502 }
    );
  }

  // 4. Commit the updated index.
  const indexBody =
    Buffer.from(JSON.stringify(index, null, 2) + "\n", "utf8").toString(
      "base64"
    );
  let indexCommit = "";
  try {
    const out = await ghPut(
      WORKFLOWS_INDEX_PATH,
      indexBody,
      `workflows: index ${slug}`,
      indexSha,
      githubToken
    );
    indexCommit = out.commitSha;
  } catch (err) {
    return NextResponse.json(
      {
        error: `index put failed: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "commit",
    slug,
    sectionId: upsert.sectionId,
    matchedExistingSection: upsert.found,
    metadata: result.metadata,
    rawPath,
    indexCommit,
    detailUrl: `/admin/workflows/${slug}`,
  });
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
