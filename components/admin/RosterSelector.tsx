"use client";

import { useEffect, useMemo, useState } from "react";
import { ROSTER, type RosterCategory } from "@/content/admin/roster";
import {
  clearRoster,
  isCategoryComplete,
  loadRoster,
  saveRoster,
  updateRosterPick,
  type RosterPickState,
  type RosterState,
} from "@/lib/roster-storage";
import { Reveal } from "@/components/shared/Reveal";

const CUSTOM_VALUE = "__custom__";

export function RosterSelector() {
  const [state, setState] = useState<RosterState>({});
  const [mounted, setMounted] = useState(false);
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaded = loadRoster();
    setState(loaded);
    const drafts: Record<string, string> = {};
    for (const id of Object.keys(loaded)) {
      const pick = loaded[id];
      if (pick?.custom && pick.pick) drafts[id] = pick.pick;
    }
    setCustomDrafts(drafts);
    setMounted(true);
  }, []);

  const setPick = (categoryId: string, updates: Partial<RosterPickState>) => {
    const next = updateRosterPick(state, categoryId, updates);
    setState(next);
    saveRoster(next);
  };

  const handleSelect = (category: RosterCategory, value: string) => {
    if (value === "") {
      setPick(category.id, { pick: undefined, custom: false });
      return;
    }
    if (value === CUSTOM_VALUE) {
      const draft = customDrafts[category.id] ?? "";
      setPick(category.id, { pick: draft, custom: true });
      return;
    }
    setPick(category.id, { pick: value, custom: false });
  };

  const handleCustomChange = (categoryId: string, value: string) => {
    setCustomDrafts((prev) => ({ ...prev, [categoryId]: value }));
    setPick(categoryId, { pick: value, custom: true });
  };

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Clear your full roster on this device? This cannot be undone.")
    ) {
      clearRoster();
      setState({});
      setCustomDrafts({});
    }
  };

  const completeCount = useMemo(
    () => ROSTER.filter((c) => isCategoryComplete(state[c.id])).length,
    [state]
  );
  const pickedCount = useMemo(
    () => ROSTER.filter((c) => !!state[c.id]?.pick).length,
    [state]
  );
  const totalCount = ROSTER.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completeCount / totalCount) * 100);

  return (
    <div>
      <div className="mb-10 glass-card p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
          <p className="label text-[var(--color-muted-dark)]">
            Roster status
          </p>
          <p className="font-mono text-sm text-[var(--color-dark)]">
            <span className="text-[var(--color-muted)]">
              {pickedCount} picked
            </span>
            <span className="text-[var(--color-muted)] mx-2">/</span>
            <span className="text-[var(--color-organic)]">
              {completeCount} live
            </span>
            <span className="text-[var(--color-muted)] mx-2">/</span>
            <span className="text-[var(--color-muted)]">{totalCount} slots</span>
            <span className="text-[var(--color-muted)] ml-3">{percent}%</span>
          </p>
        </div>
        <div className="h-2 bg-[var(--color-border-light)] overflow-hidden rounded-full">
          <div
            className="h-full bg-[var(--color-organic)] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--color-muted-dark)] leading-relaxed">
          Pick one tool per slot, sign up, integrate it into your stack. Each
          card lights up the moment both boxes are checked, so you can see the
          shape of your roster filling in.
        </p>
      </div>

      {!mounted && (
        <p className="italic text-[var(--color-muted)] mb-6">
          Loading saved roster...
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {ROSTER.map((category, i) => (
          <Reveal as="li" key={category.id} delay={i * 50}>
            <RosterCard
              category={category}
              pick={state[category.id]}
              customDraft={customDrafts[category.id] ?? ""}
              onSelect={(value) => handleSelect(category, value)}
              onCustomChange={(value) =>
                handleCustomChange(category.id, value)
              }
              onToggleSignedUp={() =>
                setPick(category.id, {
                  signedUp: !state[category.id]?.signedUp,
                })
              }
              onToggleIntegrated={() =>
                setPick(category.id, {
                  integrated: !state[category.id]?.integrated,
                })
              }
            />
          </Reveal>
        ))}
      </ul>

      <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex justify-end">
        <button
          onClick={handleReset}
          className="font-mono text-xs uppercase tracking-[0.08em] px-4 py-2 border border-[var(--color-border)] text-[var(--color-muted-dark)] hover:border-[var(--color-rust)] hover:text-[var(--color-rust)] transition-colors"
        >
          Reset roster
        </button>
      </div>
    </div>
  );
}

function RosterCard({
  category,
  pick,
  customDraft,
  onSelect,
  onCustomChange,
  onToggleSignedUp,
  onToggleIntegrated,
}: {
  category: RosterCategory;
  pick: RosterPickState | undefined;
  customDraft: string;
  onSelect: (value: string) => void;
  onCustomChange: (value: string) => void;
  onToggleSignedUp: () => void;
  onToggleIntegrated: () => void;
}) {
  const complete = isCategoryComplete(pick);
  const selectValue = pick?.custom
    ? CUSTOM_VALUE
    : pick?.pick ?? "";

  const activeTool =
    !pick?.custom && pick?.pick
      ? category.tools.find((t) => t.name === pick.pick)
      : undefined;

  return (
    <div
      className={`glass-card roster-card p-5 md:p-6 h-full flex flex-col ${
        complete ? "is-complete" : ""
      }`}
    >
      <header className="flex items-baseline gap-3 mb-2">
        <span className="roster-card-number font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-terracotta)]">
          {String(category.number).padStart(2, "0")}
        </span>
        <h2 className="font-serif text-lg md:text-xl text-[var(--color-dark)] leading-snug">
          {category.label}
        </h2>
      </header>
      <p className="text-sm text-[var(--color-muted-dark)] leading-relaxed mb-1">
        {category.purpose}
      </p>
      <p className="text-xs text-[var(--color-muted)] italic mb-4">
        {category.note}
      </p>

      <label className="block mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)] block mb-1.5">
          Your pick
        </span>
        <select
          value={selectValue}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-[var(--color-cream)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-terracotta)] font-serif rounded"
        >
          <option value="">Not yet picked</option>
          {category.tools.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>Something else...</option>
        </select>
      </label>

      {pick?.custom && (
        <input
          type="text"
          value={customDraft}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Tool name"
          className="w-full mb-3 bg-[var(--color-cream)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-dark)] focus:outline-none focus:border-[var(--color-terracotta)] font-serif rounded"
        />
      )}

      {activeTool?.url && (
        <a
          href={activeTool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start mb-4 font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-cyan)] hover:text-[var(--color-terracotta)] transition-colors"
        >
          Open {activeTool.name} &rarr;
        </a>
      )}

      <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
        <ToggleChip
          label="Signed up"
          active={!!pick?.signedUp}
          disabled={!pick?.pick}
          onClick={onToggleSignedUp}
        />
        <ToggleChip
          label="Integrated"
          active={!!pick?.integrated}
          disabled={!pick?.pick}
          onClick={onToggleIntegrated}
        />
        {complete && (
          <span className="roster-card-status ml-auto self-center font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-organic)]">
            Live
          </span>
        )}
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
      className={`status-pill cursor-pointer transition-opacity ${
        active ? "is-done" : "is-not-started"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "hover:opacity-90"}`}
    >
      {active ? `✓ ${label}` : label}
    </button>
  );
}
