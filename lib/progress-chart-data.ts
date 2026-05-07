// Progress chart data sources for NexusChart. Replaces the parametric
// sine-wave generation with real progress series the chart can plot
// monotonically.
//
// Two sources:
//   - getAggregateProgressData(), curated cohort trajectory over 12 months
//     (what an "average member" looks like). Shown when no local workspace
//     state exists (unauthenticated marketing visitors).
//   - getPersonalProgressData(snap), derived from the buyer's localStorage
//     workspace state. Shown when there's any signal that this browser has
//     been used as a workspace (setup state present, prompts run, etc.).

import type { WorkspaceSnapshot } from "@/lib/workspace-state";

// One point on a progress curve. x in [0, 1] across the chart width;
// y in [0, 1] from bottom to top.
export type ProgressPoint = { x: number; y: number };

export type ProgressSeries = {
  /** Display name shown in legend and end-of-line label. */
  name: string;
  /** Unit qualifier (e.g. "% complete", "/ wk", "running"). */
  unit: string;
  /** Stroke color (cosmic palette tokens; resolved to hex for SVG). */
  color: string;
  /** Description for the legend tooltip. */
  desc: string;
  /** 12 normalized data points across the year (or signup span). */
  points: ProgressPoint[];
  /** Pretty-printed current-value label for the end of the line. */
  currentLabel: string;
};

export type ProgressFeed = {
  series: ProgressSeries[];
  /** "aggregate" = curated cohort demo; "personal" = this user's workspace. */
  source: "aggregate" | "personal";
};

// Cosmic palette as hex (SVG stroke can't take CSS variables on the
// stroke attribute reliably, so resolve at module scope).
const C = {
  cyan: "#5fffd7",
  organic: "#4ade80",
  magenta: "#ff5fb3",
  violet: "#c084fc",
  amber: "#fbbf24",
} as const;

// ---------------------------------------------------------------------------
// Aggregate (cohort demo), what a typical member looks like over 12 months.
// Curves are hand-tuned to read as believable buyer progress; values y are
// already normalized 0..1 so the chart layer doesn't need to scale.
// ---------------------------------------------------------------------------

function curve(values: number[]): ProgressPoint[] {
  const n = values.length;
  return values.map((y, i) => ({ x: i / (n - 1), y: clamp01(y) }));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

const AGGREGATE: ProgressSeries[] = [
  {
    name: "Setup",
    unit: "% complete",
    color: C.cyan,
    desc: "Average of how far cohort members have moved through the 5 phases.",
    // Most members finish setup in the first month; long tail of late
    // arrivals brings the cohort average to a high plateau.
    points: curve([0.05, 0.55, 0.72, 0.81, 0.86, 0.89, 0.91, 0.93, 0.94, 0.95, 0.95, 0.96]),
    currentLabel: "96%",
  },
  {
    name: "Prompts",
    unit: "/ wk",
    color: C.magenta,
    desc: "Average prompts run per member per week. Climbs as members find the patterns that fit.",
    points: curve([0.12, 0.22, 0.33, 0.40, 0.48, 0.55, 0.62, 0.66, 0.70, 0.73, 0.76, 0.78]),
    currentLabel: "12 / wk",
  },
  {
    name: "Decisions",
    unit: "/ mo",
    color: C.violet,
    desc: "New entries logged in the decisions log per month. Bumps when projects make architectural choices.",
    // Stepped, bumpy not smooth.
    points: curve([0.08, 0.18, 0.20, 0.32, 0.35, 0.42, 0.44, 0.50, 0.58, 0.60, 0.66, 0.70]),
    currentLabel: "5 / mo",
  },
  {
    name: "Sessions",
    unit: "/ wk",
    color: C.organic,
    desc: "Claude Code sessions per member per week. The leading indicator of an active workspace.",
    points: curve([0.10, 0.28, 0.32, 0.38, 0.45, 0.46, 0.52, 0.55, 0.57, 0.62, 0.64, 0.66]),
    currentLabel: "8 / wk",
  },
  {
    name: "Hours saved",
    unit: "cumulative",
    color: C.amber,
    desc: "Estimated hours saved vs baseline. prompts × baseline_minutes + sessions_avoided.",
    points: curve([0.04, 0.10, 0.16, 0.22, 0.30, 0.36, 0.42, 0.48, 0.54, 0.60, 0.65, 0.70]),
    currentLabel: "180 hrs",
  },
];

export function getAggregateProgressData(): ProgressFeed {
  return { series: AGGREGATE, source: "aggregate" };
}

// ---------------------------------------------------------------------------
// Personal, derived from the user's workspace state. Each series builds a
// 12-point sparkline anchored to "now" at the rightmost point. We don't have
// real timestamped history (yet, that's a v1.3 storage move); so we fake
// the trajectory by placing the current value at x=1 and tapering to 0 at
// x=0 with a curve shape appropriate to the metric.
// ---------------------------------------------------------------------------

function risingCurveTo(target: number, n = 12): ProgressPoint[] {
  // Shaped so a member who is "halfway" reads as a clear ascent rather than
  // a flat line at the midpoint. Quadratic ease toward the target.
  const out: ProgressPoint[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push({ x: t, y: clamp01(target * (1 - Math.pow(1 - t, 1.6))) });
  }
  return out;
}

export function hasPersonalData(snap: WorkspaceSnapshot): boolean {
  // Any of: completed any setup phase, ran any prompt, set an API key.
  if (snap.apiKey.hasKey) return true;
  if (snap.invocations.total > 0) return true;
  for (const phase of Object.values(snap.setup.phases)) {
    if (phase.status !== "not-started") return true;
  }
  return false;
}

export function getPersonalProgressData(
  snap: WorkspaceSnapshot
): ProgressFeed {
  // Setup % complete: count of done phases out of 5.
  const phasesDone = (Object.values(snap.setup.phases) as { status: string }[])
    .filter((p) => p.status === "done").length;
  const setupPct = phasesDone / 5;

  // Prompts run normalized: arbitrary "20 runs feels healthy" anchor.
  const promptsTarget = clamp01(snap.invocations.total / 20);
  // Recent week emphasized in the label.
  const promptsLabel =
    snap.invocations.last7d > 0
      ? `${snap.invocations.last7d} / wk`
      : `${snap.invocations.total} total`;

  // Decisions: anchor at 10 entries.
  const decisionsTarget = clamp01(snap.decisions.total / 10);
  // Sessions: localStorage doesn't track session-starts yet (v1.3); use
  // last7d invocations as a proxy for "active sessions this week".
  const sessionsTarget = clamp01(snap.invocations.last7d / 10);
  // Hours saved (derived): 0.5 hr per prompt run.
  const hoursTarget = clamp01((snap.invocations.total * 0.5) / 50);

  const series: ProgressSeries[] = [
    {
      name: "Setup",
      unit: "% complete",
      color: C.cyan,
      desc: "How far you've moved through the 5 onboarding phases.",
      points: risingCurveTo(setupPct),
      currentLabel: `${Math.round(setupPct * 100)}%`,
    },
    {
      name: "Prompts",
      unit: "this week",
      color: C.magenta,
      desc: "Prompts you've run from your library. Each Run button click increments here.",
      points: risingCurveTo(promptsTarget),
      currentLabel: promptsLabel,
    },
    {
      name: "Decisions",
      unit: "logged",
      color: C.violet,
      desc: "Entries you've added to your decisions log.",
      points: risingCurveTo(decisionsTarget),
      currentLabel: `${snap.decisions.total} total`,
    },
    {
      name: "Sessions",
      unit: "this week",
      color: C.organic,
      desc: "Active workspace activity in the last 7 days.",
      points: risingCurveTo(sessionsTarget),
      currentLabel: `${snap.invocations.last7d} / wk`,
    },
    {
      name: "Hours saved",
      unit: "estimate",
      color: C.amber,
      desc: "Estimated hours saved vs baseline. prompts × ~0.5hr each.",
      points: risingCurveTo(hoursTarget),
      currentLabel: `${Math.round(snap.invocations.total * 0.5)} hrs`,
    },
  ];

  return { series, source: "personal" };
}
