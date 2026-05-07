"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { readSetupState, setPhaseStatus } from "@/lib/setup-state";

type Account = {
  key: string;
  name: string;
  detail: string;
  href: string;
  required: boolean;
};

const ACCOUNTS: Account[] = [
  {
    key: "anthropic",
    name: "Anthropic",
    detail: "API key for the Run button. Free tier covers setup.",
    href: "https://console.anthropic.com/settings/keys",
    required: true,
  },
  {
    key: "github",
    name: "GitHub",
    detail: "Where your starter repo lives. Free for individuals.",
    href: "https://github.com/signup",
    required: true,
  },
  {
    key: "vercel",
    name: "Vercel",
    detail: "Hosts your live site. Connect with GitHub for one-click deploys.",
    href: "https://vercel.com/signup",
    required: true,
  },
  {
    key: "stripe",
    name: "Stripe",
    detail: "Optional. Skip if you're not selling anything yet.",
    href: "https://dashboard.stripe.com/register",
    required: false,
  },
  {
    key: "1password",
    name: "1Password",
    detail: "Optional. Recommended for managing API keys safely across devices.",
    href: "https://1password.com",
    required: false,
  },
];

export default function AccountsPhase() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const state = readSetupState();
    const stored = state.phases.accounts.data.checked as
      | Record<string, boolean>
      | undefined;
    if (stored) setChecked(stored);
  }, []);

  const toggle = (key: string) => {
    setChecked((s) => {
      const next = { ...s, [key]: !s[key] };
      const required = ACCOUNTS.filter((a) => a.required).map((a) => a.key);
      const allRequiredDone = required.every((k) => next[k]);
      setPhaseStatus(
        "accounts",
        allRequiredDone ? "done" : "in-progress",
        { checked: next }
      );
      return next;
    });
  };

  const requiredCount = ACCOUNTS.filter((a) => a.required).length;
  const requiredDone = ACCOUNTS.filter(
    (a) => a.required && checked[a.key]
  ).length;

  return (
    <div className="setup-main">
      <header className="setup-phase-head">
        <SectionEyebrow>Phase 02 · 15 minutes</SectionEyebrow>
        <h1 className="setup-phase-title">
          Set up accounts.{" "}
          <span className="headline-gradient">{requiredDone}/{requiredCount} required.</span>
        </h1>
        <p className="setup-phase-lead">
          Each link opens the signup page in a new tab. Tick the box once
          you've signed in. Three are required; two are optional and can be
          added later.
        </p>
      </header>

      <article className="glass-card-static setup-card">
        <h3>Accounts</h3>
        <div className="setup-checklist">
          {ACCOUNTS.map((a) => (
            <div
              key={a.key}
              className={`setup-checklist-item ${checked[a.key] ? "is-done" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggle(a.key)}
                className={`setup-checkbox ${checked[a.key] ? "is-done" : ""}`}
                aria-pressed={Boolean(checked[a.key])}
                aria-label={`Mark ${a.name} done`}
              >
                ✓
              </button>
              <div className="setup-checklist-body">
                <span className="setup-checklist-name">
                  {a.name}{" "}
                  {!a.required && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      · optional
                    </span>
                  )}
                </span>
                <span className="setup-checklist-detail">{a.detail}</span>
              </div>
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="setup-checklist-link"
              >
                Open →
              </a>
            </div>
          ))}
        </div>
      </article>

      <div className="setup-actions">
        <Link href="/setup/starter" className="glass-button-primary setup-action-primary">
          Continue to Phase 03 →
        </Link>
        <Link href="/setup/capture" className="setup-action-ghost">
          ← Back to Phase 01
        </Link>
      </div>
    </div>
  );
}
