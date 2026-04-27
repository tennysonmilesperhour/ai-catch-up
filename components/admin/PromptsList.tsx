"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type Prompt = {
  id: number | string;
  title: string;
  category: string;
  prompt: string;
  whyItWorks?: string;
};

type Props = { prompts: Prompt[]; categories: string[] };

const STORAGE_KEY = "admin-prompts-open-ids-v1";

export function PromptsList({ prompts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // Hydrate open IDs from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOpenIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...openIds]));
    } catch {}
  }, [openIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        (p.whyItWorks ?? "").toLowerCase().includes(q)
      );
    });
  }, [prompts, activeCategory, query]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            label="All"
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((c) => (
            <FilterButton
              key={c}
              label={c}
              active={activeCategory === c}
              onClick={() => setActiveCategory(c)}
            />
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts..."
          className="w-full md:w-72 px-4 py-2 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[10px] text-[var(--color-dark)] placeholder:text-[var(--color-muted)] font-serif text-sm focus:outline-none focus:border-[var(--color-terracotta)]"
        />
      </div>

      <ul className="grid gap-3" data-stagger>
        {filtered.map((p, i) => {
          const idKey = String(p.id);
          const isOpen = openIds.has(idKey);
          const rowStyle = {
            "--row-delay": `${Math.min(i, 8) * 30}ms`,
          } as CSSProperties;
          return (
            <li
              key={idKey}
              className="glass-card"
              style={rowStyle}
            >
              <button
                onClick={() => toggle(idKey)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[rgba(251,191,36,0.04)] transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="label text-[var(--color-terracotta)] whitespace-nowrap">
                    {p.category}
                  </span>
                  <span className="font-serif text-lg text-[var(--color-dark)] truncate">
                    {p.title}
                  </span>
                </div>
                <span
                  className={`chev text-[var(--color-muted-dark)] ${isOpen ? "is-open" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-5 border-t border-[var(--color-border-light)]">
                  <p className="label text-[var(--color-muted-dark)] mb-2">Prompt</p>
                  <div className="whitespace-pre-line text-[var(--color-dark)] leading-relaxed bg-[rgba(2,6,14,0.5)] border border-[var(--color-border)] rounded-[10px] p-4 mb-5 font-mono text-sm">
                    {p.prompt}
                  </div>
                  {p.whyItWorks && (
                    <>
                      <p className="label text-[var(--color-terracotta)] mb-2">Why it works</p>
                      <p className="text-[var(--color-muted-dark)] italic leading-relaxed">
                        {p.whyItWorks}
                      </p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="italic text-[var(--color-muted)] mt-6">
          No prompts match this filter.
        </p>
      )}
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 rounded-[8px] border transition-colors ${
        active
          ? "bg-[var(--color-dark)] text-[var(--color-darker)] border-[var(--color-dark)]"
          : "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)] hover:border-[var(--color-terracotta)] hover:text-[var(--color-dark)]"
      }`}
    >
      {label}
    </button>
  );
}
