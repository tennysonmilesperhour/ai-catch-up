"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import glossaryData from "@/content/glossary.json";

// ============================================================================
// Glossary
// ============================================================================

type GlossaryEntry = {
  brief: string;
  more?: string;
  kind?: string;
};

const GLOSSARY: Record<string, GlossaryEntry> =
  (glossaryData as { terms?: Record<string, GlossaryEntry> }).terms ?? {};

// Lowercase lookup so callers can pass `<LearnTerm term="claude code">` and
// match the canonical capitalization in the glossary.
const GLOSSARY_LC: Record<string, GlossaryEntry & { canonical: string }> =
  Object.fromEntries(
    Object.entries(GLOSSARY).map(([k, v]) => [
      k.toLowerCase(),
      { ...v, canonical: k },
    ])
  );

export type ResolvedGlossaryEntry = GlossaryEntry & { canonical: string };

export function lookupTerm(term: string): ResolvedGlossaryEntry | undefined {
  return GLOSSARY_LC[term.toLowerCase()];
}

// ============================================================================
// Context + provider
// ============================================================================

type LearnModeContextValue = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
  // First-visit hint state. Resolves to false after dismissal so the toast
  // never re-shows.
  showWelcome: boolean;
  dismissWelcome: () => void;
};

const LearnModeContext = createContext<LearnModeContextValue>({
  enabled: true,
  toggle: () => {},
  setEnabled: () => {},
  showWelcome: false,
  dismissWelcome: () => {},
});

const STORAGE_KEY = "learn-mode-v1"; // value: "on" | "off"
const WELCOME_KEY = "learn-mode-welcome-v1"; // value: "seen"

export function LearnModeProvider({ children }: { children: ReactNode }) {
  // Default to enabled. Hydration-safe: SSR renders `enabled=true` and the
  // first client paint matches; if localStorage says off we flip post-mount.
  const [enabled, setEnabledState] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "off") setEnabledState(false);
      const seen = window.localStorage.getItem(WELCOME_KEY);
      if (!seen && stored !== "off") {
        // First visit (or first visit since key version bump) and not
        // explicitly disabled: show the welcome callout.
        setShowWelcome(true);
      }
    } catch {
      // localStorage unavailable (private mode, SSR rehydration race) —
      // default state is fine.
    }
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_KEY, "seen");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LearnModeContextValue>(
    () => ({ enabled, toggle, setEnabled, showWelcome, dismissWelcome }),
    [enabled, toggle, setEnabled, showWelcome, dismissWelcome]
  );

  return (
    <LearnModeContext.Provider value={value}>
      {children}
      <LearnModeWelcome />
    </LearnModeContext.Provider>
  );
}

export function useLearnMode() {
  return useContext(LearnModeContext);
}

// ============================================================================
// AutoLearnText: scans a string and wraps the first occurrence of each
// known glossary term with <LearnTerm>. Lets us tooltip MDX-sourced copy
// without rewriting the markdown — Strategy Claude keeps owning the
// content, and Learn mode adds the affordance on top.
// ============================================================================

let CACHED_PATTERN: RegExp | null = null;
function getTermPattern(): RegExp {
  if (CACHED_PATTERN) return CACHED_PATTERN;
  const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const escaped = keys.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  CACHED_PATTERN = new RegExp("\\b(" + escaped.join("|") + ")\\b", "gi");
  return CACHED_PATTERN;
}

export function AutoLearnText({ children }: { children: string }) {
  const pattern = getTermPattern();
  pattern.lastIndex = 0;
  const parts: ReactNode[] = [];
  const seen = new Set<string>();
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(children)) !== null) {
    const term = match[0];
    const lowerTerm = term.toLowerCase();
    if (seen.has(lowerTerm)) continue;
    seen.add(lowerTerm);
    if (match.index > lastIdx) {
      parts.push(children.slice(lastIdx, match.index));
    }
    parts.push(
      <LearnTerm key={`${match.index}-${term}`} term={term}>
        {term}
      </LearnTerm>
    );
    lastIdx = match.index + term.length;
  }
  if (lastIdx < children.length) {
    parts.push(children.slice(lastIdx));
  }
  return <>{parts}</>;
}

// ============================================================================
// LearnTerm: wraps a word/phrase with a dotted underline + popover
// ============================================================================

type LearnTermProps = {
  term?: string; // glossary key; defaults to the children text if omitted
  children: ReactNode;
};

export function LearnTerm({ term, children }: LearnTermProps) {
  const { enabled } = useLearnMode();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  // Resolve the glossary entry from the explicit term prop or the rendered
  // children text. If neither resolves to a known entry, render plain text
  // so callers can wrap optimistically without breaking.
  const resolvedKey =
    term ?? (typeof children === "string" ? children : undefined);
  const entry = resolvedKey ? lookupTerm(resolvedKey) : undefined;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!enabled || !entry) {
    return <>{children}</>;
  }

  return (
    <span
      ref={wrapRef}
      className={`learn-term ${open ? "is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="learn-term-trigger"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen((s) => !s);
        }}
      >
        {children}
      </button>
      {open && (
        <span className="learn-term-pop" role="tooltip">
          <span className="learn-term-head">
            <span className="learn-term-name">{entry.canonical}</span>
            {entry.kind && (
              <span className="learn-term-kind">· {entry.kind}</span>
            )}
          </span>
          <span className="learn-term-brief">{entry.brief}</span>
          {entry.more && <span className="learn-term-more">{entry.more}</span>}
        </span>
      )}
    </span>
  );
}

// ============================================================================
// LearnModeToggle: small chip suitable for the UtilityBar or settings page
// ============================================================================

export function LearnModeToggle({
  className = "",
  variant = "chip",
}: {
  className?: string;
  variant?: "chip" | "switch";
}) {
  const { enabled, toggle } = useLearnMode();

  if (variant === "switch") {
    return (
      <label className={`learn-mode-switch ${className}`}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle()}
        />
        <span className="track" aria-hidden>
          <span className="thumb" />
        </span>
        <span className="label">
          Learn mode {enabled ? "on" : "off"}
        </span>
      </label>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`learn-mode-chip ${enabled ? "is-on" : "is-off"} ${className}`}
      aria-pressed={enabled}
      title={
        enabled
          ? "Learn mode on. Click to hide tooltips."
          : "Learn mode off. Click to show tooltips on technical terms."
      }
    >
      <span className="dot" aria-hidden />
      <span className="label">Learn {enabled ? "on" : "off"}</span>
    </button>
  );
}

// ============================================================================
// LearnModeWelcome: first-visit floating callout
// ============================================================================

function LearnModeWelcome() {
  const { showWelcome, dismissWelcome } = useLearnMode();
  if (!showWelcome) return null;

  return (
    <div className="learn-welcome" role="status" aria-live="polite">
      <span className="learn-welcome-eyebrow">
        <span className="dot" aria-hidden /> Learn mode is on
      </span>
      <p className="learn-welcome-msg">
        Words like{" "}
        <span className="learn-term inline-demo">
          <span className="learn-term-trigger as-text">CLAUDE.md</span>
        </span>{" "}
        and{" "}
        <span className="learn-term inline-demo">
          <span className="learn-term-trigger as-text">Workspace Pulse</span>
        </span>{" "}
        get a dotted underline. Hover or tap any of them for a plain-language
        explanation. Toggle off in the bar at the top once you don't need it.
      </p>
      <button
        type="button"
        className="learn-welcome-button"
        onClick={dismissWelcome}
      >
        Got it
      </button>
    </div>
  );
}
