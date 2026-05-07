// Storage layer for Hermes-authored Nexus nodes.
//
// Hermes (an external agent) reads the merged Nexus via GET /api/nexus
// and proposes additions / updates via POST /api/nexus/nodes. Those land
// as a JSON file at content/admin/hermes-nexus.json that the Nexus page
// merges in alongside the curated TypeScript data and the GitHub sync.
//
// File-on-GitHub is the source of truth (so Vercel serverless can write
// via the Contents API the same way the blog publish endpoint does).
// Local fs reads happen at request time so the admin page picks up the
// latest data without a rebuild.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { NexusNode, NexusLink } from "@/content/admin/nexus-data";

export const HERMES_FILE_PATH = "content/admin/hermes-nexus.json";

export type HermesNode = NexusNode & {
  /** Tag the source so the UI can show "from Hermes" provenance. */
  source: "hermes";
  /** ISO timestamp of when Hermes last touched this node. */
  updatedAt: string;
  /** Free-text rationale Hermes can attach when proposing. */
  hermesNote?: string;
};

export type HermesLink = NexusLink & {
  source_agent?: "hermes";
};

export type HermesStore = {
  version: 1;
  nodes: HermesNode[];
  links: HermesLink[];
};

export const EMPTY_STORE: HermesStore = {
  version: 1,
  nodes: [],
  links: [],
};

function isHermesStoreShape(value: unknown): value is HermesStore {
  if (!value || typeof value !== "object") return false;
  const v = value as { version?: unknown; nodes?: unknown; links?: unknown };
  return (
    v.version === 1 && Array.isArray(v.nodes) && Array.isArray(v.links)
  );
}

/** Read the local file (works in Node runtime; returns EMPTY_STORE on miss). */
export async function readHermesStoreFromDisk(): Promise<HermesStore> {
  const fp = path.join(process.cwd(), HERMES_FILE_PATH);
  try {
    const raw = await fs.readFile(fp, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return isHermesStoreShape(parsed) ? parsed : EMPTY_STORE;
  } catch {
    return EMPTY_STORE;
  }
}

/** Pure helper: insert or replace a node, returning the new store. */
export function upsertNode(store: HermesStore, node: HermesNode): HermesStore {
  const idx = store.nodes.findIndex((n) => n.id === node.id);
  const next = [...store.nodes];
  if (idx >= 0) next[idx] = node;
  else next.push(node);
  return { ...store, nodes: next };
}

/** Pure helper: insert a link if not already present. */
export function upsertLink(store: HermesStore, link: HermesLink): HermesStore {
  const exists = store.links.some(
    (l) => l.source === link.source && l.target === link.target
  );
  if (exists) return store;
  return { ...store, links: [...store.links, link] };
}

export function serializeStore(store: HermesStore): string {
  // Stable, pretty-printed so the GitHub diff is reviewable.
  return JSON.stringify(store, null, 2) + "\n";
}
