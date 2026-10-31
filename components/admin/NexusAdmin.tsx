"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Nexus,
  type DomainsRecord,
  type NexusLink,
  type NexusNode,
} from "@/components/admin/Nexus";
import { Nexus3D } from "@/components/admin/Nexus3D";
import { NexusNextMoves } from "@/components/admin/NexusNextMoves";
import { StepsModal } from "@/components/shared/StepsModal";
import {
  linksFor,
  renameIds,
  syncWithDependencies,
  type PostResult,
} from "@/lib/nexus-sync";
import {
  EMPTY_PROGRESS,
  integrationScore,
  linkStatus,
  loadProgress,
  observedStatus,
  rankNextMoves,
  renameInProgress,
  saveProgress,
  setLinkStatus,
  toggleCheck,
  type LinkStatus,
  type NexusProgress,
} from "@/lib/nexus-progress";
import {
  FILTER_OPTIONS,
  filterMatches,
  type NexusFilter,
} from "@/lib/nexus-filter";

const STORAGE_KEY = "nexus-custom-nodes-v1";
const VIEW_STORAGE_KEY = "nexus-view-mode-v1";
const FILTER_STORAGE_KEY = "nexus-filter-v1";
const SKILLS_STORAGE_KEY = "nexus-skills-active-v1";

type CustomAddition = {
  id: string;
  label: string;
  domain: string;
  kind: "real" | "ghost" | "fork";
  weight: number;
  desc: string;
  createdAt: string;
  /** Ids of existing nodes this one links to. Older entries lack it. */
  connectsTo?: string[];
};

type Props = {
  domains: DomainsRecord;
  nodes: NexusNode[];
  links: NexusLink[];
  /** True when the server can save additions (GITHUB_BLOG_TOKEN is set). */
  serverWrites?: boolean;
};

async function postNode(body: unknown): Promise<PostResult> {
  try {
    const res = await fetch("/api/nexus/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      conflict?: boolean;
      node?: NexusNode;
      links?: NexusLink[];
    };
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json.error || `HTTP ${res.status}`,
        conflict: res.status === 409 && json.conflict === true,
      };
    }
    return { ok: true, node: json.node, links: json.links };
  } catch {
    return { ok: false, status: 0, error: "network error" };
  }
}

function loadCustom(): CustomAddition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomAddition[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustom(list: CustomAddition[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function NexusAdmin({
  domains,
  nodes,
  links,
  serverWrites = false,
}: Props) {
  const [custom, setCustom] = useState<CustomAddition[]>([]);
  // Nodes saved to the server this visit. The server read already
  // includes them on the next page load; this shows them immediately.
  const [serverAdded, setServerAdded] = useState<{
    nodes: NexusNode[];
    links: NexusLink[];
  }>({ nodes: [], links: [] });
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectsTo, setConnectsTo] = useState<string[]>([]);
  const [connectQuery, setConnectQuery] = useState("");
  const [progress, setProgress] = useState<NexusProgress>(EMPTY_PROGRESS);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [stepsContent, setStepsContent] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [domainKey, setDomainKey] = useState<string>("must-have");
  const [kind, setKind] = useState<"real" | "ghost" | "fork">("ghost");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [filter, setFilter] = useState<NexusFilter>("everything");
  const [skillsActive, setSkillsActive] = useState<boolean>(false);

  useEffect(() => {
    setCustom(loadCustom());
    setProgress(loadProgress());
    if (typeof window !== "undefined") {
      const savedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (savedView === "3d" || savedView === "2d") setViewMode(savedView);
      const savedFilter = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (
        savedFilter === "everything" ||
        savedFilter === "have" ||
        savedFilter === "missing" ||
        savedFilter === "sync-tools"
      ) {
        setFilter(savedFilter);
      }
      const savedSkills = window.localStorage.getItem(SKILLS_STORAGE_KEY);
      if (savedSkills === "1") setSkillsActive(true);
    }
  }, []);

  const toggleSkills = () => {
    setSkillsActive((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SKILLS_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  const switchView = (mode: "2d" | "3d") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    }
  };

  const switchFilter = (f: NexusFilter) => {
    setFilter(f);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FILTER_STORAGE_KEY, f);
    }
  };

  const domainKeys = useMemo(() => Object.keys(domains), [domains]);

  const updateProgress = useCallback(
    (fn: (p: NexusProgress) => NexusProgress) => {
      setProgress((prev) => {
        const next = fn(prev);
        saveProgress(next);
        return next;
      });
    },
    []
  );

  // Raw graph: server data + nodes saved this visit + this browser's
  // local additions, minus anything removed this visit.
  const merged = useMemo(() => {
    const seen = new Set<string>();
    const outNodes: NexusNode[] = [];
    const push = (n: NexusNode) => {
      if (seen.has(n.id) || removedIds.has(n.id)) return;
      seen.add(n.id);
      outNodes.push(n);
    };
    nodes.forEach(push);
    serverAdded.nodes.forEach(push);
    for (const c of custom) {
      push({
        id: c.id,
        label: c.label,
        domain: c.domain,
        kind: c.kind,
        weight: c.weight,
        desc: c.desc,
      });
    }
    const linkSeen = new Set<string>();
    const outLinks: NexusLink[] = [];
    for (const l of [
      ...links,
      ...serverAdded.links,
      ...custom.flatMap((c) => linksFor(c.id, c.connectsTo)),
    ]) {
      if (!seen.has(l.source) || !seen.has(l.target)) continue;
      const k = `${l.source}->${l.target}`;
      if (linkSeen.has(k)) continue;
      linkSeen.add(k);
      outLinks.push(l);
    }
    return { nodes: outNodes, links: outLinks };
  }, [custom, nodes, links, serverAdded, removedIds]);

  const nodesById = useMemo(
    () => new Map(merged.nodes.map((n) => [n.id, n])),
    [merged.nodes]
  );

  // Observed status replaces the guess once any check is ticked, and every
  // link gets its wired/potential status. The renderers read these fields.
  const enriched = useMemo(() => {
    const eNodes = merged.nodes.map((n) => {
      const o = observedStatus(n, progress);
      return o.verified ? { ...n, connectionStatus: o.status } : n;
    });
    const eLinks = merged.links.map((l) => ({
      ...l,
      status: linkStatus(l, nodesById, progress),
    }));
    return { nodes: eNodes, links: eLinks };
  }, [merged, nodesById, progress]);

  const moves = useMemo(
    () => rankNextMoves(merged.nodes, merged.links, progress, 3),
    [merged, progress]
  );
  const score = useMemo(
    () => integrationScore(merged.nodes, merged.links, progress),
    [merged, progress]
  );

  const onToggleCheck = useCallback(
    (nodeId: string, index: number) => {
      const node = nodesById.get(nodeId);
      if (!node) return;
      updateProgress((p) => toggleCheck(p, node, index));
    },
    [nodesById, updateProgress]
  );

  const onSetLinkStatus = useCallback(
    (link: NexusLink, status: LinkStatus) => {
      updateProgress((p) => setLinkStatus(p, link, status));
    },
    [updateProgress]
  );

  const showOnMap = (id: string) => {
    setFocusId(id);
    // The 2D map can only highlight what the filter shows.
    if (!filterMatches(filter, nodesById.get(id) ?? ({} as NexusNode))) {
      switchFilter("everything");
    }
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const connectOptions = useMemo(() => {
    const q = connectQuery.trim().toLowerCase();
    return merged.nodes
      .filter((n) => !connectsTo.includes(n.id))
      .filter((n) => !q || n.label.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 8);
  }, [merged.nodes, connectsTo, connectQuery]);

  // Ids the server store is known to hold (page data plus saves this visit).
  const serverIds = useMemo(
    () => [...nodes, ...serverAdded.nodes].map((n) => n.id),
    [nodes, serverAdded.nodes]
  );

  const adminServerNodes = useMemo(
    () =>
      [...nodes, ...serverAdded.nodes].filter(
        (n, i, arr) =>
          n.source === "admin" &&
          !removedIds.has(n.id) &&
          arr.findIndex((x) => x.id === n.id) === i
      ),
    [nodes, serverAdded.nodes, removedIds]
  );

  const visible = useMemo(() => {
    const vNodes = enriched.nodes.filter((n) => filterMatches(filter, n));
    const vIds = new Set(vNodes.map((n) => n.id));
    const vLinks = enriched.links.filter(
      (l) => vIds.has(l.source) && vIds.has(l.target)
    );
    return { nodes: vNodes, links: vLinks };
  }, [enriched, filter]);

  const stats = useMemo(() => {
    const real = visible.nodes.filter((n) => n.kind === "real").length;
    const ghost = visible.nodes.filter((n) => n.kind === "ghost").length;
    const fork = visible.nodes.filter((n) => n.kind === "fork").length;
    const priority = visible.nodes.filter(
      (n) => n.kind === "ghost" && n.priority === "high"
    ).length;
    return { total: visible.nodes.length, real, ghost, fork, priority };
  }, [visible.nodes]);

  const resetForm = () => {
    setLabel("");
    setDesc("");
    setDomainKey("must-have");
    setKind("ghost");
    setConnectsTo([]);
    setConnectQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    const baseId = slugify(trimmedLabel) || `custom-${Date.now()}`;
    // Ensure id uniqueness against existing nodes and customs.
    let id = baseId;
    let suffix = 1;
    const allIds = new Set([
      ...merged.nodes.map((n) => n.id),
      ...custom.map((c) => c.id),
      ...removedIds,
    ]);
    while (allIds.has(id)) {
      suffix += 1;
      id = `${baseId}-${suffix}`;
    }
    const addition: CustomAddition = {
      id,
      label: trimmedLabel,
      domain: domainKey,
      kind,
      weight: 3,
      desc: desc.trim() || "Added from the Nexus page.",
      createdAt: new Date().toISOString(),
      connectsTo,
    };

    if (serverWrites) {
      const ok = await handleMoveToServer(addition, [...custom, addition]);
      if (ok) {
        resetForm();
        setFormOpen(false);
        return;
      }
      // On failure it was kept on this device by handleMoveToServer.
      resetForm();
      setFormOpen(false);
      return;
    }

    const next = [...custom, addition];
    setCustom(next);
    saveCustom(next);
    resetForm();
    setFormOpen(false);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("Remove this node from this device?")) return;
    const next = custom.filter((c) => c.id !== id);
    setCustom(next);
    saveCustom(next);
  };

  const handleRemoveServer = async (node: NexusNode) => {
    if (!window.confirm(`Remove "${node.label}" for every device?`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/nexus/nodes?id=${encodeURIComponent(node.id)}`,
        { method: "DELETE" }
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNotice(`Could not remove "${node.label}" (${json.error || `HTTP ${res.status}`}).`);
        return;
      }
      setRemovedIds((prev) => new Set(prev).add(node.id));
      setNotice(`Removed "${node.label}".`);
    } catch {
      setNotice(`Could not remove "${node.label}" (network error).`);
    } finally {
      setBusy(false);
    }
  };

  // Saves c plus any local additions it links to (dependencies first),
  // so every saved link points at its target's final server id. `locals`
  // is this device's additions, including c. Returns false on failure.
  const handleMoveToServer = async (
    c: CustomAddition,
    locals: CustomAddition[] = custom
  ): Promise<boolean> => {
    setBusy(true);
    const { synced, error } = await syncWithDependencies(
      c.id,
      locals,
      serverIds,
      postNode
    );
    setBusy(false);
    const idMap = new Map(synced.map((s) => [s.localId, s.result.id]));
    // Whatever was not saved stays on this device (including c on a
    // failure), with links rewritten to the ids that were saved.
    setServerAdded((prev) => ({
      nodes: [...prev.nodes, ...synced.map((s) => s.result.node)],
      links: [...prev.links, ...synced.flatMap((s) => s.result.links)],
    }));
    const next = locals
      .filter((x) => !idMap.has(x.id))
      .map((x) =>
        x.connectsTo?.some((t) => idMap.has(t))
          ? { ...x, connectsTo: renameIds(x.connectsTo, idMap) }
          : x
      );
    setCustom(next);
    saveCustom(next);
    // Everything this page keys by node id follows a rename: ticked
    // checks, link overrides at either end (renameInProgress), other local
    // additions' connects-to (above), the open add form's connects-to
    // picks and the map highlight. Pinned cards
    // and link cards close on their own when their id disappears, and
    // drag positions are re-seeded for the new id.
    if (synced.some((s) => s.result.id !== s.localId)) {
      updateProgress((p) => renameInProgress(p, idMap));
      setFocusId((f) => (f ? idMap.get(f) ?? f : f));
      setConnectsTo((prev) => renameIds(prev, idMap));
    }
    const names = synced.map((s) =>
      s.result.id !== s.localId
        ? `"${s.result.node.label}" (saved as "${s.result.id}", "${s.localId}" was taken)`
        : `"${s.result.node.label}"`
    );
    if (error) {
      setNotice(
        `Could not save "${c.label}" to the server (${error}).` +
          (names.length > 0 ? ` Saved first: ${names.join(", ")}.` : "")
      );
      return false;
    }
    setNotice(`Saved to the server, visible on every device: ${names.join(", ")}.`);
    return true;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {[
            adminServerNodes.length > 0
              ? `${adminServerNodes.length} added by you, synced`
              : null,
            custom.length > 0
              ? `${custom.length} saved on this device only`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") ||
            (serverWrites
              ? "Additions sync across devices"
              : "Additions save on this device (server sync needs GITHUB_BLOG_TOKEN)")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="View mode"
            className="flex border border-[var(--color-border)]"
          >
            <button
              type="button"
              onClick={() => switchView("2d")}
              aria-pressed={viewMode === "2d"}
              className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 transition-colors ${
                viewMode === "2d"
                  ? "bg-[var(--color-dark)] text-[var(--color-cream)]"
                  : "bg-transparent text-[var(--color-muted-dark)] hover:text-[var(--color-dark)]"
              }`}
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => switchView("3d")}
              aria-pressed={viewMode === "3d"}
              className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border-l border-[var(--color-border)] transition-colors ${
                viewMode === "3d"
                  ? "bg-[var(--color-dark)] text-[var(--color-cream)]"
                  : "bg-transparent text-[var(--color-muted-dark)] hover:text-[var(--color-dark)]"
              }`}
            >
              3D
            </button>
          </div>
          <button
            type="button"
            onClick={toggleSkills}
            aria-pressed={skillsActive}
            title={
              skillsActive
                ? "Skills layer visible. Click to fade to overlay."
                : "Skills layer is a translucent overlay. Click to bring forward."
            }
            className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border transition-colors ${
              skillsActive
                ? "bg-[#c4b5fd] text-[#1a1612] border-[#c4b5fd]"
                : "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)] hover:border-[#c4b5fd] hover:text-[#c4b5fd]"
            }`}
          >
            {skillsActive ? "Skills: on" : "Skills: overlay"}
          </button>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="self-start sm:self-auto font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border border-[var(--color-border)] text-[var(--color-dark)] glass-card-static hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            {formOpen ? "Cancel" : "Add a tool or node"}
          </button>
        </div>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="glass-card p-5 md:p-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="label text-[var(--color-muted-dark)]">
                Name
              </span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Cursor, 1Password, obsidian..."
                required
                className="px-3 py-2 bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-dark)] font-serif focus:outline-none focus:border-[var(--color-terracotta)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label text-[var(--color-muted-dark)]">
                Domain
              </span>
              <select
                value={domainKey}
                onChange={(e) => setDomainKey(e.target.value)}
                className="px-3 py-2 bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-dark)] font-serif focus:outline-none focus:border-[var(--color-terracotta)]"
              >
                {domainKeys.map((k) => (
                  <option key={k} value={k}>
                    {domains[k]?.label ?? k}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="label text-[var(--color-muted-dark)]">
                What it is
              </span>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Short description, one or two sentences."
                rows={2}
                className="px-3 py-2 bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-dark)] font-serif focus:outline-none focus:border-[var(--color-terracotta)]"
              />
            </label>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label
                htmlFor="nexus-connects-search"
                className="label text-[var(--color-muted-dark)]"
              >
                Connects to (optional)
              </label>
              {connectsTo.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {connectsTo.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setConnectsTo((prev) => prev.filter((x) => x !== id))
                      }
                      aria-label={`Remove ${nodesById.get(id)?.label ?? id}`}
                      className="font-mono text-xs px-3 py-2 border border-[var(--color-terracotta)] text-[var(--color-dark)]"
                    >
                      {nodesById.get(id)?.label ?? id} &times;
                    </button>
                  ))}
                </div>
              )}
              <input
                id="nexus-connects-search"
                type="search"
                value={connectQuery}
                onChange={(e) => setConnectQuery(e.target.value)}
                placeholder="Search the map to link it to existing tools"
                className="px-3 py-2 bg-[var(--color-cream)] border border-[var(--color-border)] text-[var(--color-dark)] font-serif focus:outline-none focus:border-[var(--color-terracotta)]"
              />
              {connectsTo.length < 12 && (
                <div className="flex flex-wrap gap-2">
                  {connectOptions.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setConnectsTo((prev) => [...prev, n.id]);
                        setConnectQuery("");
                      }}
                      className="font-mono text-xs px-3 py-2 border border-[var(--color-border)] text-[var(--color-muted-dark)] hover:border-[var(--color-dark)] hover:text-[var(--color-dark)]"
                    >
                      + {n.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <fieldset className="flex flex-col gap-1 sm:col-span-2">
              <legend className="label text-[var(--color-muted-dark)] mb-1">
                Kind
              </legend>
              <div className="flex flex-wrap gap-2">
                {(["real", "ghost", "fork"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border transition-colors ${
                      kind === k
                        ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
                        : "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)] hover:border-[var(--color-dark)]"
                    }`}
                  >
                    {k === "real"
                      ? "Already using"
                      : k === "ghost"
                        ? "Planning to"
                        : "Fork / adjacent"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="flex gap-3 self-start">
            <button
              type="submit"
              disabled={busy}
              className="font-mono text-xs uppercase tracking-[0.08em] px-4 py-2 bg-[var(--color-terracotta)] text-[var(--color-cream)] border border-[var(--color-terracotta)] hover:bg-[var(--color-rust)] hover:border-[var(--color-rust)] transition-colors"
            >
              {busy ? "Saving..." : "Add to Nexus"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
              className="font-mono text-xs uppercase tracking-[0.08em] px-4 py-2 bg-transparent text-[var(--color-muted-dark)] border border-[var(--color-border)] hover:border-[var(--color-dark)] transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="font-mono text-[10px] text-[var(--color-muted)]">
            {serverWrites
              ? "Saved to the server, so it shows on every device and in /api/nexus. Each save is a small commit to the repo."
              : "Saved in this browser only. Set GITHUB_BLOG_TOKEN on the server to sync additions across devices."}
          </p>
        </form>
      )}

      {notice && (
        <p
          role="status"
          className="font-mono text-xs text-[var(--color-dark)] border border-[var(--color-border)] px-3 py-2 flex items-start justify-between gap-3"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="text-[var(--color-muted)] hover:text-[var(--color-dark)] px-1"
          >
            &times;
          </button>
        </p>
      )}

      {(custom.length > 0 || adminServerNodes.length > 0) && (
        <details className="glass-card-static border border-[var(--color-border-light)] p-4">
          <summary className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted-dark)] cursor-pointer">
            Manage your additions
          </summary>
          <ul className="mt-4 flex flex-col gap-2">
            {adminServerNodes.map((n) => (
              <li
                key={`server-${n.id}`}
                className="flex items-center justify-between gap-4 py-1"
              >
                <div className="min-w-0">
                  <p className="font-serif text-[var(--color-dark)] truncate">
                    {n.label}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    {domains[n.domain]?.label ?? n.domain} &middot; {n.kind}{" "}
                    &middot; synced
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveServer(n)}
                  disabled={busy}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-rust)] shrink-0 py-2"
                >
                  Remove
                </button>
              </li>
            ))}
            {custom.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 py-1"
              >
                <div className="min-w-0">
                  <p className="font-serif text-[var(--color-dark)] truncate">
                    {c.label}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    {domains[c.domain]?.label ?? c.domain} &middot; {c.kind}{" "}
                    &middot; this device only
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {serverWrites && (
                    <button
                      onClick={() => handleMoveToServer(c)}
                      disabled={busy}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] py-2"
                    >
                      Sync
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-rust)] py-2"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <NexusNextMoves
        moves={moves}
        score={score}
        domains={domains}
        nodesById={nodesById}
        progress={progress}
        onToggleCheck={onToggleCheck}
        focusId={focusId}
        onFocus={setFocusId}
        onShow={showOnMap}
        onViewSteps={setStepsContent}
      />

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => switchFilter(opt.value)}
              className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border transition-colors ${
                active
                  ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
                  : "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)] hover:border-[var(--color-dark)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div ref={mapRef}>
      {viewMode === "3d" ? (
        <Nexus3D
          domains={domains}
          nodes={visible.nodes}
          links={visible.links}
          skillsActive={skillsActive}
        />
      ) : (
        <Nexus
          domains={domains}
          nodes={visible.nodes}
          links={visible.links}
          skillsActive={skillsActive}
          focusId={focusId}
          progress={progress}
          onToggleCheck={onToggleCheck}
          onSetLinkStatus={onSetLinkStatus}
        />
      )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between font-mono text-xs text-[var(--color-muted-dark)]">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span>
            <span className="text-[var(--color-dark)]">{stats.total}</span>{" "}
            nodes
          </span>
          <span>
            <span className="text-[var(--color-dark)]">{stats.real}</span> real
          </span>
          <span>
            <span className="text-[var(--color-dark)]">{stats.ghost}</span> ghost
          </span>
          <span>
            <span className="text-[var(--color-dark)]">{stats.fork}</span> fork
          </span>
          <span>
            <span className="text-[var(--color-terracotta)]">
              {stats.priority}
            </span>{" "}
            high-priority gaps
          </span>
        </div>
        <p className="text-[var(--color-muted)]">
          Click a node to pin it and tick its checks. Click a line to see
          the link. Solid = wired, dashed = potential. Ticks save in this
          browser.
        </p>
      </div>
      {stepsContent && (
        <StepsModal
          content={stepsContent}
          onClose={() => setStepsContent(null)}
        />
      )}
    </div>
  );
}
