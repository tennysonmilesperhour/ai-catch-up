import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import type { WorkflowsIndex } from "@/lib/workflows-store";

export const dynamic = "force-dynamic";

type Params = { slug: string };
type Props = { params: Promise<Params> };

function loadIndex(): WorkflowsIndex {
  const path = join(process.cwd(), "content/admin/workflows.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as WorkflowsIndex;
}

function findFile(index: WorkflowsIndex, slug: string) {
  for (const s of index.sections) {
    const f = s.files.find((x) => x.slug === slug);
    if (f) return { section: s, file: f };
  }
  return null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const index = loadIndex();
  const found = findFile(index, slug);
  if (!found) return { title: "Workflow not found" };
  return {
    title: found.file.extracted?.name || found.file.fileName,
  };
}

export default async function WorkflowDetailPage({ params }: Props) {
  const { slug } = await params;
  const index = loadIndex();
  const found = findFile(index, slug);
  if (!found) notFound();
  const { section, file } = found;
  const e = file.extracted;

  return (
    <div className="max-w-5xl">
      <header className="admin-header">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-3">
          <Link
            href="/admin/workflows"
            className="hover:text-[var(--color-terracotta)] transition-colors"
          >
            Workflow library
          </Link>{" "}
          / {section.name} ({section.date})
        </p>
        <h1 className="font-display text-2xl md:text-4xl text-[var(--color-dark)] mb-2 leading-[1.1]">
          {e?.name || file.fileName}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <span
            className={`status-pill ${
              file.status === "imported"
                ? "is-done"
                : file.status === "skipped"
                  ? "is-not-started"
                  : "is-blocked"
            }`}
          >
            {file.status}
          </span>
          {file.fileSize !== null && (
            <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
              {(file.fileSize / 1024).toFixed(1)} KB
            </span>
          )}
          {file.sourceUrl && (
            <a
              href={file.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-terracotta)] hover:text-[var(--color-magenta)] transition-colors"
            >
              Original source &rarr;
            </a>
          )}
          {file.rawPath && (
            <a
              href={`/${file.rawPath}`}
              download={file.fileName}
              className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-cyan)] hover:text-[var(--color-dark)] transition-colors"
            >
              Download raw JSON &darr;
            </a>
          )}
        </div>
      </header>

      {!e ? (
        <div className="glass-card p-6">
          <p className="label text-[var(--color-terracotta)] mb-2">
            Not yet imported
          </p>
          <p className="text-[var(--color-muted-dark)] leading-relaxed max-w-xl">
            {file.type === "application/pdf"
              ? "This is a companion PDF, included in the section listing for context but not parsed."
              : file.sourceUrl
                ? "Download the JSON from the original source, drop it into ./skool-downloads/ and run npm run import-n8n. Or use the paste-import on the workflow library page."
                : "The original source URL is missing. Flag this for a manual lookup, then import via the script or paste-UI."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-6">
            <Section title="Stats">
              <Stat label="Nodes" value={String(e.nodeCount)} />
              <Stat label="Connections" value={String(e.connectionCount)} />
              <Stat label="Fanout" value={String(e.fanoutCount)} />
              <Stat
                label="Sticky notes"
                value={String(e.stickyNotesCount)}
              />
              <Stat label="Complexity" value={e.complexity} />
              <Stat
                label="Active in export"
                value={e.active ? "yes" : "no"}
              />
            </Section>

            <Section title={`Node types (${e.nodeTypes.length})`}>
              <ChipList items={e.nodeTypes} accent="var(--color-cyan)" />
            </Section>

            {e.triggerTypes.length > 0 && (
              <Section title={`Triggers (${e.triggerTypes.length})`}>
                <ChipList
                  items={e.triggerTypes}
                  accent="var(--color-terracotta)"
                />
              </Section>
            )}

            {e.credentialTypes.length > 0 && (
              <Section
                title={`Credentials (${e.credentialTypes.length})`}
              >
                <ChipList
                  items={e.credentialTypes}
                  accent="var(--color-magenta)"
                />
              </Section>
            )}

            {e.llmModels.length > 0 && (
              <Section title={`LLM models (${e.llmModels.length})`}>
                <ChipList items={e.llmModels} accent="var(--color-violet)" />
              </Section>
            )}

            {e.httpHosts.length > 0 && (
              <Section title={`HTTP hosts (${e.httpHosts.length})`}>
                <ChipList items={e.httpHosts} accent="var(--color-organic)" />
              </Section>
            )}

            {e.webhookPaths.length > 0 && (
              <Section title={`Webhook paths (${e.webhookPaths.length})`}>
                <ChipList items={e.webhookPaths} accent="var(--color-rust)" />
              </Section>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <section className="glass-card p-5">
              <p className="label text-[var(--color-terracotta)] mb-4">
                Tags
              </p>
              {e.tags.length === 0 ? (
                <p className="text-sm italic text-[var(--color-muted)]">
                  None auto-derived.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {e.tags.map((t) => (
                    <li
                      key={t}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-full border border-[var(--color-terracotta)] text-[var(--color-terracotta)]"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass-card p-5">
              <p className="label text-[var(--color-muted-dark)] mb-3">
                Extracted at
              </p>
              <p className="font-mono text-xs text-[var(--color-dark)]">
                {new Date(e.extractedAt).toUTCString()}
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card p-5 md:p-6">
      <header className="mb-4">
        <p className="label text-[var(--color-terracotta)]">{title}</p>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1">
        {label}
      </p>
      <p className="font-display text-xl text-[var(--color-dark)]">{value}</p>
    </div>
  );
}

function ChipList({
  items,
  accent,
}: {
  items: string[];
  accent: string;
}) {
  return (
    <ul className="flex flex-wrap gap-2 col-span-full">
      {items.map((it) => (
        <li
          key={it}
          className="font-mono text-[11px] px-2.5 py-1 rounded-md border"
          style={{
            color: accent,
            borderColor: accent,
            backgroundColor: `color-mix(in oklab, ${accent} 8%, transparent)`,
          }}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}
