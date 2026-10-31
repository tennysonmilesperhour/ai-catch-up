// Observed progress on the Nexus map: which connection checks have been
// ticked, which links are actually wired, and what to do next.
//
// Before this, every node's status was a guess from its kind (every fork
// "partial", every high-priority gap "needs setup"). Now a node's status
// comes from the boxes the admin actually ticked, and the guess is only a
// fallback, labelled as such.
//
// Everything here is pure except load/save, which use localStorage. Ticks
// are saved per browser for now; moving them to the server is the same
// open decision as the buyer workspace (ship-plan Phase 2).

import type { NexusLink, NexusNode } from "@/components/admin/Nexus";
import {
  deriveConnectionStatus,
  type ConnectionStatus,
} from "@/lib/nexus-status";

export type LinkStatus = "wired" | "potential";

export type NexusProgress = {
  version: 1;
  /** nodeId -> one boolean per entry in checksFor(node). */
  checks: Record<string, boolean[]>;
  /** linkKey -> admin override of the derived wired/potential status. */
  links: Record<string, LinkStatus>;
};

export const EMPTY_PROGRESS: NexusProgress = {
  version: 1,
  checks: {},
  links: {},
};

const STORAGE_KEY = "nexus-progress-v1";

/** Used for nodes whose data file does not list their own checks. */
export const DEFAULT_CHECK = "Set up and working for me";

export function checksFor(node: NexusNode): string[] {
  return node.connectionChecks && node.connectionChecks.length > 0
    ? node.connectionChecks
    : [DEFAULT_CHECK];
}

export function linkKey(l: { source: string; target: string }): string {
  return `${l.source}->${l.target}`;
}

export type ObservedStatus = {
  status: ConnectionStatus;
  /** True when the status comes from ticked checks, false when guessed. */
  verified: boolean;
  done: number;
  total: number;
};

export function observedStatus(
  node: NexusNode,
  progress: NexusProgress
): ObservedStatus {
  const total = checksFor(node).length;
  const saved = progress.checks[node.id];
  const ticks = saved ?? [];
  let done = 0;
  for (let i = 0; i < total; i++) if (ticks[i]) done++;
  if (!saved) {
    // Never touched: fall back to the guess from the data file.
    return { status: deriveConnectionStatus(node), verified: false, done, total };
  }
  if (done === 0) {
    // Touched and every box is clear: the admin is saying none of these
    // are true, which beats any guess (including a guessed "connected").
    const important =
      node.kind !== "ghost" || node.priority === "high";
    return {
      status: important ? "needs-setup" : "not-installed",
      verified: true,
      done,
      total,
    };
  }
  return {
    status: done >= total ? "connected" : "partial",
    verified: true,
    done,
    total,
  };
}

export function toggleCheck(
  progress: NexusProgress,
  node: NexusNode,
  index: number
): NexusProgress {
  const total = checksFor(node).length;
  const current = progress.checks[node.id] ?? [];
  const next = Array.from({ length: total }, (_, i) => !!current[i]);
  next[index] = !next[index];
  return { ...progress, checks: { ...progress.checks, [node.id]: next } };
}

/** A node counts as "something you have" if it is real, a fork, or verified connected. */
export function isHave(node: NexusNode, progress: NexusProgress): boolean {
  if (node.kind === "real" || node.kind === "fork") return true;
  return observedStatus(node, progress).status === "connected";
}

/**
 * Wired vs potential. Order: the admin's override, then the data file's
 * `status`, then a rule: a link that touches something you do not have
 * yet cannot be wired, so it is potential; anything else defaults to wired.
 */
export function linkStatus(
  link: NexusLink,
  nodesById: Map<string, NexusNode>,
  progress: NexusProgress
): LinkStatus {
  const override = progress.links[linkKey(link)];
  if (override) return override;
  if (link.status) return link.status;
  const a = nodesById.get(link.source);
  const b = nodesById.get(link.target);
  if (!a || !b) return "potential";
  return isHave(a, progress) && isHave(b, progress) ? "wired" : "potential";
}

export function setLinkStatus(
  progress: NexusProgress,
  link: NexusLink,
  status: LinkStatus
): NexusProgress {
  return { ...progress, links: { ...progress.links, [linkKey(link)]: status } };
}

export type NextMove = {
  node: NexusNode;
  score: number;
  /** Ids of things you already have that this move connects to. */
  reachIds: string[];
  observed: ObservedStatus;
  reason: string;
};

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

/**
 * Rank what to do next. Candidates are gaps (ghost nodes you have not
 * verified) and anything you started but did not finish (some checks
 * ticked, not all). Score = priority weight x (1 + how many things you
 * already have it connects to), so a high-priority gap that touches five
 * of your tools beats a low-priority one floating alone.
 */
export function rankNextMoves(
  nodes: NexusNode[],
  links: NexusLink[],
  progress: NexusProgress,
  limit = 3
): NextMove[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighbors = new Map<string, Set<string>>();
  for (const l of links) {
    if (!byId.has(l.source) || !byId.has(l.target)) continue;
    if (!neighbors.has(l.source)) neighbors.set(l.source, new Set());
    if (!neighbors.has(l.target)) neighbors.set(l.target, new Set());
    neighbors.get(l.source)!.add(l.target);
    neighbors.get(l.target)!.add(l.source);
  }

  const moves: NextMove[] = [];
  for (const node of nodes) {
    const observed = observedStatus(node, progress);
    if (observed.status === "connected") continue;
    // Gaps, plus anything the admin has checked and found not fully working.
    const startedNotFinished = observed.verified;
    if (node.kind !== "ghost" && !startedNotFinished) continue;

    const reachIds = [...(neighbors.get(node.id) ?? [])].filter((id) => {
      const n = byId.get(id);
      return n ? isHave(n, progress) : false;
    });
    const weight = startedNotFinished
      ? 2.5
      : PRIORITY_WEIGHT[node.priority ?? "low"] ?? 1;
    const score = weight * (1 + reachIds.length);

    const parts: string[] = [];
    if (startedNotFinished && observed.done > 0) {
      parts.push(`Started: ${observed.done} of ${observed.total} checks done`);
    } else if (startedNotFinished) {
      parts.push(`Checked: 0 of ${observed.total} checks true`);
    } else if (node.priority === "high") {
      parts.push("High-priority gap");
    } else {
      parts.push("Gap");
    }
    parts.push(
      reachIds.length === 0
        ? "not linked to anything you have yet"
        : `connects ${reachIds.length} thing${reachIds.length === 1 ? "" : "s"} you already use`
    );

    moves.push({ node, score, reachIds, observed, reason: parts.join(", ") });
  }

  moves.sort(
    (a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label)
  );
  return moves.slice(0, limit);
}

export type IntegrationScore = {
  checksDone: number;
  checksTotal: number;
  wired: number;
  linksTotal: number;
};

export function integrationScore(
  nodes: NexusNode[],
  links: NexusLink[],
  progress: NexusProgress
): IntegrationScore {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let checksDone = 0;
  let checksTotal = 0;
  for (const n of nodes) {
    const o = observedStatus(n, progress);
    checksDone += o.done;
    checksTotal += o.total;
  }
  let wired = 0;
  let linksTotal = 0;
  for (const l of links) {
    if (!byId.has(l.source) || !byId.has(l.target)) continue;
    linksTotal++;
    if (linkStatus(l, byId, progress) === "wired") wired++;
  }
  return { checksDone, checksTotal, wired, linksTotal };
}

/** A ready-to-paste prompt for wiring two things together. */
export function wiringPrompt(a: NexusNode, b: NexusNode): string {
  return [
    `I use ${a.label} and ${b.label} and want them to work together.`,
    "",
    `${a.label}: ${a.desc}`,
    `${b.label}: ${b.desc}`,
    "",
    "Explain in plain language what connecting them would let me do, then give me the smallest set of steps to wire them up, and tell me how I will know it is working.",
  ].join("\n");
}

function isProgressShape(v: unknown): v is NexusProgress {
  if (!v || typeof v !== "object") return false;
  const p = v as Partial<NexusProgress>;
  return (
    p.version === 1 &&
    !!p.checks &&
    typeof p.checks === "object" &&
    !!p.links &&
    typeof p.links === "object"
  );
}

export function loadProgress(): NexusProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as unknown;
    return isProgressShape(parsed) ? parsed : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: NexusProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error("Failed to save Nexus progress:", err);
  }
}
