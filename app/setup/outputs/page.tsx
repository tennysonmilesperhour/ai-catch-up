"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { readSetupState, setPhaseStatus, resetSetup } from "@/lib/setup-state";

type ArtifactState = {
  spec: string | null;
  claudeMd: string | null;
};

export default function OutputsPhase() {
  const [artifacts, setArtifacts] = useState<ArtifactState>({
    spec: null,
    claudeMd: null,
  });

  useEffect(() => {
    const state = readSetupState();
    setArtifacts({
      spec: (state.phases.capture.data.spec as string | undefined) ?? null,
      claudeMd:
        (state.phases.configure.data.claudeMd as string | undefined) ?? null,
    });
  }, []);

  const markDone = () => {
    setPhaseStatus("outputs", "done", { completedAt: Date.now() });
  };

  const onConfirmReset = () => {
    if (
      window.confirm(
        "Reset setup progress? Your spec and CLAUDE.md will be cleared from this browser."
      )
    ) {
      resetSetup();
      window.location.href = "/setup";
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="setup-main">
      <header className="setup-phase-head">
        <SectionEyebrow>Phase 05 · 10 minutes</SectionEyebrow>
        <h1 className="setup-phase-title">
          Receive your outputs.{" "}
          <span className="headline-gradient">Yours forever.</span>
        </h1>
        <p className="setup-phase-lead">
          Four artifacts, ready to leave the workspace with you. Download
          what you want as files, or open the live versions in your admin
          tabs. They keep updating as you work.
        </p>
      </header>

      <article className="glass-card setup-card">
        <h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)] mr-2">
            MD
          </span>
          Project spec
        </h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          The clean one-page spec from your Phase 01 interview. Drop it
          into your project as <code className="text-[var(--color-cyan)] font-mono">SPEC.md</code>{" "}
          or use it as the basis for any pitch document.
        </p>
        <div className="setup-actions">
          {artifacts.spec ? (
            <button
              type="button"
              onClick={() => downloadFile("SPEC.md", artifacts.spec ?? "")}
              className="glass-button-primary setup-action-primary"
            >
              Download SPEC.md
            </button>
          ) : (
            <Link href="/setup/capture" className="setup-action-ghost">
              ← Run Phase 01 to capture
            </Link>
          )}
        </div>
      </article>

      <article className="glass-card setup-card">
        <h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-violet)] mr-2">
            CM
          </span>
          CLAUDE.md
        </h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          The persistent context file. Drop it at the root of your starter
          repo so every future Claude Code session reads it on startup.
        </p>
        <div className="setup-actions">
          {artifacts.claudeMd ? (
            <button
              type="button"
              onClick={() =>
                downloadFile("CLAUDE.md", artifacts.claudeMd ?? "")
              }
              className="glass-button-primary setup-action-primary"
            >
              Download CLAUDE.md
            </button>
          ) : (
            <Link href="/setup/configure" className="setup-action-ghost">
              ← Run Phase 04 to generate
            </Link>
          )}
        </div>
      </article>

      <article className="glass-card setup-card">
        <h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-magenta)] mr-2">
            PL
          </span>
          Prompt library
        </h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          20 prompts across 9 categories, each with a Run button and a "why
          it works" note. Lives in your admin Prompts tab and stays in sync
          with library updates.
        </p>
        <div className="setup-actions">
          <Link href="/admin/prompts" className="glass-button-primary setup-action-primary">
            Open prompt library →
          </Link>
        </div>
      </article>

      <article className="glass-card setup-card">
        <h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-organic)] mr-2">
            CG
          </span>
          Coding guide
        </h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          The Plan-First, Act-Second workflow that makes everything else
          stick. Short, opinionated, re-readable. Read once before you
          ship anything new.
        </p>
        <div className="setup-actions">
          <Link href="/admin/coding-guide" className="glass-button-primary setup-action-primary">
            Open coding guide →
          </Link>
        </div>
      </article>

      <article className="glass-card setup-card">
        <h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-terracotta)] mr-2">
            NX
          </span>
          Live Nexus map
        </h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          The visual graph of your tools and repos. Auto-syncs from GitHub
          when{" "}
          <code className="text-[var(--color-cyan)] font-mono">GITHUB_USERNAME</code>{" "}
          is set. New repos appear within 15 minutes.
        </p>
        <div className="setup-actions">
          <Link href="/admin/nexus" className="glass-button-primary setup-action-primary">
            Open Nexus map →
          </Link>
        </div>
      </article>

      <article className="glass-card-static setup-card">
        <h3>You're done</h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          Mark this phase complete to flip the workspace from setup mode
          to running mode. Your dashboard stays warm; come back any time to
          re-run prompts, log decisions, or refresh your CLAUDE.md.
        </p>
        <div className="setup-actions">
          <button
            type="button"
            onClick={markDone}
            className="glass-button-primary setup-action-primary"
          >
            Mark setup complete →
          </button>
          <Link href="/admin" className="setup-action-ghost">
            Go to workspace →
          </Link>
          <button
            type="button"
            onClick={onConfirmReset}
            className="setup-action-ghost"
            style={{ borderColor: "rgba(255, 95, 179, 0.30)", color: "var(--color-magenta)" }}
          >
            Reset setup
          </button>
        </div>
      </article>
    </div>
  );
}
