"use client";

import { useEffect, useState } from "react";

type SectionOption = { id: string; name: string; date: string };
type Props = { sections: SectionOption[] };

type Preview = {
  slug: string;
  metadata: {
    name: string;
    nodeCount: number;
    nodeTypes: string[];
    triggerTypes: string[];
    credentialTypes: string[];
    llmModels: string[];
    httpHosts: string[];
    tags: string[];
    complexity: string;
    stickyNotesCount: number;
    connectionCount: number;
    fanoutCount: number;
    webhookPaths: string[];
  };
};

type CommitResult = {
  slug: string;
  sectionId: string | null;
  matchedExistingSection: boolean;
  detailUrl: string;
};

export function WorkflowImportLauncher({ sections }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [busy, setBusy] = useState<"idle" | "preview" | "commit">("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<CommitResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setBody("");
    setFileName("");
    setSectionId("");
    setPreview(null);
    setError(null);
    setCommitted(null);
    setBusy("idle");
  }

  async function handlePreview() {
    if (!body.trim()) {
      setError("paste the workflow JSON first");
      return;
    }
    setBusy("preview");
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/admin/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview", body, fileName }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(String(json.error ?? `request failed (${res.status})`));
      } else {
        setPreview(json as unknown as Preview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy("idle");
    }
  }

  async function handleCommit() {
    if (!preview) {
      setError("run preview first");
      return;
    }
    if (!fileName.trim()) {
      setError("file name required for commit");
      return;
    }
    setBusy("commit");
    setError(null);
    try {
      const res = await fetch("/api/admin/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "commit",
          body,
          fileName,
          sectionId: sectionId || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(String(json.error ?? `request failed (${res.status})`));
      } else {
        setCommitted(json as unknown as CommitResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[rgba(251,191,36,0.08)] transition-colors cursor-pointer"
      >
        Paste workflow
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[rgba(2,6,14,0.7)] backdrop-blur-sm"
          />
          <div
            className="relative glass-card max-w-2xl w-full p-6 md:p-8 flex flex-col gap-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="label text-[var(--color-terracotta)] mb-2">
                  Import workflow
                </p>
                <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)]">
                  Paste an n8n workflow JSON.
                </h2>
                <p className="text-sm text-[var(--color-muted-dark)] mt-2 leading-relaxed">
                  Preview first. Commit writes the raw JSON to git and updates
                  the library index.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                aria-label="Close"
                className="font-mono text-2xl text-[var(--color-muted)] hover:text-[var(--color-dark)] cursor-pointer leading-none"
              >
                ×
              </button>
            </header>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
                  File name
                </span>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Gamma Proposal Generation.json"
                  className="px-3 py-2 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[8px] text-[var(--color-dark)] placeholder:text-[var(--color-muted)] font-mono text-xs focus:outline-none focus:border-[var(--color-terracotta)]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
                  Section (optional)
                </span>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="px-3 py-2 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[8px] text-[var(--color-dark)] font-mono text-xs focus:outline-none focus:border-[var(--color-terracotta)] cursor-pointer"
                >
                  <option value="">match by slug, else Imports/today</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.date})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
                Workflow JSON
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                spellCheck={false}
                placeholder='{"name": "...", "nodes": [...]}'
                className="px-3 py-2 bg-[rgba(2,6,14,0.7)] border border-[var(--color-border-dark)] rounded-[8px] text-[var(--color-dark)] placeholder:text-[var(--color-muted)] font-mono text-[11px] leading-snug focus:outline-none focus:border-[var(--color-terracotta)] resize-y"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={busy !== "idle"}
                className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[rgba(95,255,215,0.08)] cursor-pointer disabled:opacity-50 disabled:cursor-wait transition-colors"
              >
                {busy === "preview" ? "Extracting..." : "Extract preview"}
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={!preview || busy !== "idle"}
                className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[rgba(251,191,36,0.08)] cursor-pointer disabled:opacity-50 disabled:cursor-wait transition-colors"
              >
                {busy === "commit" ? "Committing..." : "Commit to library"}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-[8px] border border-[var(--color-magenta)] bg-[rgba(255,95,179,0.05)] px-3 py-2 text-sm text-[var(--color-magenta)]"
              >
                {error}
              </div>
            )}

            {preview && !committed && (
              <div className="rounded-[8px] border border-[var(--color-cyan)] bg-[rgba(95,255,215,0.04)] px-3 py-3 flex flex-col gap-2 text-xs text-[var(--color-muted-dark)]">
                <p className="text-[var(--color-cyan)]">
                  <span className="font-semibold">{preview.metadata.name}</span>{" "}
                 , slug: <span className="font-mono">{preview.slug}</span>
                </p>
                <p>
                  {preview.metadata.complexity} ({preview.metadata.nodeCount}{" "}
                  nodes, {preview.metadata.connectionCount} connections,{" "}
                  {preview.metadata.stickyNotesCount} stickies)
                </p>
                {preview.metadata.tags.length > 0 && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.10em]">
                    {preview.metadata.tags.join(" / ")}
                  </p>
                )}
                {preview.metadata.credentialTypes.length > 0 && (
                  <p>
                    creds:{" "}
                    <span className="text-[var(--color-magenta)] font-mono">
                      {preview.metadata.credentialTypes.join(", ")}
                    </span>
                  </p>
                )}
                {preview.metadata.llmModels.length > 0 && (
                  <p>
                    models:{" "}
                    <span className="text-[var(--color-violet)] font-mono">
                      {preview.metadata.llmModels.join(", ")}
                    </span>
                  </p>
                )}
              </div>
            )}

            {committed && (
              <div className="rounded-[8px] border border-[var(--color-organic)] bg-[rgba(74,222,128,0.05)] px-3 py-3 flex flex-col gap-2 text-sm text-[var(--color-organic)]">
                <p>
                  <span className="font-semibold">Committed.</span> Slug{" "}
                  <span className="font-mono">{committed.slug}</span>
                  {committed.matchedExistingSection
                    ? ` matched ${committed.sectionId ?? "?"}.`
                    : ` added to ${committed.sectionId ?? "Imports"}.`}
                </p>
                <p className="text-xs text-[var(--color-muted-dark)]">
                  Vercel will redeploy in a moment. Refresh the library to see
                  it.
                </p>
                <a
                  href={committed.detailUrl}
                  className="self-start font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[rgba(251,191,36,0.08)] transition-colors"
                >
                  Open detail (post-redeploy) &rarr;
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
