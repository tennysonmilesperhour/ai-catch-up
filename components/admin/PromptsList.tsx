"use client";

import { useMemo, useState } from "react";

export type Prompt = {
  id: number | string;
  title: string;
  category: string;
  prompt: string;
  whyItWorks?: string;
};

type Props = {
  prompts: Prompt[];
  categories: string[];
};

export function PromptsList({ prompts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!activeCategory) return prompts;
    return prompts.filter((p) => p.category === activeCategory);
  }, [prompts, activeCategory]);

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
      <div className="flex flex-wrap gap-2 mb-8">
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

      <ul className="grid gap-3">
        {filtered.map((p) => {
          const idKey = String(p.id);
          const isOpen = openIds.has(idKey);
          return (
            <li
              key={idKey}
              className="bg-[var(--color-surface)]/55 border border-[var(--color-border)]"
            >
              <button
                onClick={() => toggle(idKey)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[var(--color-surface)]/75 transition-colors"
              >
                <div className="flex items-baseline gap-4">
                  <span className="label text-[var(--color-terracotta)]">
                    {p.category}
                  </span>
                  <span className="font-serif text-lg text-[var(--color-dark)]">
                    {p.title}
                  </span>
                </div>
                <span
                  className={`font-mono text-xs text-[var(--color-muted-dark)] transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-5 border-t border-[var(--color-border-light)]">
                  <p className="label text-[var(--color-muted-dark)] mb-2">
                    Prompt
                  </p>
                  <div className="whitespace-pre-line text-[var(--color-dark)] leading-relaxed bg-[var(--color-cream)] border border-[var(--color-border)] p-4 mb-5">
                    {p.prompt}
                  </div>
                  {p.whyItWorks && (
                    <>
                      <p className="label text-[var(--color-terracotta)] mb-2">
                        Why it works
                      </p>
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
        <p className="italic text-[var(--color-muted)]">
          No prompts in this category yet.
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
      className={`font-mono text-xs uppercase tracking-[0.08em] px-3 py-2 border transition-colors ${
        active
          ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
          : "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)] hover:border-[var(--color-dark)]"
      }`}
    >
      {label}
    </button>
  );
}
