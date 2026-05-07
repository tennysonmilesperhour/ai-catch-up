"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  computeSignals,
  computeSuggestions,
  type PatternSignal,
  type Suggestion,
  type Severity,
} from "@/lib/heuristics";
import {
  readWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/workspace-state";
import { PHASES } from "@/lib/setup-state";
import { LearnHint } from "@/components/shared/LearnMode";

type Props = {
  decisionsCount: number;
  promptsCount: number;
};

const SEV_COLOR: Record<Severity, string> = {
  info: "var(--color-cyan)",
  warn: "var(--color-terracotta)",
  alert: "var(--color-magenta)",
};

export function PulseDashboard({ decisionsCount, promptsCount }: Props) {
  const [snap, setSnap] = useState<WorkspaceSnapshot | null>(null);

  useEffect(() => {
    function refresh() {
      setSnap(readWorkspaceSnapshot({ decisionsCount, promptsCount }));
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [decisionsCount, promptsCount]);

  const signals = useMemo(() => (snap ? computeSignals(snap) : []), [snap]);
  const suggestions = useMemo(
    () => (snap ? computeSuggestions(snap) : []),
    [snap]
  );

  if (!snap) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Reading workspace…
      </p>
    );
  }

  const setupDoneCount = (Object.values(snap.setup.phases) as { status: string }[]).filter(
    (p) => p.status === "done"
  ).length;
  const setupPct = Math.round((setupDoneCount / PHASES.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Left column: pattern signals + activity */}
      <div className="flex flex-col gap-6">
        <section className="glass-card p-6 md:p-7">
          <header className="flex items-baseline gap-2 mb-5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)]"
              aria-hidden
            />
            <LearnHint
              title="Pattern signals"
              body="Three heuristics that watch your workspace for stuck patterns (prompts you stopped using), drift (sessions where Claude asked context questions), and plateau risk (weeks since you added a new prompt)."
              more="Computed in your browser from localStorage state. v1.3 will swap in server-side reads from your real repo + session log."
              side="top-left"
            >
              <h2 className="font-display text-base text-[var(--color-dark)]">
                Pattern signals
              </h2>
            </LearnHint>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              live · this browser
            </span>
          </header>
          <div className="flex flex-col gap-3">
            {signals.map((s) => (
              <PatternRow key={s.id} signal={s} />
            ))}
          </div>
        </section>

        <section className="glass-card p-6 md:p-7">
          <header className="flex items-baseline gap-2 mb-5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-magenta)]"
              aria-hidden
            />
            <h2 className="font-display text-base text-[var(--color-dark)]">
              Recent invocations
            </h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] num-tab">
              {snap.invocations.total} all-time · {snap.invocations.last7d} in 7d
            </span>
          </header>
          {snap.invocations.recent.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-dark)] italic">
              No prompts run yet. Open the prompt library and click Run on
              one to see it here.
            </p>
          ) : (
            <ul className="flex flex-col">
              {snap.invocations.recent.slice(0, 6).map((h) => (
                <li
                  key={h.id}
                  className="flex items-baseline gap-3 py-2.5 first:pt-0 border-b border-[var(--color-border-light)] last:border-b-0"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] w-24 shrink-0 num-tab">
                    {fmtRelative(h.ts, snap.generatedAt)}
                  </span>
                  <Link
                    href="/admin/invocations"
                    className="text-sm text-[var(--color-dark)] truncate hover:text-[var(--color-cyan)] transition-colors flex-1"
                  >
                    {h.title}
                  </Link>
                  <span className="font-mono text-[10px] text-[var(--color-muted)] num-tab whitespace-nowrap">
                    {h.inputTokens}+{h.outputTokens} tok
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/invocations"
            className="inline-block mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cyan)] hover:text-[var(--color-dark)] transition-colors"
          >
            Full invocation history →
          </Link>
        </section>
      </div>

      {/* Right column: suggested moves + setup status + counts */}
      <aside className="flex flex-col gap-6">
        <section className="glass-card p-6">
          <header className="flex items-baseline gap-2 mb-5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-terracotta)]"
              aria-hidden
            />
            <LearnHint
              title="Suggested moves"
              body="The dynamic checklist. Up to five next moves ranked by severity (alert / warn / info), derived from the same workspace snapshot the pattern signals read."
              more="Suggestions update on every page focus and every localStorage change, so finishing a setup phase or running a prompt re-ranks them immediately."
              side="top-left"
            >
              <h2 className="font-display text-base text-[var(--color-dark)]">
                Suggested moves
              </h2>
            </LearnHint>
          </header>
          {suggestions.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-dark)] italic">
              Workspace looks healthy. Suggestions will appear here when the
              heuristics flag something worth a five-minute fix.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {suggestions.map((s) => (
                <SuggestionRow key={s.id} suggestion={s} />
              ))}
            </ul>
          )}
        </section>

        <section className="glass-card p-6">
          <header className="flex items-baseline gap-2 mb-3">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)]"
              aria-hidden
            />
            <h2 className="font-display text-base text-[var(--color-dark)]">
              Setup status
            </h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cyan)] num-tab">
              {setupPct}%
            </span>
          </header>
          <div className="setup-progress-bar mb-3" aria-hidden>
            <span
              className="setup-progress-fill"
              style={{ width: `${setupPct}%` }}
            />
          </div>
          <ul className="flex flex-col gap-1.5">
            {PHASES.map((p) => {
              const status = snap.setup.phases[p.id]?.status ?? "not-started";
              const dot =
                status === "done"
                  ? "var(--color-organic)"
                  : status === "in-progress"
                    ? "var(--color-cyan)"
                    : "var(--color-muted)";
              return (
                <li key={p.id} className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: dot,
                      boxShadow:
                        status === "not-started"
                          ? "none"
                          : `0 0 6px ${dot}`,
                    }}
                    aria-hidden
                  />
                  <Link
                    href={p.href}
                    className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] transition-colors flex-1"
                  >
                    {p.label}
                  </Link>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {status}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="glass-card p-6">
          <header className="flex items-baseline gap-2 mb-4">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-violet)]"
              aria-hidden
            />
            <h2 className="font-display text-base text-[var(--color-dark)]">
              Workspace counts
            </h2>
          </header>
          <div className="grid grid-cols-3 gap-3 num-tab">
            <CountCell
              label="Prompts"
              value={String(snap.prompts.total)}
              sub="library"
            />
            <CountCell
              label="Decisions"
              value={String(snap.decisions.total)}
              sub="logged"
            />
            <CountCell
              label="API key"
              value={snap.apiKey.hasKey ? "set" : "-"}
              sub={snap.apiKey.fingerprint ?? "needed"}
            />
          </div>
        </section>
      </aside>
    </div>
  );
}

function PatternRow({ signal }: { signal: PatternSignal }) {
  const color = SEV_COLOR[signal.severity];
  return (
    <div
      className="grid grid-cols-[12px_1fr_auto] gap-3 items-baseline py-2 border-b border-[var(--color-border-light)] last:border-b-0"
      style={{ borderColor: signal.severity !== "info" ? `color-mix(in oklab, ${color} 25%, transparent)` : undefined }}
    >
      <span
        className="w-2 h-2 rounded-full self-center"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        aria-hidden
      />
      <div className="flex flex-col">
        <span className="font-mono text-xs text-[var(--color-dark)] tracking-[0.04em]">
          {signal.label}
        </span>
        <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.10em]">
          {signal.note}
        </span>
      </div>
      <span
        className="font-mono text-sm num-tab"
        style={{ color }}
      >
        {signal.value}
      </span>
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const color = SEV_COLOR[suggestion.severity];
  return (
    <li
      className="flex flex-col gap-1.5 pl-3 border-l-2"
      style={{ borderColor: color }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color }}
      >
        {suggestion.severity === "alert"
          ? "do this first"
          : suggestion.severity === "warn"
            ? "next move"
            : "when ready"}
      </p>
      <p className="text-sm text-[var(--color-dark)] leading-snug">
        {suggestion.title}
      </p>
      <p className="text-xs text-[var(--color-muted-dark)] leading-relaxed">
        {suggestion.body}
      </p>
      {suggestion.action && (
        <Link
          href={suggestion.action.href}
          className="font-mono text-[10px] uppercase tracking-[0.14em] hover:underline mt-1 inline-block self-start"
          style={{ color }}
        >
          {suggestion.action.label} →
        </Link>
      )}
    </li>
  );
}

function CountCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </span>
      <span className="font-display text-xl text-[var(--color-dark)]">
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-muted)] truncate">
        {sub}
      </span>
    </div>
  );
}

function fmtRelative(ts: number, now: number): string {
  const diff = now - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
