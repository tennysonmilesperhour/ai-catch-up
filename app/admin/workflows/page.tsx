import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { WorkflowsIndex, WorkflowFile } from "@/lib/workflows-store";
import { WorkflowImportLauncher } from "@/components/admin/WorkflowImportLauncher";

export const metadata = { title: "Workflows" };
export const dynamic = "force-dynamic";

function loadIndex(): WorkflowsIndex {
  const path = join(process.cwd(), "content/admin/workflows.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as WorkflowsIndex;
}

function statusPillClass(status: WorkflowFile["status"]): string {
  switch (status) {
    case "imported":
      return "is-done";
    case "skipped":
      return "is-not-started";
    default:
      return "is-blocked";
  }
}

function statusLabel(status: WorkflowFile["status"]): string {
  switch (status) {
    case "imported":
      return "Imported";
    case "skipped":
      return "Skipped";
    default:
      return "Pending";
  }
}

function complexityColor(c: string | undefined): string {
  if (c === "simple") return "var(--color-organic)";
  if (c === "medium") return "var(--color-cyan)";
  if (c === "complex") return "var(--color-magenta)";
  return "var(--color-muted)";
}

export default function WorkflowsPage() {
  const index = loadIndex();
  const totalFiles = index.sections.reduce(
    (acc, s) => acc + s.files.length,
    0
  );
  const importedCount = index.sections.reduce(
    (acc, s) => acc + s.files.filter((f) => f.status === "imported").length,
    0
  );
  const pendingCount = index.sections.reduce(
    (acc, s) => acc + s.files.filter((f) => f.status === "pending").length,
    0
  );

  // Pull every imported tag once for the filter chip strip.
  const allTags = new Set<string>();
  for (const s of index.sections) {
    for (const f of s.files) {
      if (f.extracted) for (const t of f.extracted.tags) allTags.add(t);
    }
  }
  const tagList = Array.from(allTags).sort();

  return (
    <div className="max-w-7xl">
      <header className="admin-header">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-3">
          Workflow library &middot; {totalFiles} files across{" "}
          {index.sections.length} sections
        </p>
        <h1 className="font-display text-3xl md:text-5xl text-[var(--color-dark)] mb-2 leading-[1.05]">
          Your n8n{" "}
          <span className="headline-gradient">workflow shelf.</span>
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl mt-3 leading-relaxed">
          Every workflow you have downloaded, parsed and tagged. Click any row
          for the full extract: nodes used, credentials, models, hosts called.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className={`status-pill is-done`}>
            {importedCount} imported
          </span>
          <span className={`status-pill is-blocked`}>
            {pendingCount} pending
          </span>
          {tagList.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] ml-2">
              tags: {tagList.join(" / ")}
            </span>
          )}
          <div className="ml-auto">
            <WorkflowImportLauncher
              sections={index.sections.map((s) => ({
                id: s.id,
                name: s.name,
                date: s.date,
              }))}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {index.sections.map((s) => (
          <section key={s.id}>
            <header className="flex items-baseline gap-3 mb-3">
              <h2 className="font-display text-base md:text-lg text-[var(--color-dark)]">
                {s.name}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {s.date} &middot; {s.files.length}{" "}
                {s.files.length === 1 ? "file" : "files"}
              </span>
            </header>
            <ul className="grid gap-3">
              {s.files.map((f) => {
                const isJson = f.type === "application/json";
                const e = f.extracted;
                return (
                  <li key={f.slug} className="glass-card p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          {isJson ? (
                            <Link
                              href={`/admin/workflows/${f.slug}`}
                              className="font-serif text-base md:text-lg text-[var(--color-dark)] hover:text-[var(--color-terracotta)] transition-colors"
                            >
                              {e?.name || f.fileName}
                            </Link>
                          ) : (
                            <span className="font-serif text-base md:text-lg text-[var(--color-muted-dark)]">
                              {f.fileName}
                            </span>
                          )}
                          <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
                            {isJson ? "JSON" : "PDF"}
                          </span>
                        </div>
                        {e ? (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted-dark)]">
                            <span>
                              <span style={{ color: complexityColor(e.complexity) }}>
                                {e.complexity}
                              </span>{" "}
                              ({e.nodeCount} nodes)
                            </span>
                            {e.tags.length > 0 && (
                              <span className="font-mono text-[10px] uppercase tracking-[0.10em]">
                                {e.tags.join(" / ")}
                              </span>
                            )}
                            {e.llmModels.length > 0 && (
                              <span className="font-mono text-[10px] tracking-[0.04em]">
                                {e.llmModels[0]}
                                {e.llmModels.length > 1
                                  ? ` +${e.llmModels.length - 1}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-[var(--color-muted)]">
                            {isJson
                              ? f.sourceUrl
                                ? "Not yet imported. Use the script or paste-import."
                                : "Source URL missing, flag for manual download."
                              : "Companion document, not parsed."}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`status-pill ${statusPillClass(f.status)}`}
                        >
                          {statusLabel(f.status)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
