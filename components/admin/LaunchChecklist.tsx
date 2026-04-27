"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LAUNCH_CHECKLIST,
  type ChecklistItem,
  type ChecklistPhase,
  type ChecklistStatus,
} from "@/content/admin/launch-checklist";
import {
  clearState,
  loadState,
  saveState,
  updateItem,
  type ChecklistState,
} from "@/lib/checklist-storage";
import { ActionButton, type Action } from "@/components/shared/ActionButton";
import { StepsModal } from "@/components/shared/StepsModal";

const STATUS_OPTIONS: { value: ChecklistStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const STATUS_COLORS: Record<ChecklistStatus, string> = {
  "not-started": "#8a7f6b",
  "in-progress": "#d97757",
  done: "#5c7a6b",
};

function getStatus(state: ChecklistState, itemId: string): ChecklistStatus {
  return state[itemId]?.status ?? "not-started";
}

function countDone(state: ChecklistState, phase: ChecklistPhase): number {
  return phase.items.filter((i) => getStatus(state, i.id) === "done").length;
}

export function LaunchChecklist() {
  const [state, setState] = useState<ChecklistState>({});
  const [mounted, setMounted] = useState(false);
  const [stepsModalContent, setStepsModalContent] = useState<string | null>(
    null
  );
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  const setStatus = (itemId: string, status: ChecklistStatus) => {
    const next = updateItem(state, itemId, { status });
    setState(next);
    saveState(next);
  };

  const setNote = (itemId: string, note: string) => {
    const next = updateItem(state, itemId, { note });
    setState(next);
    saveState(next);
  };

  const toggleNote = (itemId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Reset all checklist progress on this device? This cannot be undone."
      )
    ) {
      clearState();
      setState({});
      setExpandedNotes(new Set());
    }
  };

  const totalCount = useMemo(
    () => LAUNCH_CHECKLIST.reduce((sum, p) => sum + p.items.length, 0),
    []
  );
  const totalDone = useMemo(
    () =>
      LAUNCH_CHECKLIST.reduce((sum, p) => sum + countDone(state, p), 0),
    [state]
  );
  const percent = totalCount === 0 ? 0 : Math.round((totalDone / totalCount) * 100);

  return (
    <div>
      <div className="mb-10 bg-[var(--color-surface)]/55 border border-[var(--color-border)] p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <p className="label text-[var(--color-muted-dark)]">
            Overall progress
          </p>
          <p className="font-mono text-sm text-[var(--color-dark)]">
            <span className="text-[var(--color-terracotta)]">{totalDone}</span>
            <span className="text-[var(--color-muted)]"> / {totalCount}</span>
            <span className="text-[var(--color-muted)] ml-3">{percent}%</span>
          </p>
        </div>
        <div className="h-2 bg-[var(--color-border-light)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-terracotta)] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {!mounted && (
        <p className="italic text-[var(--color-muted)] mb-6">
          Loading saved progress...
        </p>
      )}

      <div className="flex flex-col gap-10">
        {LAUNCH_CHECKLIST.map((phase) => {
          const phaseDone = countDone(state, phase);
          return (
            <section key={phase.id}>
              <header className="mb-5 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
                <div>
                  <p className="label text-[var(--color-terracotta)] mb-1">
                    {phase.label}
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-dark)]">
                    {phase.title}
                  </h2>
                  <p className="text-[var(--color-muted-dark)] mt-1">
                    {phase.subtitle}
                  </p>
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted)] md:self-end md:mb-1">
                  {phaseDone} of {phase.items.length} done
                </p>
              </header>
              <ul className="flex flex-col gap-3">
                {phase.items.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    status={getStatus(state, item.id)}
                    note={state[item.id]?.note ?? ""}
                    noteExpanded={expandedNotes.has(item.id)}
                    onStatusChange={(s) => setStatus(item.id, s)}
                    onNoteChange={(v) => setNote(item.id, v)}
                    onToggleNote={() => toggleNote(item.id)}
                    onViewSteps={(payload) => setStepsModalContent(payload)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex justify-end">
        <button
          onClick={handleReset}
          className="font-mono text-xs uppercase tracking-[0.08em] px-4 py-2 border border-[var(--color-border)] text-[var(--color-muted-dark)] hover:border-[var(--color-rust)] hover:text-[var(--color-rust)] transition-colors"
        >
          Reset all progress
        </button>
      </div>

      {stepsModalContent && (
        <StepsModal
          content={stepsModalContent}
          onClose={() => setStepsModalContent(null)}
        />
      )}
    </div>
  );
}

function ChecklistRow({
  item,
  status,
  note,
  noteExpanded,
  onStatusChange,
  onNoteChange,
  onToggleNote,
  onViewSteps,
}: {
  item: ChecklistItem;
  status: ChecklistStatus;
  note: string;
  noteExpanded: boolean;
  onStatusChange: (s: ChecklistStatus) => void;
  onNoteChange: (v: string) => void;
  onToggleNote: () => void;
  onViewSteps: (payload: string) => void;
}) {
  const isDone = status === "done";
  const borderColor = STATUS_COLORS[status];

  return (
    <li
      className="bg-[var(--color-surface)]/55 border border-[var(--color-border)] flex flex-col"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        opacity: isDone ? 0.7 : 1,
        transition: "opacity 200ms",
      }}
    >
      <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-serif text-lg text-[var(--color-dark)] mb-1 ${
              isDone ? "line-through decoration-[var(--color-muted)]" : ""
            }`}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[var(--color-muted-dark)] leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <label className="sr-only" htmlFor={`status-${item.id}`}>
            Status
          </label>
          <select
            id={`status-${item.id}`}
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ChecklistStatus)}
            className="font-mono text-xs uppercase tracking-[0.08em] bg-white border border-[var(--color-border)] text-[var(--color-dark)] px-3 py-2 cursor-pointer hover:border-[var(--color-dark)] focus:outline-none focus:border-[var(--color-terracotta)]"
            style={{ color: STATUS_COLORS[status] }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {item.actions && item.actions.length > 0 && (
        <div
          className="px-5 md:px-6 pb-5 md:pb-6 flex flex-wrap gap-2"
          style={{ marginTop: -8 }}
        >
          {item.actions.map((action, i) => (
            <ActionButton
              key={i}
              action={action as Action}
              accentColor={STATUS_COLORS[status]}
              onViewSteps={onViewSteps}
            />
          ))}
        </div>
      )}

      <div className="px-5 md:px-6 pb-5 md:pb-6 flex flex-col gap-2">
        <button
          onClick={onToggleNote}
          className="self-start font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
        >
          {noteExpanded ? "Hide note" : note ? "Edit note" : "Add note"}
        </button>
        {noteExpanded && (
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Anything to remember about this item..."
            rows={3}
            className="w-full bg-[var(--color-cream)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-terracotta)] font-serif"
          />
        )}
      </div>
    </li>
  );
}
