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
  /**
   * Who added it: "hermes" (the agent, via bearer token) or "admin"
   * (added from the Nexus page while signed in as admin).
   */
  source: "hermes" | "admin";
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

export const HERMES_REPO_OWNER =
  process.env.GITHUB_BLOG_REPO_OWNER || "tennysonmilesperhour";
export const HERMES_REPO_NAME = process.env.GITHUB_BLOG_REPO || "ai-catch-up";
export const HERMES_REPO_BRANCH = process.env.GITHUB_BLOG_BRANCH || "main";

/**
 * Read the store as it is on GitHub right now, so a node added a moment
 * ago shows up without waiting for the redeploy its commit triggers.
 * Falls back to the deployed file when no token is configured or GitHub
 * is slow or failing, so the Nexus page never breaks on this.
 */
export async function readHermesStoreLive(): Promise<{
  store: HermesStore;
  live: boolean;
}> {
  const token = process.env.GITHUB_BLOG_TOKEN;
  if (token) {
    try {
      const url = `https://api.github.com/repos/${HERMES_REPO_OWNER}/${HERMES_REPO_NAME}/contents/${encodeURIComponent(HERMES_FILE_PATH)}?ref=${encodeURIComponent(HERMES_REPO_BRANCH)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res.status === 404) return { store: EMPTY_STORE, live: true };
      if (res.ok) {
        const parsed = JSON.parse(await res.text()) as unknown;
        if (isHermesStoreShape(parsed)) return { store: parsed, live: true };
      } else {
        console.error("[hermes-store] live read failed", res.status);
      }
    } catch (err) {
      console.error("[hermes-store] live read failed", err);
    }
  }
  return { store: await readHermesStoreFromDisk(), live: false };
}

/** Pure helper: drop a node and every link that touches it. */
export function removeNode(store: HermesStore, id: string): HermesStore {
  return {
    ...store,
    nodes: store.nodes.filter((n) => n.id !== id),
    links: store.links.filter((l) => l.source !== id && l.target !== id),
  };
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
