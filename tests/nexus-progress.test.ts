import { test } from "node:test";
import assert from "node:assert/strict";
import type { NexusLink, NexusNode } from "@/components/admin/Nexus";
import {
  EMPTY_PROGRESS,
  observedStatus,
  rankNextMoves,
  toggleCheck,
  linkStatus,
  setLinkStatus,
} from "@/lib/nexus-progress";

const deployedApp: NexusNode = {
  id: "geck-inspect",
  label: "geck-inspect",
  domain: "apps",
  kind: "real",
  weight: 4,
  desc: "A deployed app",
  deployed: true,
  connectionChecks: ["Loads", "Logs in", "Saves"],
};
const gap: NexusNode = {
  id: "global-memory",
  label: "Global Memory",
  domain: "core",
  kind: "ghost",
  weight: 4,
  desc: "A gap",
  priority: "high",
};
const links: NexusLink[] = [{ source: "global-memory", target: "geck-inspect", strength: 0.5 }];

test("untouched node falls back to the guessed status", () => {
  const o = observedStatus(deployedApp, EMPTY_PROGRESS);
  assert.equal(o.status, "connected");
  assert.equal(o.verified, false);
});

test("unticking the last check does not restore a guessed connected status", () => {
  let p = toggleCheck(EMPTY_PROGRESS, deployedApp, 0);
  assert.equal(observedStatus(deployedApp, p).status, "partial");
  p = toggleCheck(p, deployedApp, 0);
  const o = observedStatus(deployedApp, p);
  assert.equal(o.verified, true);
  assert.equal(o.done, 0);
  assert.notEqual(o.status, "connected");
  assert.equal(o.status, "needs-setup");
});

test("a node cleared back to zero checks stays in Next 3 moves", () => {
  let p = toggleCheck(EMPTY_PROGRESS, deployedApp, 1);
  p = toggleCheck(p, deployedApp, 1);
  const ids = rankNextMoves([deployedApp, gap], links, p).map((m) => m.node.id);
  assert.ok(ids.includes("geck-inspect"));
  assert.ok(ids.includes("global-memory"));
});

test("all checks ticked means connected and drops out of moves", () => {
  let p = EMPTY_PROGRESS;
  for (let i = 0; i < 3; i++) p = toggleCheck(p, deployedApp, i);
  assert.equal(observedStatus(deployedApp, p).status, "connected");
  const ids = rankNextMoves([deployedApp, gap], links, p).map((m) => m.node.id);
  assert.ok(!ids.includes("geck-inspect"));
});

test("a link touching a gap is potential until overridden", () => {
  const byId = new Map([deployedApp, gap].map((n) => [n.id, n]));
  assert.equal(linkStatus(links[0], byId, EMPTY_PROGRESS), "potential");
  const p = setLinkStatus(EMPTY_PROGRESS, links[0], "wired");
  assert.equal(linkStatus(links[0], byId, p), "wired");
});

test("renaming an addition carries its ticks and link overrides at both ends", async () => {
  const { renameInProgress } = await import("@/lib/nexus-progress");
  const p = {
    version: 1 as const,
    checks: { editor: [true], other: [false, true] },
    links: {
      "editor->geck-inspect": "potential" as const,
      "notes->editor": "wired" as const,
      "notes->cursor": "potential" as const,
      "x->y": "wired" as const,
    },
  };
  const out = renameInProgress(
    p,
    new Map([
      ["editor", "editor-2"],
      ["cursor", "cursor-3"],
      ["notes", "notes"],
    ])
  );
  assert.deepEqual(out.checks, { "editor-2": [true], other: [false, true] });
  assert.deepEqual(out.links, {
    "editor-2->geck-inspect": "potential",
    "notes->editor-2": "wired",
    "notes->cursor-3": "potential",
    "x->y": "wired",
  });
  // The override still applies after the rename.
  const editor2 = { ...deployedApp, id: "editor-2", kind: "ghost" as const };
  const byId = new Map([editor2, deployedApp].map((n) => [n.id, n]));
  assert.equal(
    linkStatus({ source: "editor-2", target: "geck-inspect", strength: 0.3 }, byId, out),
    "potential"
  );
});

test("an unchanged id map leaves progress untouched", async () => {
  const { renameInProgress } = await import("@/lib/nexus-progress");
  const p = toggleCheck(EMPTY_PROGRESS, deployedApp, 0);
  assert.equal(renameInProgress(p, new Map([["geck-inspect", "geck-inspect"]])), p);
});
