import { test } from "node:test";
import assert from "node:assert/strict";
import { syncAddition, uniqueId, type PostResult } from "@/lib/nexus-sync";

const addition = {
  id: "cursor",
  label: "Cursor",
  domain: "must-have",
  kind: "ghost" as const,
  weight: 3,
  desc: "Editor",
  connectsTo: ["geck-inspect"],
};

test("uniqueId suffixes until free", () => {
  assert.equal(uniqueId("cursor", []), "cursor");
  assert.equal(uniqueId("cursor", ["cursor", "cursor-2"]), "cursor-3");
});

test("an id the server already has is renamed before sending, links follow", async () => {
  const sent: { node: { id: string }; links: { source: string }[]; createOnly: boolean }[] = [];
  const result = await syncAddition(addition, ["cursor"], async (body) => {
    sent.push(body as (typeof sent)[number]);
    return { ok: true };
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].node.id, "cursor-2");
  assert.equal(sent[0].createOnly, true);
  assert.equal(sent[0].links[0].source, "cursor-2");
  assert.ok(result.ok && result.id === "cursor-2" && result.renamedFrom === "cursor");
});

test("a server conflict (saved meanwhile elsewhere) renames and retries instead of overwriting", async () => {
  const serverIds = new Set(["cursor"]);
  const post = async (body: unknown): Promise<PostResult> => {
    const id = (body as { node: { id: string } }).node.id;
    if (serverIds.has(id)) return { ok: false, status: 409, error: "taken", conflict: true };
    serverIds.add(id);
    return { ok: true };
  };
  // The page does not know about "cursor" yet, so the first try collides.
  const result = await syncAddition(addition, [], post);
  assert.ok(result.ok);
  assert.equal(result.ok && result.id, "cursor-2");
  assert.deepEqual([...serverIds].sort(), ["cursor", "cursor-2"]);
});

test("a non-conflict failure stops without retrying", async () => {
  let calls = 0;
  const result = await syncAddition(addition, [], async () => {
    calls++;
    return { ok: false, status: 500, error: "server not configured" };
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { ok: false, error: "server not configured" });
});

test("a replacement id never takes another local addition's id", async () => {
  const sent: string[] = [];
  // Server has `cursor`; this browser also has a local `cursor-2`.
  const result = await syncAddition(
    addition,
    ["cursor"],
    async (body) => {
      sent.push((body as { node: { id: string } }).node.id);
      return { ok: true };
    },
    { reservedIds: ["cursor-2"] }
  );
  assert.deepEqual(sent, ["cursor-3"]);
  assert.ok(result.ok && result.id === "cursor-3");
});

test("a reserved id on retry is skipped too", async () => {
  const sent: string[] = [];
  const result = await syncAddition(
    addition,
    [],
    async (body) => {
      const id = (body as { node: { id: string } }).node.id;
      sent.push(id);
      return id === "cursor"
        ? { ok: false, status: 409, error: "taken", conflict: true }
        : { ok: true };
    },
    { reservedIds: ["cursor-2"] }
  );
  assert.deepEqual(sent, ["cursor", "cursor-3"]);
  assert.ok(result.ok && result.id === "cursor-3");
});

test("reserved ids alone do not rename a node whose own id is free", async () => {
  const sent: string[] = [];
  await syncAddition(addition, [], async (body) => {
    sent.push((body as { node: { id: string } }).node.id);
    return { ok: true };
  }, { reservedIds: ["cursor-2", "cursor"] });
  assert.deepEqual(sent, ["cursor"]);
});

test("dependencies sync first so saved links use their final ids", async () => {
  const { syncWithDependencies } = await import("@/lib/nexus-sync");
  const server = new Map<string, { links: { source: string; target: string }[] }>([
    ["cursor", { links: [] }], // another browser already saved its own cursor
  ]);
  const post = async (body: unknown): Promise<PostResult> => {
    const b = body as { node: { id: string }; links: { source: string; target: string }[] };
    if (server.has(b.node.id)) return { ok: false, status: 409, error: "taken", conflict: true };
    server.set(b.node.id, { links: b.links });
    return { ok: true };
  };
  const locals = [
    { ...addition, id: "editor", label: "Editor", connectsTo: ["cursor", "geck-inspect"] },
    { ...addition, id: "cursor", connectsTo: [] },
  ];
  // The page does not yet know the server has "cursor".
  const out = await syncWithDependencies("editor", locals, [], post);
  assert.equal(out.error, undefined);
  assert.deepEqual(out.synced.map((s) => [s.localId, s.result.id]), [
    ["cursor", "cursor-2"],
    ["editor", "editor"],
  ]);
  assert.deepEqual(
    server.get("editor")!.links.map((l) => l.target),
    ["cursor-2", "geck-inspect"]
  );
});

test("a cycle between local additions saves one direction and terminates", async () => {
  const { syncWithDependencies } = await import("@/lib/nexus-sync");
  const saved: { id: string; targets: string[] }[] = [];
  const post = async (body: unknown): Promise<PostResult> => {
    const b = body as { node: { id: string }; links: { target: string }[] };
    saved.push({ id: b.node.id, targets: b.links.map((l) => l.target) });
    return { ok: true };
  };
  const locals = [
    { ...addition, id: "a", connectsTo: ["b"] },
    { ...addition, id: "b", connectsTo: ["a"] },
  ];
  const out = await syncWithDependencies("a", locals, [], post);
  assert.equal(out.synced.length, 2);
  assert.deepEqual(saved, [
    { id: "b", targets: [] },
    { id: "a", targets: ["b"] },
  ]);
});

test("renameIds retargets selected ids (open form picks, connects-to lists)", async () => {
  const { renameIds } = await import("@/lib/nexus-sync");
  const idMap = new Map([["cursor", "cursor-2"], ["notes", "notes"]]);
  assert.deepEqual(renameIds(["cursor", "geck-inspect", "notes"], idMap), [
    "cursor-2",
    "geck-inspect",
    "notes",
  ]);
  // A pick of both the old and already-renamed id collapses to one.
  assert.deepEqual(renameIds(["cursor", "cursor-2"], idMap), ["cursor-2"]);
});
