"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  computeSuggestions,
  type Suggestion,
  type Severity,
} from "@/lib/heuristics";
import { readWorkspaceSnapshot } from "@/lib/workspace-state";

type Props = {
  decisionsCount: number;
  promptsCount: number;
};

const SEV_COLOR: Record<Severity, string> = {
  info: "var(--color-cyan)",
  warn: "var(--color-terracotta)",
  alert: "var(--color-magenta)",
};

const SEV_LABEL: Record<Severity, string> = {
  info: "When ready",
  warn: "Next move",
  alert: "Do this first",
};

/**
 * Reads workspace state on mount and renders the top heuristic-derived
 * next moves. Replaces the static "Next three moves" panel that shipped
 * before v1.2.
 */
export function SuggestedMoves({ decisionsCount, promptsCount }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    function refresh() {
      const snap = readWorkspaceSnapshot({ decisionsCount, promptsCount });
      setSuggestions(computeSuggestions(snap).slice(0, 3));
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [decisionsCount, promptsCount]);

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-dark)] italic leading-relaxed">
        Workspace looks healthy. Suggestions appear here when the heuristics
        flag something worth a five-minute fix.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {suggestions.map((s) => (
        <Row key={s.id} suggestion={s} />
      ))}
      <li>
        <Link
          href="/admin/pulse"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cyan)] hover:text-[var(--color-dark)] transition-colors"
        >
          Open the full Pulse →
        </Link>
      </li>
    </ul>
  );
}

function Row({ suggestion }: { suggestion: Suggestion }) {
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
        {SEV_LABEL[suggestion.severity]}
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
