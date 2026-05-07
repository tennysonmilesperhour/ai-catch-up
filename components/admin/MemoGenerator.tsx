"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RunPrompt } from "@/components/shared/RunPrompt";
import {
  readWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/workspace-state";
import { LearnHint } from "@/components/shared/LearnMode";

const MEMO_TEMPLATE = `You are writing a 30-day distillation memo for the operator of an AI workspace. The memo should be short (under 200 words), warm, and honest. It is for them, not for an audience.

Workspace context (last 30 days):
{{context}}

Their tone preference: {{tone}}

Write the memo with these three sections, in this order:

## What moved
Two or three sentences naming the things that actually got done. Concrete, no fluff.

## What stalled
One or two sentences. Be honest. The point is to surface drift, not to flagellate.

## Next three moves
A bulleted list of exactly three concrete, scoped next moves for the coming month. Each move should be one sentence. Order them by leverage.

End with a single closing line that is encouraging but not saccharine. No headers after the bullet list. Output as plain markdown, no fenced code block, no preamble.`;

const MEMO_KEY = "memo-history-v1";

type StoredMemo = {
  id: string;
  ts: number;
  tone: string;
  body: string;
};

function readStoredMemos(): StoredMemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MEMO_KEY);
    return raw ? (JSON.parse(raw) as StoredMemo[]) : [];
  } catch {
    return [];
  }
}

function appendStoredMemo(memo: StoredMemo) {
  if (typeof window === "undefined") return;
  try {
    const list = readStoredMemos();
    list.unshift(memo);
    window.localStorage.setItem(MEMO_KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* ignore */
  }
}

type Props = {
  decisionsCount: number;
  promptsCount: number;
};

export function MemoGenerator({ decisionsCount, promptsCount }: Props) {
  const [snap, setSnap] = useState<WorkspaceSnapshot | null>(null);
  const [memos, setMemos] = useState<StoredMemo[]>([]);

  useEffect(() => {
    setSnap(readWorkspaceSnapshot({ decisionsCount, promptsCount }));
    setMemos(readStoredMemos());
  }, [decisionsCount, promptsCount]);

  // Build the {{context}} from the workspace snapshot, a compact bullet
  // list the model can read in one pass.
  const contextBlock = useMemo(() => {
    if (!snap) return "";
    const lines: string[] = [];
    lines.push(`- Total prompts in library: ${snap.prompts.total}`);
    lines.push(`- Locked decisions: ${snap.decisions.total}`);
    lines.push(
      `- Setup phase: ${snap.setup.currentPhase}${
        snap.setup.currentPhase === "done" ? " (complete)" : ""
      }`
    );
    lines.push(
      `- Invocations: ${snap.invocations.total} all-time, ${snap.invocations.last30d} in the last 30 days, ${snap.invocations.last7d} in the last 7 days`
    );
    if (snap.invocations.lastAt) {
      const days = Math.round(
        (snap.generatedAt - snap.invocations.lastAt) / (24 * 60 * 60 * 1000)
      );
      lines.push(`- Days since last invocation: ${days}`);
    }
    const usage = Object.entries(snap.invocations.usage)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5);
    if (usage.length) {
      lines.push("- Most-run prompts:");
      for (const [id, u] of usage) {
        lines.push(`  - Prompt ${id}: ${u.count} runs`);
      }
    }
    if (snap.invocations.recent.length) {
      lines.push("- Recent invocations:");
      for (const r of snap.invocations.recent.slice(0, 5)) {
        lines.push(`  - ${r.title}`);
      }
    }
    return lines.join("\n");
  }, [snap]);

  const promptForRun = MEMO_TEMPLATE.replace("{{context}}", contextBlock);

  const onMemo = (text: string) => {
    const m: StoredMemo = {
      id: `memo-${Date.now()}`,
      ts: Date.now(),
      tone: "-",
      body: text,
    };
    appendStoredMemo(m);
    setMemos((prev) => [m, ...prev]);
  };

  const downloadMemo = (m: StoredMemo) => {
    const filename = `memo-${new Date(m.ts).toISOString().slice(0, 10)}.md`;
    const blob = new Blob([m.body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!snap) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Reading workspace…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <article className="glass-card p-6 md:p-7 flex flex-col gap-4">
        <header className="flex items-baseline gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)]"
            aria-hidden
          />
          <h2 className="font-display text-base text-[var(--color-dark)]">
            Generate the memo
          </h2>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            uses your last 30 days
          </span>
        </header>
        <p className="text-[var(--color-muted-dark)] leading-relaxed text-sm">
          A scaffolded invocation. Workspace context is auto-injected; the
          only slot you fill is{" "}
          <code className="text-[var(--color-cyan)] font-mono">tone</code>.
          The memo lands here, downloads as a dated{" "}
          <code className="text-[var(--color-cyan)] font-mono">.md</code>{" "}
          file, and persists across browser sessions.
        </p>
        <details className="text-sm">
          <summary className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cyan)] cursor-pointer hover:text-[var(--color-dark)] transition-colors">
            See what context will be sent
          </summary>
          <pre className="run-preview mt-2">{contextBlock}</pre>
        </details>
        <div className="flex flex-wrap gap-3">
          <RunPrompt
            prompt={promptForRun}
            title="Monthly memo · next three moves"
            onResult={onMemo}
          >
            {(open) => (
              <LearnHint
                title="Run memo"
                body="Fires the memo prompt against Claude with your last-30-days workspace context auto-injected. Output is a 3-section markdown memo: what moved, what stalled, next three moves."
                more="Run this once a month. Past memos persist below as downloadable .md files. The trick is comparing month over month, read last month's before writing this month's."
                side="bottom-right"
              >
                <button
                  type="button"
                  onClick={open}
                  className="glass-button-primary px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em]"
                >
                  Run memo →
                </button>
              </LearnHint>
            )}
          </RunPrompt>
          <Link
            href="/admin/pulse"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] transition-colors self-center"
          >
            ← Back to Pulse
          </Link>
        </div>
      </article>

      {memos.length > 0 && (
        <section className="flex flex-col gap-4">
          <header className="flex items-baseline gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-violet)]"
              aria-hidden
            />
            <h2 className="font-display text-base text-[var(--color-dark)]">
              Past memos
            </h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] num-tab">
              {memos.length} stored
            </span>
          </header>
          {memos.map((m) => (
            <article key={m.id} className="glass-card-static p-5 flex flex-col gap-3">
              <header className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-cyan)] num-tab">
                  {new Date(m.ts).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => downloadMemo(m)}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] transition-colors"
                >
                  Download .md
                </button>
              </header>
              <pre className="run-result" style={{ maxHeight: "320px" }}>
                {m.body}
              </pre>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
