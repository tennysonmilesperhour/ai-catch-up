"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { RunPrompt, HEAVY_MODEL } from "@/components/shared/RunPrompt";
import { readSetupState, setPhaseStatus } from "@/lib/setup-state";

const CONFIGURE_PROMPT = `You are configuring a Claude Code project for a solo entrepreneur.

Their project spec (captured in Phase 01):
{{spec}}

Their tone preference: {{tone}}

Generate a complete CLAUDE.md they can drop at the root of their starter repo. The file should:

1. Lead with a short "Project" section paraphrasing the spec.
2. List the tech stack with one-line reasons each.
3. Include a "Conventions" section: 4-6 rules (file naming, state management, deploy target, prompt patterns).
4. Include a "Known gotchas" section with at least 2 entries from the spec.
5. Include a "What NOT to do" section with 3 anti-patterns specific to this project.
6. End with a "Current focus" line.
7. Use the requested tone throughout (warm/candid/sober/clinical, etc).
8. Be concise, under 80 lines.

Output as one fenced markdown block. No preamble, no closing remarks. Just the file.`;

export default function ConfigurePhase() {
  const [spec, setSpec] = useState<string>("");
  const [claudeMd, setClaudeMd] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const state = readSetupState();
    const captured = state.phases.capture.data.spec as string | undefined;
    if (captured) setSpec(captured);
    const generated = state.phases.configure.data.claudeMd as string | undefined;
    const ts = state.phases.configure.data.savedAt as number | undefined;
    if (generated) setClaudeMd(generated);
    if (ts) setSavedAt(ts);
  }, []);

  const onResult = (text: string) => {
    setClaudeMd(text);
    const ts = Date.now();
    setSavedAt(ts);
    setPhaseStatus("configure", "in-progress", { claudeMd: text, savedAt: ts });
  };

  const markDone = () => {
    setPhaseStatus("configure", "done", {
      claudeMd,
      savedAt: savedAt ?? Date.now(),
    });
  };

  const onCopy = async () => {
    if (!claudeMd) return;
    try {
      await navigator.clipboard.writeText(claudeMd);
    } catch {
      /* ignore */
    }
  };

  // Pre-fill the spec variable so the user only needs to fill in tone.
  const promptWithSpec = spec
    ? CONFIGURE_PROMPT.replace("{{spec}}", spec)
    : CONFIGURE_PROMPT;

  return (
    <div className="setup-main">
      <header className="setup-phase-head">
        <SectionEyebrow>Phase 04 · 20 minutes</SectionEyebrow>
        <h1 className="setup-phase-title">
          Configure Claude.{" "}
          <span className="headline-gradient">Generate your CLAUDE.md.</span>
        </h1>
        <p className="setup-phase-lead">
          Claude reads your Phase 01 spec, asks for a tone preference, and
          writes the persistent context file every future Claude Code
          session will read at startup. This is the single highest-leverage
          file in your workspace.
        </p>
      </header>

      {!spec ? (
        <article className="glass-card-static setup-card">
          <h3>Phase 01 spec missing</h3>
          <p className="text-[var(--color-muted-dark)] leading-relaxed">
            Configure needs the project spec from Phase 01 to write a
            useful CLAUDE.md. Run the capture interview first, save the
            result, and come back.
          </p>
          <div className="setup-actions">
            <Link href="/setup/capture" className="glass-button-primary setup-action-primary">
              ← Run Phase 01 first
            </Link>
          </div>
        </article>
      ) : (
        <article className="glass-card setup-card">
          <h3>Generate CLAUDE.md</h3>
          <p className="text-[var(--color-muted-dark)] leading-relaxed">
            Uses the heavier reasoner (Opus 4.7) since this file does a
            lot of work. Your spec is pre-loaded; the only variable to
            fill is{" "}
            <code className="text-[var(--color-cyan)] font-mono">tone</code>
            .
          </p>
          <div className="setup-actions">
            <RunPrompt
              prompt={promptWithSpec}
              title="Generate CLAUDE.md · Phase 04"
              model={HEAVY_MODEL}
              onResult={onResult}
            >
              {(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="glass-button-primary setup-action-primary"
                >
                  Generate CLAUDE.md →
                </button>
              )}
            </RunPrompt>
          </div>
        </article>
      )}

      {claudeMd && (
        <article className="glass-card-static setup-card">
          <h3>Your CLAUDE.md</h3>
          <p className="text-[var(--color-muted)] font-mono text-[10px] uppercase tracking-[0.14em]">
            Generated{" "}
            {savedAt
              ? new Date(savedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "just now"}{" "}
            · drop at the root of your starter repo
          </p>
          <pre className="run-result" style={{ maxHeight: "400px" }}>
            {claudeMd}
          </pre>
          <div className="setup-actions">
            <button type="button" onClick={onCopy} className="setup-action-ghost">
              Copy CLAUDE.md
            </button>
          </div>
        </article>
      )}

      <div className="setup-actions">
        <button
          type="button"
          onClick={markDone}
          disabled={!claudeMd}
          className="glass-button-primary setup-action-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark Phase 04 complete →
        </button>
        <Link href="/setup/outputs" className="setup-action-ghost">
          Skip to Phase 05 →
        </Link>
      </div>
    </div>
  );
}
