// Workspace heuristics. Pure functions over a WorkspaceSnapshot that
// emit pattern signals + suggested next moves. The /admin/pulse page
// uses these to drive the dynamic checklist and the suggested-moves
// panel; the marketing dashboard demo uses curated SCENARIOS instead.

import type { WorkspaceSnapshot } from "@/lib/workspace-state";
import type { PhaseId } from "@/lib/setup-state";

export type Severity = "info" | "warn" | "alert";

export type Suggestion = {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  /** Optional CTA: route to navigate to, or "run-prompt:<id>" to open RunPrompt. */
  action?: { label: string; href: string };
};

export type PatternSignal = {
  id: "stuck" | "drift" | "plateau" | "idle" | "fresh";
  label: string;
  value: string;
  note: string;
  severity: Severity;
};

const D1 = 24 * 60 * 60 * 1000;
const D7 = 7 * D1;
const D14 = 14 * D1;
const D30 = 30 * D1;

// ---------------------------------------------------------------------------
// Pattern signals (what's the workspace doing right now?)
// ---------------------------------------------------------------------------

export function computeSignals(snap: WorkspaceSnapshot): PatternSignal[] {
  const signals: PatternSignal[] = [];
  const now = snap.generatedAt;
  const usage = snap.invocations.usage;

  // Stuck patterns: prompts used 3+ times historically but not in 30 days.
  let stuck = 0;
  for (const u of Object.values(usage)) {
    if (u.count >= 3 && now - u.lastAt > D30) stuck += 1;
  }
  signals.push({
    id: "stuck",
    label: "Stuck patterns",
    value: String(stuck),
    note: stuck === 0 ? "library churn looks healthy" : "prompts unused 30+ days",
    severity: stuck >= 3 ? "warn" : "info",
  });

  // Drift: setup done but no recent invocations (suggests CLAUDE.md may be
  // stale because the workspace isn't being actively poked).
  const setupDone = snap.setup.currentPhase === "done";
  const lastInv = snap.invocations.lastAt;
  const driftDays =
    setupDone && lastInv != null
      ? Math.round((now - lastInv) / D1)
      : 0;
  const drift = setupDone && lastInv != null && now - lastInv > D14;
  signals.push({
    id: "drift",
    label: "Drift detected",
    value: drift ? `${driftDays}d` : setupDone ? "0%" : "-",
    note: drift
      ? "no runs since CLAUDE.md was last touched"
      : setupDone
        ? "sessions tracking the spec"
        : "setup not complete yet",
    severity: drift ? "warn" : "info",
  });

  // Plateau risk: weeks since last invocation against any prompt.
  const plateauWeeks =
    lastInv != null ? Math.floor((now - lastInv) / D7) : 0;
  signals.push({
    id: "plateau",
    label: "Plateau risk",
    value:
      lastInv == null
        ? "-"
        : plateauWeeks <= 1
          ? "low"
          : `${plateauWeeks} wk`,
    note:
      lastInv == null
        ? "no runs yet"
        : plateauWeeks <= 1
          ? "regular activity"
          : "no new prompt run in over a week",
    severity: plateauWeeks >= 3 ? "alert" : plateauWeeks >= 2 ? "warn" : "info",
  });

  return signals;
}

// ---------------------------------------------------------------------------
// Suggested moves (what should the buyer do next?)
// ---------------------------------------------------------------------------

export function computeSuggestions(snap: WorkspaceSnapshot): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const now = snap.generatedAt;

  // 1. No API key → highest priority.
  if (!snap.apiKey.hasKey) {
    suggestions.push({
      id: "add-api-key",
      severity: "alert",
      title: "Add your Anthropic API key",
      body:
        "The Run buttons across the workspace need a key to fire. Paste it once in Settings; we never see it.",
      action: { label: "Open Settings", href: "/admin/settings" },
    });
  }

  // 2. Setup not complete → continue where they left off.
  if (snap.setup.currentPhase !== "done") {
    const phase = snap.setup.currentPhase as PhaseId;
    suggestions.push({
      id: "continue-setup",
      severity: "warn",
      title: `Continue Phase ${phaseLabel(phase)} of setup`,
      body:
        "You're not at minute 60 yet. Pick up where you left off, your progress is saved.",
      action: { label: "Open setup", href: `/setup/${phase}` },
    });
  }

  // 3. Setup done + zero invocations → first-run nudge.
  if (snap.setup.currentPhase === "done" && snap.invocations.total === 0) {
    suggestions.push({
      id: "first-run",
      severity: "warn",
      title: "Run your first library prompt",
      body:
        "Setup is complete but the prompt library hasn't been touched. Pick any one and click Run, it's the muscle that compounds.",
      action: { label: "Open prompt library", href: "/admin/prompts" },
    });
  }

  // 4. Drift: setup done, last run > 14 days ago.
  if (
    snap.setup.currentPhase === "done" &&
    snap.invocations.lastAt &&
    now - snap.invocations.lastAt > D14
  ) {
    const days = Math.round((now - snap.invocations.lastAt) / D1);
    suggestions.push({
      id: "drift-recovery",
      severity: "warn",
      title: `${days} days since your last prompt run`,
      body:
        "Either CLAUDE.md is doing such a good job you don't need the library, or the library doesn't fit the new shape of your project. Spend five minutes on a weekly review.",
      action: { label: "Open prompt library", href: "/admin/prompts" },
    });
  }

  // 5. CLAUDE.md aged: configure phase done > 30 days ago.
  const configuredAt = snap.setup.phases.configure.data.savedAt as
    | number
    | undefined;
  if (configuredAt && now - configuredAt > D30) {
    suggestions.push({
      id: "claude-md-aged",
      severity: "info",
      title: "Regenerate CLAUDE.md",
      body:
        "Your spec is over a month old. Project conventions usually drift in 30 days; a 5-minute regenerate keeps Claude aligned.",
      action: { label: "Re-run Phase 04", href: "/setup/configure" },
    });
  }

  // 6. Healthy state → suggest the monthly memo.
  if (
    snap.setup.currentPhase === "done" &&
    snap.invocations.last30d > 0 &&
    suggestions.length === 0
  ) {
    suggestions.push({
      id: "monthly-memo",
      severity: "info",
      title: "Distill the month into a memo",
      body:
        "Workspace is humming. Run the monthly memo prompt to compress the last 30 days into a next-three-moves note.",
      action: { label: "Open memo generator", href: "/admin/memo" },
    });
  }

  return suggestions.slice(0, 5);
}

function phaseLabel(id: PhaseId): string {
  switch (id) {
    case "capture":   return "01 (Capture)";
    case "accounts":  return "02 (Accounts)";
    case "starter":   return "03 (Starter)";
    case "configure": return "04 (Configure)";
    case "outputs":   return "05 (Outputs)";
  }
}
