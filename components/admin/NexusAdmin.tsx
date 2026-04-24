"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Nexus,
  type DomainsRecord,
  type NexusLink,
  type NexusNode,
} from "@/components/admin/Nexus";
import { Nexus3D } from "@/components/admin/Nexus3D";

const STORAGE_KEY = "nexus-custom-nodes-v1";
const VIEW_STORAGE_KEY = "nexus-view-mode-v1";

type CustomAddition = {
  id: string;
  label: string;
  domain: string;
  kind: "real" | "ghost" | "fork";
  weight: number;
  desc: string;
  createdAt: string;
};

type Props = {
  domains: DomainsRecord;
  nodes: NexusNode[];
  links: NexusLink[];
};

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

export function NexusAdmin({ domains, nodes, links }: Props) {
  const [custom, setCustom] = useState<CustomAddition[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [domainKey, setDomainKey] = useState<string>("must-have");
  const [kind, setKind] = useState<"real" | "ghost" | "fork">("ghost");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  useEffect(() => {
    setCustom(loadCustom());
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "3d" || saved === "2d") setViewMode(saved);
    }
  }, []);

  const switchView = (mode: "2d" | "3d") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    }
  };

  const domainKeys = useMemo(() => Object.keys(domains), [domains]);

  const merged = useMemo(() => {
    if (custom.length === 0) return { nodes, links };
    const customNodes: NexusNode[] = custom.map((c) => ({
      id: c.id,
      label: c.label,
      domain: c.domain,
      kind: c.kind,
      weight: c.weight,
      desc: c.desc,
    }));
    return {
      nodes: [...nodes, ...customNodes],
      links,
    };
  }, [custom, nodes, links]);

  const resetForm = () => {
    setLabel("");
    setDesc("");
    setDomainKey("must-have");
    setKind("ghost");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    const baseId = slugify(trimmedLabel) || `custom-${Date.now()}`;
    // Ensure id uniqueness against existing nodes and customs.
    let id = baseId;
    let suffix = 1;
    const allIds = new Set([
      ...nodes.map((n) => n.id),
      ...custom.map((c) => c.id),
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
      desc: desc.trim() || "Added locally.",
      createdAt: new Date().toISOString(),
    };
    const next = [...custom, addition];
    setCustom(next);
    saveCustom(next);
    resetForm();
    setFormOpen(false);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("Remove this custom node?")) return;
    const next = custom.filter((c) => c.id !== id);
    setCustom(next);
    saveCustom(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {custom.length > 0
            ? `${custom.length} local addition${custom.length === 1 ? "" : "s"} on this device`
            : "No local additions on this device yet"}
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
            onClick={() => setFormOpen((v) => !v)}
            className="self-start sm:self-auto font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border border-[var(--color-border)] text-[var(--color-dark)] bg-white/60 hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            {formOpen ? "Cancel" : "Add a tool or node"}
          </button>
        </div>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/60 border border-[var(--color-border)] p-5 md:p-6 flex flex-col gap-4"
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
              className="font-mono text-xs uppercase tracking-[0.08em] px-4 py-2 bg-[var(--color-terracotta)] text-[var(--color-cream)] border border-[var(--color-terracotta)] hover:bg-[var(--color-rust)] hover:border-[var(--color-rust)] transition-colors"
            >
              Add to Nexus
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
            Saved in this browser only. Cross-device sync lands in v1.1.
          </p>
        </form>
      )}

      {custom.length > 0 && (
        <details className="bg-white/40 border border-[var(--color-border-light)] p-4">
          <summary className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted-dark)] cursor-pointer">
            Manage local additions
          </summary>
          <ul className="mt-4 flex flex-col gap-2">
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
                    {domains[c.domain]?.label ?? c.domain} &middot; {c.kind}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-rust)] shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {viewMode === "3d" ? (
        <Nexus3D
          domains={domains}
          nodes={merged.nodes}
          links={merged.links}
        />
      ) : (
        <Nexus
          domains={domains}
          nodes={merged.nodes}
          links={merged.links}
        />
      )}
    </div>
  );
}
