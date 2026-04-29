"use client";

import { useEffect, useMemo, useState } from "react";
import { RunPrompt } from "@/components/shared/RunPrompt";
import { LearnHint } from "@/components/shared/LearnMode";

export type Prompt = {
  id: number | string;
  title: string;
  category: string;
  prompt: string;
  whyItWorks?: string;
};

type Props = { prompts: Prompt[]; categories: string[] };

const STORAGE_KEY = "admin-prompts-open-id-v2";

// Per-category accent color, matched to the WRT/PLN/DBG/IDE/COD/PRO
// pattern shown on the reference design. Falls back to muted gray.
const CATEGORY_COLORS: Record<string, string> = {
  WRT: "var(--color-terracotta)",
  PLN: "var(--color-cyan)",
  DBG: "var(--color-magenta)",
  IDE: "var(--color-violet)",
  COD: "var(--color-organic)",
  PRO: "var(--color-rust)",
};

function shortTag(category: string): string {
  return category.slice(0, 3).toUpperCase();
}

function colorFor(category: string): string {
  return CATEGORY_COLORS[shortTag(category)] ?? "var(--color-muted-dark)";
}

function snippet(text: string, max = 140): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max).trimEnd() + "...";
}

export function PromptsList({ prompts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  // Hydrate last-open prompt from localStorage so Tennyson can deep-link
  // to the modal across sessions if he wants to.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOpenId(raw);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (openId) localStorage.setItem(STORAGE_KEY, openId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [openId]);

  // Close the modal on Escape.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && openId) setOpenId(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [openId]);

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

  const openPrompt = useMemo(
    () => prompts.find((p) => String(p.id) === openId) ?? null,
    [prompts, openId]
  );

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-8">
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

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const idKey = String(p.id);
          const tag = shortTag(p.category);
          const color = colorFor(p.category);
          return (
            <li key={idKey}>
              <button
                type="button"
                onClick={() => setOpenId(idKey)}
                className="group h-full w-full text-left glass-card p-5 md:p-6 flex flex-col gap-4 transition-colors hover:bg-[rgba(251,191,36,0.04)] cursor-pointer"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[4px] border"
                    style={{
                      color,
                      borderColor: color,
                      backgroundColor: `color-mix(in oklab, ${color} 10%, transparent)`,
                    }}
                  >
                    {tag}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
                    #{String(p.id).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-serif text-lg md:text-xl text-[var(--color-dark)] leading-snug">
                  {p.title}
                </h3>
                {p.whyItWorks && (
                  <p className="text-sm text-[var(--color-muted-dark)] leading-relaxed line-clamp-2">
                    {p.whyItWorks}
                  </p>
                )}
                <div className="mt-auto rounded-[8px] border border-[var(--color-border)] bg-[rgba(2,6,14,0.55)] px-3 py-2.5">
                  <p className="font-mono text-[11px] leading-snug text-[var(--color-muted-dark)] line-clamp-2">
                    {snippet(p.prompt)}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="italic text-[var(--color-muted)] mt-8 text-center">
          No prompts match this filter.
        </p>
      )}

      {openPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenId(null)}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[rgba(2,6,14,0.7)] backdrop-blur-sm"
          />
          <div
            className="relative glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span
                  className="self-start font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[4px] border"
                  style={{
                    color: colorFor(openPrompt.category),
                    borderColor: colorFor(openPrompt.category),
                  }}
                >
                  {openPrompt.category}
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-[var(--color-dark)] leading-tight">
                  {openPrompt.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close"
                className="font-mono text-xl text-[var(--color-muted)] hover:text-[var(--color-dark)] cursor-pointer leading-none"
              >
                ×
              </button>
            </header>

            <section>
              <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
                <p className="label text-[var(--color-muted-dark)]">Prompt</p>
                <div className="flex items-center gap-2">
                  <LearnHint
                    title="Run prompt"
                    body="Fires this prompt against Claude using your stored API key. Variables in the prompt become input slots; result lands inline with token cost."
                    more="Every run is recorded under Invocations and bumps a per-prompt usage counter that the heuristics on /admin/pulse read."
                    side="bottom-right"
                  >
                    <RunPrompt
                      prompt={openPrompt.prompt}
                      title={openPrompt.title}
                      promptId={openPrompt.id}
                    >
                      {(open) => (
                        <button
                          type="button"
                          onClick={open}
                          className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[6px] border border-[rgba(95,255,215,0.45)] text-[var(--color-cyan)] hover:bg-[rgba(95,255,215,0.08)] hover:border-[var(--color-cyan)] transition-colors cursor-pointer"
                        >
                          Run →
                        </button>
                      )}
                    </RunPrompt>
                  </LearnHint>
                  <button
                    type="button"
                    onClick={() => handleCopy(openPrompt.prompt)}
                    className={`font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[6px] border transition-colors cursor-pointer ${
                      copyState === "copied"
                        ? "border-[var(--color-organic)] text-[var(--color-organic)]"
                        : "border-[var(--color-border-dark)] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] hover:border-[var(--color-terracotta)]"
                    }`}
                  >
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-line text-[var(--color-dark)] leading-relaxed bg-[rgba(2,6,14,0.7)] border border-[var(--color-border)] rounded-[10px] p-4 font-mono text-sm">
                {openPrompt.prompt}
              </div>
            </section>

            {openPrompt.whyItWorks && (
              <section>
                <p className="label text-[var(--color-terracotta)] mb-2">
                  Why it works
                </p>
                <p className="text-[var(--color-muted-dark)] italic leading-relaxed">
                  {openPrompt.whyItWorks}
                </p>
              </section>
            )}
          </div>
        </div>
      )}
    </>
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
      className={`font-mono text-[11px] uppercase tracking-[0.10em] px-3.5 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-[var(--color-terracotta)] text-[var(--color-darker)] border-[var(--color-terracotta)]"
          : "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)] hover:border-[var(--color-terracotta)] hover:text-[var(--color-dark)]"
      }`}
    >
      {label}
    </button>
  );
}
