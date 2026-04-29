"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getApiKey } from "@/lib/byok";
import {
  DEFAULT_MODEL,
  HEAVY_MODEL,
  extractVariables,
  fillVariables,
  runMessage,
  type RunResult,
} from "@/lib/anthropic-client";

type RunPromptProps = {
  /** The prompt template with {{var}} or [PLACEHOLDER] tokens. */
  prompt: string;
  /** Display name shown in the modal header. */
  title: string;
  /** Optional system prompt (e.g., the buyer's CLAUDE.md). */
  system?: string;
  /** Optional model override; defaults to claude-sonnet-4-6. */
  model?: string;
  /** Trigger element. Clicking it opens the modal. */
  children: (open: () => void) => React.ReactNode;
  /** Called with the final assistant text on a successful run. */
  onResult?: (text: string) => void;
};

type RunState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; result: RunResult & { ok: true } }
  | { kind: "error"; message: string };

const HISTORY_KEY = "run-prompt-history-v1";
const HISTORY_MAX = 30;

type HistoryEntry = {
  id: string;
  ts: number;
  title: string;
  prompt: string;
  result: string;
  inputTokens: number;
  outputTokens: number;
};

export function appendHistory(entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(list.slice(0, HISTORY_MAX))
    );
  } catch {
    /* ignore */
  }
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function RunPrompt({
  prompt,
  title,
  system,
  model,
  children,
  onResult,
}: RunPromptProps) {
  const [open, setOpen] = useState(false);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [hasKey, setHasKey] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const variables = useMemo(() => extractVariables(prompt), [prompt]);

  useEffect(() => {
    if (!open) return;
    setHasKey(Boolean(getApiKey()));
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("keydown", onEsc);
      abortRef.current?.abort();
    };
  }, [open]);

  const filled = useMemo(() => fillVariables(prompt, vars), [prompt, vars]);
  const ready = variables.every((v) => (vars[v] ?? "").trim().length > 0);

  const onRun = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setState({
        kind: "error",
        message: "Add your Anthropic API key in Settings before running.",
      });
      return;
    }
    setState({ kind: "running" });
    abortRef.current = new AbortController();
    const result = await runMessage(apiKey, filled, {
      model: model ?? DEFAULT_MODEL,
      system,
      signal: abortRef.current.signal,
    });
    if (!result.ok) {
      setState({ kind: "error", message: result.error });
      return;
    }
    setState({ kind: "success", result });
    appendHistory({
      id: `run-${Date.now()}`,
      ts: Date.now(),
      title,
      prompt: filled,
      result: result.content,
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
    });
    onResult?.(result.content);
  };

  const onCopyResult = async () => {
    if (state.kind !== "success") return;
    try {
      await navigator.clipboard.writeText(state.result.content);
    } catch {
      /* ignore */
    }
  };

  const onCopyFilled = async () => {
    try {
      await navigator.clipboard.writeText(filled);
    } catch {
      /* ignore */
    }
  };

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="run-overlay" role="dialog" aria-modal="true">
            <div
              className="run-backdrop"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="run-card glass-card-static">
              <header className="run-head">
                <div className="flex flex-col gap-1">
                  <span className="run-eyebrow">
                    Run prompt · {model ?? DEFAULT_MODEL}
                    {!hasKey && (
                      <span className="run-eyebrow-warn"> · no key set</span>
                    )}
                  </span>
                  <h3 className="run-title">{title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="run-close"
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>

              <div className="run-body">
                {variables.length > 0 && (
                  <section className="run-section">
                    <p className="run-section-label">
                      Variables · {variables.length}
                    </p>
                    <div className="flex flex-col gap-3">
                      {variables.map((v) => (
                        <label key={v} className="flex flex-col gap-1.5">
                          <span className="run-var-label">{v}</span>
                          <textarea
                            value={vars[v] ?? ""}
                            onChange={(e) =>
                              setVars((s) => ({ ...s, [v]: e.target.value }))
                            }
                            rows={Math.min(
                              6,
                              Math.max(1, (vars[v] ?? "").split("\n").length)
                            )}
                            className="run-input"
                            placeholder={`fill in ${v.toLowerCase()}…`}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                )}

                <section className="run-section">
                  <p className="run-section-label">Prompt preview</p>
                  <pre className="run-preview">{filled}</pre>
                </section>

                {state.kind === "success" && (
                  <section className="run-section">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <p className="run-section-label">Result</p>
                      <span className="run-tokens num-tab">
                        {state.result.usage.input_tokens} in /{" "}
                        {state.result.usage.output_tokens} out
                      </span>
                    </div>
                    <pre className="run-result">{state.result.content}</pre>
                  </section>
                )}

                {state.kind === "error" && (
                  <p className="run-error">⚠ {state.message}</p>
                )}
              </div>

              <footer className="run-foot">
                <button
                  type="button"
                  onClick={onCopyFilled}
                  className="run-button-ghost"
                >
                  Copy prompt
                </button>
                {state.kind === "success" && (
                  <button
                    type="button"
                    onClick={onCopyResult}
                    className="run-button-ghost"
                  >
                    Copy result
                  </button>
                )}
                <span className="flex-1" />
                {state.kind === "running" ? (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="run-button-ghost"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onRun}
                    disabled={!ready || !hasKey}
                    className="glass-button-primary run-button-go"
                    title={
                      !hasKey
                        ? "Add your Anthropic API key in Settings first."
                        : !ready
                          ? "Fill in all variables first."
                          : ""
                    }
                  >
                    {state.kind === "success" ? "Run again →" : "Run →"}
                  </button>
                )}
              </footer>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {children(() => setOpen(true))}
      {modal}
    </>
  );
}

// Re-export a sensible default model selector for callers that need it.
export { DEFAULT_MODEL, HEAVY_MODEL };
