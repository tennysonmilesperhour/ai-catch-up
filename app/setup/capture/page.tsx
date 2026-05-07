"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { RunPrompt } from "@/components/shared/RunPrompt";
import { readSetupState, setPhaseStatus } from "@/lib/setup-state";

const INTERVIEW_PROMPT = `You are an onboarding interviewer for a solo entrepreneur or small-team lead who is configuring an AI workspace.

Their rough idea: {{idea}}
Their current state: {{state}}

Conduct a 5-question interview to capture what they're building. The output should be a clean project spec ready to drop into CLAUDE.md, with these sections:

## Project
A one-sentence description of what this is and who it's for.

## Tech stack
Three to six tools they're using, one per line, with a short reason.

## Conventions
Three to five rules that should hold across the project (file naming, state management, deploy target, etc).

## Known gotchas
Two to four things they've already learned the hard way, or expect to.

## Current focus
The one thing they're working on right now.

Ask the questions one at a time, wait for answers between each. If a section needs information you don't have, ask. Be warm, brief, and concrete. End with the full spec rendered as a markdown code block they can copy.`;

export default function CapturePhase() {
  const [output, setOutput] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const state = readSetupState();
    const captured = state.phases.capture.data.spec as string | undefined;
    const ts = state.phases.capture.data.savedAt as number | undefined;
    if (captured) setOutput(captured);
    if (ts) setSavedAt(ts);
  }, []);

  const onSpec = (text: string) => {
    setOutput(text);
    const ts = Date.now();
    setSavedAt(ts);
    setPhaseStatus("capture", "in-progress", { spec: text, savedAt: ts });
  };

  const markDone = () => {
    setPhaseStatus("capture", "done", {
      spec: output,
      savedAt: savedAt ?? Date.now(),
    });
  };

  return (
    <div className="setup-main">
      <header className="setup-phase-head">
        <SectionEyebrow>Phase 01 · 5 minutes</SectionEyebrow>
        <h1 className="setup-phase-title">
          Capture your idea.{" "}
          <span className="headline-gradient">Claude interviews you.</span>
        </h1>
        <p className="setup-phase-lead">
          Five questions, one sitting. The output is a clean project spec
          ready for the rest of the setup. The interviewer prompt is below;
          click Run, fill the rough idea + current state slots, and Claude
          will walk you through the rest. Save the result, Phase 04 turns
          it into your CLAUDE.md.
        </p>
      </header>

      <article className="glass-card setup-card">
        <h3>The interviewer</h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          A scaffolded invocation. Claude asks one question at a time and
          ends with a copy-able markdown spec. The full prompt lives in
          your library; here it's pre-loaded so you can run it without
          leaving setup.
        </p>
        <div className="setup-actions">
          <RunPrompt
            prompt={INTERVIEW_PROMPT}
            title="Capture your idea · Phase 01"
            onResult={onSpec}
          >
            {(open) => (
              <button
                type="button"
                onClick={open}
                className="glass-button-primary setup-action-primary"
              >
                Run interview →
              </button>
            )}
          </RunPrompt>
          <Link href="/admin/settings" className="setup-action-ghost">
            Add API key
          </Link>
        </div>
      </article>

      {output && (
        <article className="glass-card-static setup-card">
          <h3>Saved spec</h3>
          <p className="text-[var(--color-muted)] font-mono text-[10px] uppercase tracking-[0.14em]">
            Captured{" "}
            {savedAt
              ? new Date(savedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "just now"}{" "}
            · auto-loaded into Phase 04
          </p>
          <pre className="run-result" style={{ maxHeight: "320px" }}>
            {output}
          </pre>
        </article>
      )}

      <div className="setup-actions">
        <button
          type="button"
          onClick={markDone}
          disabled={!output}
          className="glass-button-primary setup-action-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark Phase 01 complete →
        </button>
        <Link href="/setup/accounts" className="setup-action-ghost">
          Skip to Phase 02 →
        </Link>
      </div>
    </div>
  );
}
