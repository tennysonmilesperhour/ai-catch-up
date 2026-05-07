"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type PaletteItem = {
  kind: "section" | "prompt" | "faq";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type Props = {
  items: PaletteItem[];
};

const KIND_LABEL: Record<PaletteItem["kind"], string> = {
  section: "Section",
  prompt: "Prompt",
  faq: "FAQ",
};
const KIND_COLOR: Record<PaletteItem["kind"], string> = {
  section: "var(--color-cyan)",
  prompt: "var(--color-magenta)",
  faq: "var(--color-violet)",
};

function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 1000 - t.indexOf(q);
  // Lightweight subsequence match for typo tolerance.
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length ? 100 - (t.length - q.length) : -1;
}

export function CommandPalette({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Open via ⌘K / Ctrl+K + custom event from SiteHeader button.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((s) => !s);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("command-palette:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("command-palette:open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      // Wait one frame so the input is mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query) return items.slice(0, 12);
    return items
      .map((item) => {
        const titleScore = fuzzyScore(query, item.title);
        const subScore = item.subtitle ? fuzzyScore(query, item.subtitle) : -1;
        return { item, score: Math.max(titleScore, subScore) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((r) => r.item);
  }, [items, query]);

  const navigate = (item: PaletteItem) => {
    setOpen(false);
    if (item.href.startsWith("#")) {
      const el = document.querySelector(item.href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.hash = item.href;
    } else {
      window.location.href = item.href;
    }
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIdx];
      if (item) navigate(item);
    }
  };

  if (!open) return null;

  return (
    <div className="cmdk-overlay" role="dialog" aria-modal="true">
      <div
        className="cmdk-backdrop"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="cmdk-card">
        <div className="cmdk-input-row">
          <span className="cmdk-prefix" aria-hidden>
            ⌘K
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Jump to a section, prompt, or question…"
            className="cmdk-input"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cmdk-count num-tab">
            {results.length} / {items.length}
          </span>
        </div>
        <div className="cmdk-list">
          {results.length === 0 && (
            <div className="cmdk-empty">No matches. Try a different word.</div>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`cmdk-row ${i === activeIdx ? "active" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => navigate(item)}
            >
              <span
                className="cmdk-kind"
                style={{ color: KIND_COLOR[item.kind] }}
              >
                {KIND_LABEL[item.kind]}
              </span>
              <span className="cmdk-body">
                <span className="cmdk-title">{item.title}</span>
                {item.subtitle && (
                  <span className="cmdk-sub">{item.subtitle}</span>
                )}
              </span>
              <span className="cmdk-href num-tab">{item.href}</span>
            </button>
          ))}
        </div>
        <div className="cmdk-foot">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span className="num-tab">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
