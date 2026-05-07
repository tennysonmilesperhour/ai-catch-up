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
import { createPortal } from "react-dom";
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
      // localStorage unavailable (private mode, SSR rehydration race) -
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
// without rewriting the markdown, Strategy Claude keeps owning the
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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  // Resolve the glossary entry from the explicit term prop or the rendered
  // children text. If neither resolves to a known entry, render plain text
  // so callers can wrap optimistically without breaking.
  const resolvedKey =
    term ?? (typeof children === "string" ? children : undefined);
  const entry = resolvedKey ? lookupTerm(resolvedKey) : undefined;

  const positionPopover = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    // Position popover below the trigger, anchored to the trigger's left.
    // Keep it inside the viewport with a 16px right-edge buffer.
    const POPOVER_MAX = 360;
    const margin = 16;
    let left = rect.left;
    if (left + POPOVER_MAX > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - POPOVER_MAX - margin);
    }
    setCoords({ top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    positionPopover();
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScrollOrResize() {
      // Re-anchor while open so the popover follows the trigger as the
      // user scrolls; close once the trigger leaves the viewport.
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        return;
      }
      positionPopover();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, positionPopover]);

  if (!enabled || !entry) {
    return <>{children}</>;
  }

  // Portal the popover into document.body so it escapes any ancestor
  // overflow:hidden / backdrop-filter containing blocks (the glass-card
  // surfaces both clip absolutely-positioned children).
  const popover =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <span
            className="learn-term-pop"
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
          >
            <span className="learn-term-head">
              <span className="learn-term-name">{entry.canonical}</span>
              {entry.kind && (
                <span className="learn-term-kind">· {entry.kind}</span>
              )}
            </span>
            <span className="learn-term-brief">{entry.brief}</span>
            {entry.more && (
              <span className="learn-term-more">{entry.more}</span>
            )}
          </span>,
          document.body
        )
      : null;

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
      {popover}
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
// LearnModeWelcome: first-visit floating callout with don't-show-again
// ============================================================================

function LearnModeWelcome() {
  const { showWelcome, dismissWelcome, setEnabled } = useLearnMode();
  const [dontShow, setDontShow] = useState(true);
  const [hiddenForSession, setHiddenForSession] = useState(false);
  if (!showWelcome || hiddenForSession) return null;

  const onGotIt = () => {
    if (dontShow) {
      // Permanent dismissal: writes seen flag to localStorage.
      dismissWelcome();
    } else {
      // Session-only: hides until next page load, never persists.
      setHiddenForSession(true);
    }
  };

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
        get a dotted underline. UI elements with a hidden how-it-works note
        get a subtle cyan ring on hover. Toggle off in the bar at the top
        once you don't need it.
      </p>
      <label className="learn-welcome-check">
        <input
          type="checkbox"
          checked={dontShow}
          onChange={(e) => setDontShow(e.target.checked)}
        />
        <span>Don't show this again</span>
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="learn-welcome-button"
          onClick={onGotIt}
        >
          Got it
        </button>
        <button
          type="button"
          className="learn-welcome-secondary"
          onClick={() => {
            setEnabled(false);
            dismissWelcome();
          }}
        >
          Turn off Learn mode
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// LearnHint: wraps any UI element with a tooltip explaining what it does.
// The embedded-tutorial half of Learn mode, extends beyond vocabulary to
// cover buttons, panels, regions, processes.
// ============================================================================

type LearnHintProps = {
  title: string;
  body: string;
  more?: string;
  /** Position of the indicator badge relative to the wrapped element. */
  side?: "top-right" | "top-left" | "bottom-right";
  children: ReactNode;
  /** Inline-style hint (no badge, just hover ring). Default true. */
  inlineRing?: boolean;
};

export function LearnHint({
  title,
  body,
  more,
  side = "top-right",
  children,
  inlineRing = true,
}: LearnHintProps) {
  const { enabled } = useLearnMode();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  // Delay-on-hover so dense coverage doesn't spam popovers when the user
  // is casually mousing across the page. Tap/click-on-badge opens
  // immediately. Hover-out cancels the pending open.
  const HOVER_DELAY_MS = 320;
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelHover = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };
  const onMouseEnter = () => {
    cancelHover();
    openTimerRef.current = setTimeout(() => {
      setOpen(true);
      openTimerRef.current = null;
    }, HOVER_DELAY_MS);
  };
  const onMouseLeave = () => {
    cancelHover();
    setOpen(false);
  };

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

  // Cleanup pending hover timer on unmount.
  useEffect(() => () => cancelHover(), []);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <span
      ref={wrapRef}
      className={`learn-hint ${inlineRing ? "with-ring" : ""} ${open ? "is-open" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      <button
        type="button"
        className={`learn-hint-badge side-${side}`}
        aria-label={`Learn about ${title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cancelHover();
          setOpen((s) => !s);
        }}
        tabIndex={-1}
      >
        ?
      </button>
      {open && (
        <span className={`learn-term-pop learn-hint-pop side-${side}`} role="tooltip">
          <span className="learn-term-head">
            <span className="learn-term-name">{title}</span>
            <span className="learn-term-kind">· tutorial</span>
          </span>
          <span className="learn-term-brief">{body}</span>
          {more && <span className="learn-term-more">{more}</span>}
        </span>
      )}
    </span>
  );
}
