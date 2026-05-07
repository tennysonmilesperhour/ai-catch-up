"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { readSetupState, setPhaseStatus } from "@/lib/setup-state";

type Step = {
  key: string;
  title: string;
  body: string;
  cmd?: string;
  href?: string;
};

const STEPS: Step[] = [
  {
    key: "fork",
    title: "Fork the starter repo",
    body: "Click Fork on the AI Catch Up starter on GitHub. Pick your account as the destination. This becomes your project repo.",
    href: "https://github.com/tennysonmilesperhour/ai-catch-up-starter/fork",
  },
  {
    key: "clone",
    title: "Clone it locally",
    body: "Replace the URL with your fork. The starter expects to live in a folder named the same as your project.",
    cmd: "git clone https://github.com/YOUR_HANDLE/ai-catch-up-starter.git my-project\ncd my-project",
  },
  {
    key: "env",
    title: "Paste your API keys into .env.local",
    body: "Copy .env.example to .env.local and fill in the keys for the accounts you wired up in Phase 02.",
    cmd: "cp .env.example .env.local\n$EDITOR .env.local",
  },
  {
    key: "install",
    title: "Install + run",
    body: "If you have npm installed, you'll be on localhost:3000 in under a minute.",
    cmd: "npm install\nnpm run dev",
  },
  {
    key: "deploy",
    title: "Deploy to Vercel",
    body: "Connect the repo via the Vercel dashboard, click Deploy, paste the same env vars. Production is live in ~2 minutes.",
    href: "https://vercel.com/new",
  },
];

function CopyCmd({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <pre className="run-preview flex-1" style={{ marginBottom: 0 }}>
        {cmd}
      </pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(cmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            /* ignore */
          }
        }}
        className="run-button-ghost"
        style={{ flexShrink: 0 }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function StarterPhase() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const state = readSetupState();
    const stored = state.phases.starter.data.done as
      | Record<string, boolean>
      | undefined;
    if (stored) setDone(stored);
  }, []);

  const toggle = (key: string) => {
    setDone((s) => {
      const next = { ...s, [key]: !s[key] };
      const allDone = STEPS.every((step) => next[step.key]);
      setPhaseStatus(
        "starter",
        allDone ? "done" : "in-progress",
        { done: next }
      );
      return next;
    });
  };

  const completed = STEPS.filter((s) => done[s.key]).length;

  return (
    <div className="setup-main">
      <header className="setup-phase-head">
        <SectionEyebrow>Phase 03 · 10 minutes</SectionEyebrow>
        <h1 className="setup-phase-title">
          Install the starter.{" "}
          <span className="headline-gradient">{completed}/{STEPS.length} steps.</span>
        </h1>
        <p className="setup-phase-lead">
          A pre-built repo with the Claude integration, env config, and
          deploy pipeline already wired up. Saves the 4-6 hours it normally
          takes to assemble these pieces from scratch.
        </p>
      </header>

      {STEPS.map((step, i) => (
        <article
          key={step.key}
          className={`glass-card setup-card ${done[step.key] ? "" : ""}`}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggle(step.key)}
              className={`setup-checkbox ${done[step.key] ? "is-done" : ""}`}
              aria-pressed={Boolean(done[step.key])}
            >
              ✓
            </button>
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] mr-2">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                {step.title}
              </h3>
              <p className="text-[var(--color-muted-dark)] leading-relaxed">
                {step.body}
              </p>
              {step.cmd && <CopyCmd cmd={step.cmd} />}
              {step.href && (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="setup-action-ghost self-start"
                >
                  Open in new tab →
                </a>
              )}
            </div>
          </div>
        </article>
      ))}

      <div className="setup-actions">
        <Link href="/setup/configure" className="glass-button-primary setup-action-primary">
          Continue to Phase 04 →
        </Link>
        <Link href="/setup/accounts" className="setup-action-ghost">
          ← Back to Phase 02
        </Link>
      </div>
    </div>
  );
}
