import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

process.env.SESSION_SECRET = "test-secret-that-is-long-enough-1234567890";
process.env.GITHUB_BLOG_TOKEN = "test-token";

const realFetch = globalThis.fetch;
let puts: string[] = [];

function mockGitHub(existingIds: string[]) {
  const store = {
    version: 1,
    nodes: existingIds.map((id) => ({
      id, label: id, domain: "apps", kind: "ghost", weight: 3, desc: "from another browser",
      source: "admin", updatedAt: "2026-10-30T00:00:00Z",
    })),
    links: [],
  };
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)) as { content: string };
      puts.push(Buffer.from(body.content, "base64").toString("utf8"));
      return new Response(JSON.stringify({ commit: { sha: "abc" }, content: { html_url: "x" } }), { status: 200 });
    }
    return new Response(
      JSON.stringify({ sha: "s1", encoding: "base64", content: Buffer.from(JSON.stringify(store)).toString("base64") }),
      { status: 200 }
    );
  }) as typeof fetch;
}

let cookie = "";
before(async () => {
  const { signSession, SESSION_COOKIE } = await import("@/lib/session");
  const token = await signSession({ email: "admin@example.com", role: "admin", iat: Math.floor(Date.now() / 1000) });
  cookie = `${SESSION_COOKIE}=${token}`;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  puts = [];
});

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/nexus/nodes", {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "sec-fetch-site": "same-origin", ...headers },
    body: JSON.stringify(body),
  });
}

const node = { id: "cursor", label: "Cursor", domain: "apps", kind: "ghost", weight: 3, desc: "mine" };

test("createOnly refuses to overwrite an existing node (409) and commits nothing", async () => {
  mockGitHub(["cursor"]);
  const { POST } = await import("@/app/api/nexus/nodes/route");
  const res = await POST(req({ node, createOnly: true }));
  assert.equal(res.status, 409);
  const json = (await res.json()) as { conflict?: boolean };
  assert.equal(json.conflict, true);
  assert.equal(puts.length, 0);
});

test("createOnly with a free id commits the node as an admin addition", async () => {
  mockGitHub(["other"]);
  const { POST } = await import("@/app/api/nexus/nodes/route");
  const res = await POST(req({ node, createOnly: true }));
  assert.equal(res.status, 200);
  assert.equal(puts.length, 1);
  const saved = JSON.parse(puts[0]) as { nodes: { id: string; source: string }[] };
  assert.deepEqual(saved.nodes.map((n) => n.id), ["other", "cursor"]);
  assert.equal(saved.nodes[1].source, "admin");
});

test("an admin cookie from another site is refused", async () => {
  mockGitHub([]);
  const { POST } = await import("@/app/api/nexus/nodes/route");
  const res = await POST(req({ node }, { "sec-fetch-site": "cross-site" }));
  assert.equal(res.status, 401);
  assert.equal(puts.length, 0);
});
