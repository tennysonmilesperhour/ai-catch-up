import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readHermesStoreLive, resetHermesReadCache } from "@/lib/hermes-store";

process.env.GITHUB_BLOG_TOKEN = "test-token";
const realFetch = globalThis.fetch;
let calls = 0;

function mockGitHub() {
  calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response(JSON.stringify({ version: 1, nodes: [], links: [] }), { status: 200 });
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  resetHermesReadCache();
});

test("public reads share one GitHub request within the cache window", async () => {
  mockGitHub();
  const results = await Promise.all(
    Array.from({ length: 20 }, () => readHermesStoreLive({ cacheSeconds: 60 }))
  );
  await readHermesStoreLive({ cacheSeconds: 60 });
  assert.equal(calls, 1);
  assert.ok(results.every((r) => r.live));
});

test("public reads go back to GitHub once the window has passed", async () => {
  mockGitHub();
  await readHermesStoreLive({ cacheSeconds: 0.05 });
  await new Promise((r) => setTimeout(r, 80));
  await readHermesStoreLive({ cacheSeconds: 0.05 });
  assert.equal(calls, 2);
});

test("the admin read (no cacheSeconds) is always fresh", async () => {
  mockGitHub();
  await readHermesStoreLive({ cacheSeconds: 60 });
  await readHermesStoreLive();
  await readHermesStoreLive();
  assert.equal(calls, 3);
});
