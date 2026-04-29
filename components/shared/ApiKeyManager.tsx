"use client";

import { useEffect, useState } from "react";
import {
  clearApiKey,
  fingerprintKey,
  getApiKey,
  looksLikeAnthropicKey,
  setApiKey,
} from "@/lib/byok";
import { LearnHint } from "@/components/shared/LearnMode";

type Status = "empty" | "stored" | "validating" | "invalid";

export function ApiKeyManager() {
  const [draft, setDraft] = useState("");
  const [stored, setStored] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const k = getApiKey();
    setStored(k);
    setStatus(k ? "stored" : "empty");
  }, []);

  const onSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!looksLikeAnthropicKey(trimmed)) {
      setStatus("invalid");
      return;
    }
    setApiKey(trimmed);
    setStored(trimmed);
    setDraft("");
    setStatus("stored");
  };

  const onClear = () => {
    clearApiKey();
    setStored(null);
    setStatus("empty");
    setDraft("");
  };

  return (
    <div className="api-key-manager">
      <div className="flex flex-col gap-2 mb-3">
        <LearnHint
          title="BYOK · bring your own key"
          body="Your Anthropic API key lives in this browser only. Calls go from your browser to api.anthropic.com directly; the AI Catch Up server never sees the key or the prompts."
          more="The trade-off: localStorage is XSS-readable, so anything that compromises the JS context could read the key. We don't roll our own encryption because anything decryptable from JS is theater."
          side="top-left"
        >
          <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Anthropic API key
          </label>
        </LearnHint>
        <p className="text-sm text-[var(--color-muted-dark)] leading-relaxed">
          Paste your key from{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-cyan)] underline underline-offset-2 hover:text-[var(--color-dark)] transition-colors"
          >
            console.anthropic.com/settings/keys
          </a>
          . Stored in this browser only. Sent directly to Anthropic when
          you run a prompt; never touches our server.
        </p>
      </div>

      {stored ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[rgba(74,222,128,0.40)] bg-[rgba(74,222,128,0.06)]">
            <span
              className="w-2 h-2 rounded-full bg-[var(--color-organic)]"
              style={{ boxShadow: "0 0 8px var(--color-organic)" }}
              aria-hidden
            />
            <span className="font-mono text-xs text-[var(--color-dark)]">
              {reveal ? stored : fingerprintKey(stored)}
            </span>
            <button
              type="button"
              onClick={() => setReveal((s) => !s)}
              className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] hover:text-[var(--color-cyan)] transition-colors"
            >
              {reveal ? "Hide" : "Reveal"}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-magenta)] hover:text-[var(--color-dark)] transition-colors"
            >
              Remove
            </button>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Ready · prompts in the library can run from here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (status === "invalid") setStatus("empty");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
              }}
              placeholder="sk-ant-…"
              className="flex-1 px-4 py-2.5 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[10px] text-[var(--color-dark)] placeholder:text-[var(--color-muted)] font-mono text-sm focus:outline-none focus:border-[var(--color-cyan)] focus:bg-[rgba(13,28,52,0.85)] transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={onSave}
              disabled={!draft.trim()}
              className="glass-button-primary px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save key
            </button>
          </div>
          {status === "invalid" && (
            <p className="font-mono text-xs text-[var(--color-magenta)]">
              Key should start with{" "}
              <code className="text-[var(--color-cyan)]">sk-ant-</code>. Double
              check the value from the Anthropic console.
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Without a key, prompts open in copy-only mode (no live runs).
          </p>
        </div>
      )}
    </div>
  );
}
