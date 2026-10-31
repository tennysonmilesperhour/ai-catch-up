"use client";

import { ActionButton } from "@/components/shared/ActionButton";
import type { DomainsRecord, NexusNode } from "@/components/admin/Nexus";
import {
  checksFor,
  type IntegrationScore,
  type NexusProgress,
  type NextMove,
} from "@/lib/nexus-progress";
import { STATUS_PALETTE } from "@/lib/nexus-status";

type Props = {
  moves: NextMove[];
  score: IntegrationScore;
  domains: DomainsRecord;
  nodesById: Map<string, NexusNode>;
  progress: NexusProgress;
  onToggleCheck: (nodeId: string, index: number) => void;
  focusId: string | null;
  onFocus: (id: string | null) => void;
  /** Highlight this node and bring the map into view. */
  onShow: (id: string) => void;
  onViewSteps: (payload: string) => void;
};

function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function NexusNextMoves({
  moves,
  score,
  domains,
  nodesById,
  progress,
  onToggleCheck,
  focusId,
  onFocus,
  onShow,
  onViewSteps,
}: Props) {
  const checksPct = pct(score.checksDone, score.checksTotal);
  const wiredPct = pct(score.wired, score.linksTotal);

  return (
    <section
      aria-labelledby="nexus-next-moves"
      className="glass-card-static border border-[var(--color-border-light)] p-4 md:p-5 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            id="nexus-next-moves"
            className="font-display text-base text-[var(--color-dark)]"
          >
            Next 3 moves
          </h2>
          <p className="text-sm text-[var(--color-muted-dark)] mt-1 max-w-xl">
            Ranked by priority and by how many things you already use each
            one would connect. Hover or tap a move to see its reach on the
            map.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 font-mono text-xs min-w-[220px]">
          <div>
            <dt className="uppercase tracking-[0.1em] text-[var(--color-muted)]">
              Checks done
            </dt>
            <dd className="text-[var(--color-dark)] text-lg">
              {checksPct}%
              <span className="text-[var(--color-muted)] text-xs ml-1">
                {score.checksDone}/{score.checksTotal}
              </span>
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.1em] text-[var(--color-muted)]">
              Links wired
            </dt>
            <dd className="text-[var(--color-dark)] text-lg">
              {wiredPct}%
              <span className="text-[var(--color-muted)] text-xs ml-1">
                {score.wired}/{score.linksTotal}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {moves.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-dark)]">
          No open gaps on the map. Everything you track is checked off.
        </p>
      ) : (
        <ol className="grid gap-3 md:grid-cols-3">
          {moves.map((m, i) => {
            const color = domains[m.node.domain]?.color ?? "#d97757";
            const focused = focusId === m.node.id;
            const pal = STATUS_PALETTE[m.observed.status];
            const checks = checksFor(m.node);
            const ticks = progress.checks[m.node.id] ?? [];
            const reachLabels = m.reachIds
              .map((id) => nodesById.get(id)?.label)
              .filter(Boolean)
              .slice(0, 4) as string[];
            return (
              <li
                key={m.node.id}
                onMouseEnter={() => onFocus(m.node.id)}
                onMouseLeave={() => onFocus(null)}
                className="p-4 border flex flex-col gap-2 min-w-0"
                style={{
                  borderColor: focused ? color : "var(--color-border)",
                  borderLeft: `3px solid ${color}`,
                  background: focused ? `${color}12` : "transparent",
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {String(i + 1).padStart(2, "0")} &middot;{" "}
                    {domains[m.node.domain]?.label ?? m.node.domain}
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.1em]"
                    style={{ color: pal.color }}
                    title={pal.description}
                  >
                    {pal.label}
                    {m.observed.verified ? "" : " (guess)"}
                  </span>
                </div>
                <h3 className="font-mono text-sm text-[var(--color-dark)] break-words">
                  {m.node.label}
                </h3>
                <p className="text-xs text-[var(--color-muted-dark)] leading-relaxed">
                  {m.reason}
                  {reachLabels.length > 0 && <>: {reachLabels.join(", ")}</>}
                  {m.reachIds.length > reachLabels.length
                    ? ` and ${m.reachIds.length - reachLabels.length} more`
                    : ""}
                  .
                </p>
                <ul className="flex flex-col gap-1">
                  {checks.map((c, ci) => (
                    <li key={ci}>
                      <label className="flex items-start gap-2 text-xs text-[var(--color-muted-dark)] cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={!!ticks[ci]}
                          onChange={() => onToggleCheck(m.node.id, ci)}
                          className="mt-0.5 shrink-0"
                          style={{ accentColor: color }}
                        />
                        <span className={ticks[ci] ? "line-through opacity-70" : ""}>
                          {c}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                {m.node.actions && m.node.actions.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {m.node.actions.slice(0, 2).map((a, ai) => (
                      <ActionButton
                        key={ai}
                        action={a}
                        accentColor={color}
                        onViewSteps={onViewSteps}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onShow(m.node.id)}
                  className="self-start font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] py-2"
                >
                  Show on map
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
