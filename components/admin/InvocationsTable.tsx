"use client";

import { useEffect, useState } from "react";
import { readHistory, type HistoryEntry } from "@/lib/run-history-shape";
import { LearnHint } from "@/components/shared/LearnMode";

export function InvocationsTable() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readHistory());
  }, []);

  if (entries.length === 0) {
    return (
      <p className="text-[var(--color-muted-dark)] italic max-w-xl leading-relaxed">
        No invocations yet. Open the prompt library, click Run on any
        entry, and the call shows up here. We capture the prompt sent, the
        result, and the token cost so you can audit what happened.
      </p>
    );
  }

  const totalIn = entries.reduce((acc, e) => acc + e.inputTokens, 0);
  const totalOut = entries.reduce((acc, e) => acc + e.outputTokens, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3 num-tab">
        <LearnHint
          title="Total runs"
          body="How many times the Run button has fired across all prompts. Each run is one round-trip to Claude with one input + one output."
          side="top-left"
        >
          <div>
            <Stat label="Total runs" value={String(entries.length)} />
          </div>
        </LearnHint>
        <LearnHint
          title="Input tokens"
          body="Sum of input tokens across all stored invocations. Tokens ≈ ¾ of a word; Claude charges by token consumed."
          side="top-left"
        >
          <div>
            <Stat label="Input tokens" value={totalIn.toLocaleString()} />
          </div>
        </LearnHint>
        <LearnHint
          title="Output tokens"
          body="Sum of output tokens (what Claude wrote back). Output is typically more expensive per token than input. Watching this number is how you keep your spend honest."
          side="top-right"
        >
          <div>
            <Stat label="Output tokens" value={totalOut.toLocaleString()} />
          </div>
        </LearnHint>
      </div>

      <ul className="flex flex-col">
        {entries.map((e) => {
          const isOpen = openId === e.id;
          return (
            <li
              key={e.id}
              className="border-b border-[var(--color-border-light)] last:border-b-0"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : e.id)}
                className="w-full text-left grid grid-cols-[120px_1fr_120px_24px] gap-3 items-baseline py-3 hover:text-[var(--color-cyan)] transition-colors"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] num-tab">
                  {fmtTime(e.ts)}
                </span>
                <span className="text-sm text-[var(--color-dark)] truncate">
                  {e.title}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-muted)] num-tab text-right">
                  {e.inputTokens}+{e.outputTokens} tok
                </span>
                <span className="font-mono text-xs text-[var(--color-muted)] text-right">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="grid gap-3 pb-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-1.5">
                      Prompt sent
                    </p>
                    <pre className="run-preview">{e.prompt}</pre>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-1.5">
                      Result
                    </p>
                    <pre className="run-result">{e.result}</pre>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-[10px] border border-[var(--color-border)] bg-[rgba(2,6,14,0.45)]">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </span>
      <span className="font-display text-xl text-[var(--color-dark)]">
        {value}
      </span>
    </div>
  );
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
