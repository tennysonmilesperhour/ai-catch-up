"use client";

import { useState } from "react";

export type ConnectProvider = "anthropic" | "github" | "stripe";

const PROVIDER_LABEL: Record<ConnectProvider, string> = {
  anthropic: "Anthropic",
  github: "GitHub",
  stripe: "Stripe",
};

type Outcome =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok"; detail: string }
  | { kind: "error"; reason: string };

type ButtonProps = {
  onClick: () => void;
  expanded: boolean;
};

export function ConnectionConnectButton({ onClick, expanded }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-border-dark)] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] hover:border-[var(--color-terracotta)] transition-colors cursor-pointer"
    >
      {expanded ? "Cancel" : "Connect"}
    </button>
  );
}

type PanelProps = {
  provider: ConnectProvider;
  envVar: string;
  vercelEnvUrl: string;
  inputType?: "password" | "text";
  hint?: string;
  onClose: () => void;
};

export function ConnectionConnectPanel({
  provider,
  envVar,
  vercelEnvUrl,
  inputType = "password",
  hint,
  onClose,
}: PanelProps) {
  const [key, setKey] = useState("");
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });

  async function handleTest() {
    if (!key.trim()) {
      setOutcome({ kind: "error", reason: "paste a key first" });
      return;
    }
    setOutcome({ kind: "testing" });
    try {
      const res = await fetch("/api/admin/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: key.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        detail?: string;
        reason?: string;
        error?: string;
      };
      if (!res.ok) {
        setOutcome({
          kind: "error",
          reason: body.error ?? `request failed (${res.status})`,
        });
        return;
      }
      if (body.ok) {
        setOutcome({ kind: "ok", detail: body.detail ?? "Key valid." });
      } else {
        setOutcome({
          kind: "error",
          reason: body.reason ?? "key rejected",
        });
      }
    } catch (err) {
      setOutcome({
        kind: "error",
        reason: err instanceof Error ? err.message : "network error",
      });
    }
  }

  return (
    <div className="w-full mt-3 rounded-[10px] border border-[var(--color-border-dark)] bg-[rgba(2,6,14,0.55)] p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-terracotta)]">
          Connect {PROVIDER_LABEL[provider]}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] cursor-pointer"
        >
          Close
        </button>
      </div>

      {hint && (
        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
          {hint}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
          API key
        </span>
        <input
          type={inputType}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste the key from the provider dashboard"
          autoComplete="off"
          spellCheck={false}
          className="px-3 py-2 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[8px] text-[var(--color-dark)] placeholder:text-[var(--color-muted)] font-mono text-xs focus:outline-none focus:border-[var(--color-terracotta)]"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={outcome.kind === "testing"}
          className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[rgba(251,191,36,0.08)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {outcome.kind === "testing" ? "Testing..." : "Test connection"}
        </button>
      </div>

      {outcome.kind === "error" && (
        <div
          role="alert"
          className="rounded-[8px] border border-[var(--color-magenta)] bg-[rgba(255,95,179,0.05)] px-3 py-2 text-sm text-[var(--color-magenta)]"
        >
          {outcome.reason}
        </div>
      )}

      {outcome.kind === "ok" && (
        <div className="rounded-[8px] border border-[var(--color-organic)] bg-[rgba(74,222,128,0.05)] px-3 py-3 flex flex-col gap-2.5">
          <p className="text-sm text-[var(--color-organic)]">
            <span className="font-semibold">Key valid.</span> {outcome.detail}
          </p>
          <div className="rounded-[6px] bg-[rgba(2,6,14,0.7)] border border-[var(--color-border)] px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] mb-1">
              Save in Vercel as
            </p>
            <p className="font-mono text-sm text-[var(--color-dark)]">
              {envVar}
            </p>
          </div>
          <p className="text-xs text-[var(--color-muted-dark)] leading-relaxed">
            v1.0 has no database, so keys live in Vercel env vars. Open Vercel
            env vars, add a new one with the name above, paste the same key
            you just tested, save, and trigger a redeploy. The status here
            will flip to <span className="text-[var(--color-organic)]">Connected</span> on the next page load.
          </p>
          <a
            href={vercelEnvUrl}
            target="_blank"
            rel="noreferrer"
            className="self-start font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[rgba(251,191,36,0.08)] transition-colors"
          >
            Open Vercel env vars &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
