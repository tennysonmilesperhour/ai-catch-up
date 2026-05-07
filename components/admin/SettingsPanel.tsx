"use client";

import { useEffect, useState } from "react";
import {
  ConnectionConnectButton,
  ConnectionConnectPanel,
  type ConnectProvider,
} from "@/components/admin/ConnectionConnect";
import { LearnModeToggle } from "@/components/shared/LearnMode";
import { ApiKeyManager } from "@/components/shared/ApiKeyManager";

const STORAGE_KEY = "admin-settings-v1";

type ToolKey = "code-execution" | "web-search" | "file-access" | "long-term-memory";
type NotificationKey = "weekly-review" | "new-prompt" | "billing";

type Settings = {
  tone: number;
  tools: Record<ToolKey, boolean>;
  notifications: Record<NotificationKey, boolean>;
};

const DEFAULTS: Settings = {
  tone: 70,
  tools: {
    "code-execution": true,
    "web-search": true,
    "file-access": true,
    "long-term-memory": false,
  },
  notifications: {
    "weekly-review": true,
    "new-prompt": true,
    billing: false,
  },
};

const TOOL_LABELS: { key: ToolKey; label: string }[] = [
  { key: "code-execution", label: "Code execution" },
  { key: "web-search", label: "Web search" },
  { key: "file-access", label: "File access" },
  { key: "long-term-memory", label: "Long-term memory" },
];

const NOTIFICATION_ROWS: {
  key: NotificationKey;
  label: string;
  detail: string;
}[] = [
  {
    key: "weekly-review",
    label: "Weekly review nudge",
    detail: "Friday at 4pm. One paragraph.",
  },
  {
    key: "new-prompt",
    label: "New prompt added",
    detail: "When the library expands.",
  },
  {
    key: "billing",
    label: "Billing reminders",
    detail: "Receipts and usage caps.",
  },
];

const CONNECTION_ROWS = [
  {
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    manageHref: "https://console.anthropic.com/settings/keys",
  },
  {
    label: "GitHub",
    envKey: "GITHUB_USERNAME",
    manageHref: "https://github.com/settings/tokens",
  },
  {
    label: "Vercel",
    envKey: "VERCEL",
    manageHref: "https://vercel.com/dashboard",
  },
  {
    label: "Stripe",
    envKey: "STRIPE_PAYMENT_LINK",
    manageHref: "https://dashboard.stripe.com/payment-links",
  },
];

type ConnectionStatus = {
  label: string;
  manageHref: string;
  configured: boolean;
  // Optional connect-form metadata. Provided for providers that have a
  // testable API key. When omitted, only the status pill + Manage link
  // appear (e.g. Vercel, Stripe payment-link).
  provider?: ConnectProvider;
  envVar?: string;
  vercelEnvUrl?: string;
  connectHint?: string;
};

type Props = {
  connections: ConnectionStatus[];
};

export function SettingsPanel({ connections }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "done">("idle");
  const [openConnect, setOpenConnect] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings({
          tone: typeof parsed.tone === "number" ? parsed.tone : DEFAULTS.tone,
          tools: { ...DEFAULTS.tools, ...(parsed.tools ?? {}) },
          notifications: {
            ...DEFAULTS.notifications,
            ...(parsed.notifications ?? {}),
          },
        });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings, hydrated]);

  const setTone = (tone: number) => setSettings((s) => ({ ...s, tone }));
  const toggleTool = (key: ToolKey) =>
    setSettings((s) => ({
      ...s,
      tools: { ...s.tools, [key]: !s.tools[key] },
    }));
  const toggleNotification = (key: NotificationKey) =>
    setSettings((s) => ({
      ...s,
      notifications: { ...s.notifications, [key]: !s.notifications[key] },
    }));

  const handleReset = () => {
    if (
      !window.confirm(
        "Reset workspace? This clears your local checklist progress, prompt open state, and these settings. Your CLAUDE.md and content stay on disk."
      )
    ) {
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("admin-prompts-open-ids-v1");
      localStorage.removeItem("launch-checklist-state-v1");
    } catch {}
    setSettings(DEFAULTS);
    setResetState("done");
    setTimeout(() => setResetState("idle"), 2400);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Voice */}
      <section className="glass-card p-6 md:p-7">
        <header className="mb-5">
          <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)] mb-1">
            Voice
          </h2>
          <p className="text-[var(--color-muted-dark)] text-sm">
            How Claude talks to you. Sliders affect Claude&rsquo;s voice in
            your next session.
          </p>
        </header>
        <div className="grid gap-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label
                htmlFor="tone"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]"
              >
                Tone
              </label>
              <span className="font-mono text-[10px] text-[var(--color-muted-dark)]">
                {settings.tone}/100
              </span>
            </div>
            <input
              id="tone"
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.tone}
              onChange={(e) => setTone(Number(e.target.value))}
              className="tone-slider w-full cursor-pointer"
              style={
                {
                  "--tone-pct": `${settings.tone}%`,
                } as React.CSSProperties
              }
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)]">
              <span>Direct</span>
              <span>Warm</span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-2">
              Tools
            </p>
            <div className="flex flex-wrap gap-2">
              {TOOL_LABELS.map(({ key, label }) => {
                const on = settings.tools[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleTool(key)}
                    aria-pressed={on}
                    className={`font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border transition-colors cursor-pointer ${
                      on
                        ? "border-[var(--color-terracotta)] text-[var(--color-terracotta)] bg-[rgba(251,191,36,0.06)]"
                        : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-dark)]"
                    }`}
                  >
                    {on ? "x" : "+"} {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Connections */}
      <section className="glass-card p-6 md:p-7">
        <header className="mb-5">
          <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)] mb-1">
            Account &amp; connections
          </h2>
          <p className="text-[var(--color-muted-dark)] text-sm">
            External services this workspace connects to. Status is read from
            environment variables on the server.
          </p>
        </header>
        <ul className="flex flex-col gap-4">
          {connections.map((c) => {
            const canConnect =
              !c.configured &&
              c.provider !== undefined &&
              c.envVar !== undefined &&
              c.vercelEnvUrl !== undefined;
            const isOpen = openConnect === c.label;
            return (
              <li key={c.label} className="flex flex-col">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="font-mono text-xs uppercase tracking-[0.10em] text-[var(--color-dark)]">
                    {c.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`status-pill ${c.configured ? "is-done" : "is-blocked"}`}
                    >
                      {c.configured ? "Connected" : "Missing"}
                    </span>
                    {canConnect && (
                      <ConnectionConnectButton
                        expanded={isOpen}
                        onClick={() =>
                          setOpenConnect(isOpen ? null : c.label)
                        }
                      />
                    )}
                    <a
                      href={c.manageHref}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
                    >
                      Manage &rarr;
                    </a>
                  </div>
                </div>
                {canConnect && isOpen && (
                  <ConnectionConnectPanel
                    provider={c.provider as ConnectProvider}
                    envVar={c.envVar as string}
                    vercelEnvUrl={c.vercelEnvUrl as string}
                    hint={c.connectHint}
                    onClose={() => setOpenConnect(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Notifications */}
      <section className="glass-card p-6 md:p-7">
        <header className="mb-5">
          <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)] mb-1">
            Notifications
          </h2>
          <p className="text-[var(--color-muted-dark)] text-sm">
            Default off. Turn things on as you find you want them. Stored on
            this device.
          </p>
        </header>
        <ul className="flex flex-col gap-4">
          {NOTIFICATION_ROWS.map(({ key, label, detail }) => {
            const on = settings.notifications[key];
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-[0.10em] text-[var(--color-dark)]">
                    {label}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {detail}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggleNotification(key)}
                  className={`shrink-0 relative w-11 h-6 rounded-full border transition-colors cursor-pointer ${
                    on
                      ? "bg-[var(--color-terracotta)] border-[var(--color-terracotta)]"
                      : "bg-transparent border-[var(--color-border-dark)]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-[var(--color-dark)] transition-all ${
                      on ? "left-[22px]" : "left-[2px]"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Danger zone */}
      <section className="glass-card p-6 md:p-7 border-l-[3px] border-l-[var(--color-magenta)]">
        <header className="mb-3">
          <h2 className="font-serif text-xl md:text-2xl text-[var(--color-magenta)] mb-1">
            Danger zone
          </h2>
          <p className="text-[var(--color-muted-dark)] text-sm">
            Resetting clears your local checklist progress, prompt open state,
            and these settings. Your CLAUDE.md and content stay on disk.
          </p>
        </header>
        <button
          type="button"
          onClick={handleReset}
          className={`font-mono text-[11px] uppercase tracking-[0.10em] px-4 py-2 rounded-[8px] border transition-colors cursor-pointer ${
            resetState === "done"
              ? "border-[var(--color-organic)] text-[var(--color-organic)]"
              : "border-[var(--color-magenta)] text-[var(--color-magenta)] hover:bg-[rgba(255,95,179,0.08)]"
          }`}
        >
          {resetState === "done" ? "Workspace reset" : "Reset workspace"}
        </button>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[var(--color-dark)] mb-2">
          API key
        </h2>
        <p className="text-[var(--color-muted-dark)] leading-relaxed mb-5 max-w-2xl">
          Required to run prompts and complete the guided setup. Bring your
          own Anthropic key. We never see it; calls go from your browser
          straight to api.anthropic.com.
        </p>
        <ApiKeyManager />
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[var(--color-dark)] mb-2">
          Learn mode
        </h2>
        <p className="text-[var(--color-muted-dark)] leading-relaxed mb-5">
          Educational tooltips on technical and process terms across the
          marketing site and admin. On by default. Toggle off once the
          terminology feels natural; you can flip it back from the chip in
          the utility bar at any time.
        </p>
        <LearnModeToggle variant="switch" />
      </section>
    </div>
  );
}
