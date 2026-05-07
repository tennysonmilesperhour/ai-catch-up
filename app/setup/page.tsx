import Link from "next/link";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

export const metadata = {
  title: "Setup · Welcome",
  description:
    "The 60-minute AI Catch Up onboarding. Five phases: accounts, capture, configure, starter prompts, outputs. Start here.",
  alternates: { canonical: "/setup" },
};

export default function SetupIntroPage() {
  return (
    <div className="setup-main">
      <header className="setup-phase-head">
        <SectionEyebrow>The 60 minutes</SectionEyebrow>
        <h1 className="setup-phase-title">
          Welcome. Let's build your{" "}
          <span className="headline-gradient">workspace.</span>
        </h1>
        <p className="setup-phase-lead">
          Five phases, top to bottom. Each phase ends with a working artifact
          in your workspace: a project spec, account wiring, a deployed
          starter, your tuned CLAUDE.md, and the four outputs you keep
          forever. You can pause and pick up later — your progress is saved
          locally to this browser.
        </p>
      </header>

      <article className="glass-card setup-card">
        <h3>Before you start</h3>
        <ul className="flex flex-col gap-2 text-[var(--color-muted-dark)] leading-relaxed">
          <li>
            ⌬ <strong className="text-[var(--color-dark)]">An Anthropic API key.</strong>{" "}
            Free tier works for the setup. Add it in{" "}
            <Link href="/admin/settings" className="text-[var(--color-cyan)] underline-offset-2 hover:underline">
              Settings
            </Link>
            ; we never see it.
          </li>
          <li>
            ⊞ <strong className="text-[var(--color-dark)]">A GitHub account.</strong>{" "}
            You'll fork a starter repo in Phase 3. Free.
          </li>
          <li>
            ⤳ <strong className="text-[var(--color-dark)]">Sixty minutes.</strong>{" "}
            One sitting is best. If you have to break it up, the rail on
            the left will show you where you left off.
          </li>
        </ul>
        <div className="setup-actions">
          <Link href="/setup/capture" className="glass-button-primary setup-action-primary">
            Begin Phase 01 →
          </Link>
          <Link href="/admin/settings" className="setup-action-ghost">
            Add API key first
          </Link>
        </div>
      </article>

      <article className="glass-card-static setup-card">
        <h3>Read this first (5 minutes)</h3>
        <p className="text-[var(--color-muted-dark)] leading-relaxed">
          The coding guide explains the Plan-First, Act-Second workflow that
          makes everything else stick. It's short, opinionated, and the
          single highest-leverage thing to read before Phase 01.
        </p>
        <div className="setup-actions">
          <Link href="/admin/coding-guide" className="setup-action-ghost">
            Open coding guide →
          </Link>
        </div>
      </article>

      <article className="glass-card-static setup-card">
        <h3>What you'll have at minute 60</h3>
        <ul className="flex flex-col gap-2 text-[var(--color-muted-dark)] leading-relaxed">
          <li>
            <strong className="text-[var(--color-dark)]">CLAUDE.md</strong>{" "}
            tuned to your project, voice, and conventions.
          </li>
          <li>
            <strong className="text-[var(--color-dark)]">A live Nexus map</strong>{" "}
            of every tool you connected, auto-syncing from GitHub.
          </li>
          <li>
            <strong className="text-[var(--color-dark)]">A 20-prompt library</strong>{" "}
            with a Run button next to every entry.
          </li>
          <li>
            <strong className="text-[var(--color-dark)]">A next-three-moves memo</strong>{" "}
            you can revisit any time.
          </li>
        </ul>
      </article>
    </div>
  );
}
