// Saving a Nexus addition from the admin page to the server store without
// ever overwriting a node someone else already saved under the same id.
//
// Two browsers can create a local addition with the same name and so the
// same slug. Before this, syncing the second one silently replaced the
// first on the server. Now the client sends `createOnly`, the server
// refuses (409) when the id is taken, and the client renames
// (`name-2`, `name-3`, ...) and tries again.

import type { NexusLink, NexusNode } from "@/components/admin/Nexus";

/**
 * Pure helper: an id based on `base` that is not in `taken`
 * (`base`, then `base-2`, `base-3`, ...). Ids stay within the 61-char
 * slug limit the API enforces.
 */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = base.slice(0, 54) || "node";
  if (!used.has(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
}

export type Addition = {
  id: string;
  label: string;
  domain: string;
  kind: "real" | "ghost" | "fork";
  weight: number;
  desc: string;
  connectsTo?: string[];
};

export type PostResult =
  | { ok: true; node?: NexusNode; links?: NexusLink[] }
  | { ok: false; status: number; error: string; conflict?: boolean };

/** Sends one create-only POST. Injected so the logic can be tested. */
export type PostFn = (body: unknown) => Promise<PostResult>;

export type SyncResult =
  | { ok: true; id: string; renamedFrom?: string; node: NexusNode; links: NexusLink[] }
  | { ok: false; error: string };

export function linksFor(id: string, connectsTo: string[] | undefined): NexusLink[] {
  return (connectsTo ?? []).map((target) => ({ source: id, target, strength: 0.3 }));
}

/**
 * Save `a` to the server. `takenIds` is every id this page already knows
 * the server has; an id in there is renamed before sending. If the server
 * still reports a conflict (another browser saved in the meantime), the
 * addition is renamed and retried, up to `maxAttempts` sends.
 *
 * `reservedIds` are ids that must not be picked as a replacement (this
 * browser's other local additions) but do not by themselves force `a` to
 * be renamed. Without it, syncing local `cursor` when the server has
 * `cursor` could pick `cursor-2` and swallow a local `cursor-2`.
 */
export async function syncAddition(
  a: Addition,
  takenIds: Iterable<string>,
  post: PostFn,
  options: { reservedIds?: Iterable<string>; maxAttempts?: number } = {}
): Promise<SyncResult> {
  const maxAttempts = options.maxAttempts ?? 4;
  const taken = new Set(takenIds);
  const avoid = new Set([...taken, ...(options.reservedIds ?? [])]);
  avoid.delete(a.id);
  let id = taken.has(a.id) ? uniqueId(a.id, [...avoid, a.id]) : a.id;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const links = linksFor(id, a.connectsTo);
    const result = await post({
      node: {
        id,
        label: a.label,
        domain: a.domain,
        kind: a.kind,
        weight: a.weight,
        desc: a.desc,
      },
      links,
      createOnly: true,
    });
    if (result.ok) {
      const node: NexusNode = result.node ?? {
        id,
        label: a.label,
        domain: a.domain,
        kind: a.kind,
        weight: a.weight,
        desc: a.desc,
        source: "admin",
      };
      return {
        ok: true,
        id,
        ...(id !== a.id ? { renamedFrom: a.id } : {}),
        node,
        links: result.links ?? links,
      };
    }
    if (!result.conflict) return { ok: false, error: result.error };
    avoid.add(id);
    id = uniqueId(a.id, avoid);
  }
  return { ok: false, error: "could not find a free id, try a different name" };
}

export type SyncedAddition = {
  /** The id it had on this device. */
  localId: string;
  result: Extract<SyncResult, { ok: true }>;
};

/**
 * Sync one local addition plus any other local (not yet synced) additions
 * it connects to, dependencies first, so every saved link points at the
 * final server id of its target. Without this, syncing `editor -> cursor`
 * before `cursor` saved a link to whatever node already owned `cursor`
 * on the server if `cursor` was later renamed.
 *
 * A cycle (`a -> b -> a`) is broken by leaving out the back edge: the
 * other direction is saved, and the map draws links both ways anyway.
 * Stops at the first failure; what was saved before it is returned.
 */
export async function syncWithDependencies(
  rootId: string,
  locals: Addition[],
  takenIds: Iterable<string>,
  post: PostFn
): Promise<{ synced: SyncedAddition[]; error?: string }> {
  const byId = new Map(locals.map((a) => [a.id, a]));
  const finalId = new Map<string, string>();
  const inProgress = new Set<string>();
  const taken = new Set(takenIds);
  const synced: SyncedAddition[] = [];

  async function visit(id: string): Promise<string | null> {
    const done = finalId.get(id);
    if (done) return null;
    const a = byId.get(id);
    if (!a) return null;
    inProgress.add(id);
    const connectsTo: string[] = [];
    for (const target of a.connectsTo ?? []) {
      if (!byId.has(target)) {
        connectsTo.push(target);
        continue;
      }
      if (inProgress.has(target)) continue; // back edge of a cycle
      const err = await visit(target);
      if (err) return err;
      connectsTo.push(finalId.get(target) ?? target);
    }
    const reservedIds = locals
      .filter((x) => x.id !== id && !finalId.has(x.id))
      .map((x) => x.id);
    const result = await syncAddition({ ...a, connectsTo }, taken, post, {
      reservedIds,
    });
    inProgress.delete(id);
    if (!result.ok) return result.error;
    finalId.set(id, result.id);
    taken.add(result.id);
    synced.push({ localId: id, result });
    return null;
  }

  const error = await visit(rootId);
  return error ? { synced, error } : { synced };
}

/** Map ids through a rename map, keeping order and dropping duplicates. */
export function renameIds(ids: string[], idMap: Map<string, string>): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const to = idMap.get(id) ?? id;
    if (!out.includes(to)) out.push(to);
  }
  return out;
}

/**
 * The device's local additions after a sync, built from the list as it is
 * NOW (not the snapshot the sync started from), so a Remove clicked while
 * the request was in flight stays removed. Drops what was saved, retargets
 * connects-to through renames, and keeps `unsaved` (a brand-new addition
 * whose save failed) on this device unless the latest list already has it.
 */
export function reconcileLocals<T extends { id: string; connectsTo?: string[] }>(
  latest: T[],
  idMap: Map<string, string>,
  unsaved?: T
): T[] {
  const next = latest
    .filter((x) => !idMap.has(x.id))
    .map((x) =>
      x.connectsTo?.some((t) => idMap.has(t))
        ? { ...x, connectsTo: renameIds(x.connectsTo, idMap) }
        : x
    );
  if (unsaved && !idMap.has(unsaved.id) && !next.some((x) => x.id === unsaved.id)) {
    next.push({
      ...unsaved,
      connectsTo: unsaved.connectsTo ? renameIds(unsaved.connectsTo, idMap) : unsaved.connectsTo,
    });
  }
  return next;
}
