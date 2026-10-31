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
