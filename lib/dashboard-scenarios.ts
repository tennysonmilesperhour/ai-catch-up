// Workspace Pulse demo scenarios. Each scenario is a self-contained dataset
// the dashboard reads from. The /preview/dashboard playground swaps between
// them live; the landing page renders BASELINE silently. In v1.1+ each
// buyer's view is its own (live, not curated) scenario fed by connectors.

export type Wave = {
  name: string;
  unit: string;
  desc: string;
  ampBase: number;
  ampVar: number;
  freq1: number;
  freq2: number;
  phase: number;
  yBase: number;
  drift: number;
  color: string;
  op: number;
};

export type PatternSignal = {
  label: string;
  value: string;
  note: string;
};

export type ActivityKind = "edit" | "use" | "log" | "sync";
export type ActivityRow = {
  kind: ActivityKind;
  label: string;
  detail: string;
  when: string;
};

export type RailRow = {
  id: string;
  num: string;
  title: string;
  meta: string;
  badge?: string;
  badgeDot?: boolean;
};

export type Scenario = {
  id: string;
  label: string;
  desc: string;
  waves: Wave[];
  patternSignals: PatternSignal[];
  activeAlerts: number;
  activity: ActivityRow[];
  railsPhases: RailRow[];
};

// Standard wave physics — we vary amplitude + yBase between scenarios so
// the chart shape changes visibly while frequencies stay readable. Colors
// always match the stream identity (Sessions cyan, Commits green, etc.)
// so the legend chips are stable across scenarios.
const STREAM_COLORS = ["#5fffd7", "#4ade80", "#ff5fb3", "#c084fc", "#fbbf24"];
const STREAM_OP = [0.85, 0.75, 0.7, 0.65, 0.55];
const STREAM_NAMES = ["Sessions", "Commits", "Prompts", "Decisions", "Hours saved"];
const STREAM_UNITS = ["/wk", "/wk", "/wk", "/mo", "/wk"];
const STREAM_DESCS = [
  "Claude Code sessions per week",
  "Repo commits across your projects",
  "Prompts run from your library",
  "Entries added to your decisions log",
  "Estimated hours saved vs baseline",
];

function makeWaves(
  amps: [number, number][],
  yBases: number[],
  freq1: number[],
  freq2: number[],
  phase: number[],
  drift: number[]
): Wave[] {
  return STREAM_NAMES.map((name, i) => ({
    name,
    unit: STREAM_UNITS[i],
    desc: STREAM_DESCS[i],
    ampBase: amps[i][0],
    ampVar: amps[i][1],
    freq1: freq1[i],
    freq2: freq2[i],
    phase: phase[i],
    yBase: yBases[i],
    drift: drift[i],
    color: STREAM_COLORS[i],
    op: STREAM_OP[i],
  }));
}

const FREQ1 = [0.0042, 0.0038, 0.0055, 0.0029, 0.0072];
const FREQ2 = [0.0018, 0.0021, 0.0014, 0.0026, 0.0011];
const PHASE = [0.6, 1.4, 2.1, 3.0, 4.5];
const DRIFT = [0.00012, 0.00009, 0.00015, 0.00007, 0.00018];

// "Solo founder · week 1" — early state. Low amplitudes (low traffic),
// high yBases (curves sit low on the chart). Drift signal high since
// the buyer is still configuring; plateau hasn't formed yet.
export const SCENARIO_QUIET: Scenario = {
  id: "quiet",
  label: "Solo founder · week 1",
  desc: "Just past the 60-minute setup. Low traffic, drift while patterns are still forming.",
  waves: makeWaves(
    [[8, 3], [10, 4], [6, 2], [12, 4], [5, 2]],
    [150, 165, 180, 195, 205],
    FREQ1, FREQ2, PHASE, DRIFT
  ),
  patternSignals: [
    { label: "Stuck patterns",  value: "0",   note: "library still loading" },
    { label: "Drift detected",  value: "34%", note: "sessions asked context" },
    { label: "Plateau risk",    value: "—",   note: "not enough data yet" },
  ],
  activeAlerts: 6,
  activity: [
    { kind: "edit", label: "claude.md created",      detail: "first spec",       when: "11:02" },
    { kind: "sync", label: "github linked",          detail: "tennys/quickdraft", when: "11:18" },
    { kind: "use",  label: "prompt P03 used",        detail: "starter scaffold", when: "13:44" },
    { kind: "log",  label: "decision #1 logged",     detail: "lock stack",       when: "14:21" },
  ],
  railsPhases: [
    { id: "P1", num: "01", title: "Capture",     meta: "Brief · 5 min",     badgeDot: true },
    { id: "P2", num: "02", title: "Accounts",    meta: "Wire-up · 15 min",  badge: "5" },
    { id: "P3", num: "03", title: "Starter pkg", meta: "Install · 10 min",  badge: "2" },
    { id: "P4", num: "04", title: "Configure",   meta: "Claude · 20 min",   badge: "1" },
    { id: "P5", num: "05", title: "Outputs",     meta: "Deliver · 10 min" },
  ],
};

// "Operator · month 3" — established baseline. Mid-tempo across all
// streams, real signals starting to surface, activity feed shows the
// kinds of edits a settled customer makes.
export const SCENARIO_BASELINE: Scenario = {
  id: "baseline",
  label: "Operator · month 3",
  desc: "Established. Sessions and commits steady, decisions piling up, first stuck patterns surfacing.",
  waves: makeWaves(
    [[18, 6], [22, 8], [14, 5], [28, 9], [12, 4]],
    [90, 115, 140, 160, 180],
    FREQ1, FREQ2, PHASE, DRIFT
  ),
  patternSignals: [
    { label: "Stuck patterns",  value: "3",     note: "prompts unused 30+ days" },
    { label: "Drift detected",  value: "12%",   note: "sessions asked context" },
    { label: "Plateau risk",    value: "2 wk",  note: "no new prompt added" },
  ],
  activeAlerts: 4,
  activity: [
    { kind: "edit", label: "claude.md updated",      detail: "spec",             when: "13:43" },
    { kind: "use",  label: "prompt P14 used",        detail: "weekly recap",     when: "13:51" },
    { kind: "log",  label: "decision #28 logged",    detail: "lock pricing",     when: "11:22" },
    { kind: "sync", label: "nexus map +1 tool",      detail: "1Password",        when: "09:51" },
  ],
  railsPhases: [
    { id: "P1", num: "01", title: "Capture",     meta: "Brief · 5 min",     badgeDot: true },
    { id: "P2", num: "02", title: "Accounts",    meta: "Wire-up · 15 min",  badge: "5" },
    { id: "P3", num: "03", title: "Starter pkg", meta: "Install · 10 min",  badge: "4" },
    { id: "P4", num: "04", title: "Configure",   meta: "Claude · 20 min",   badge: "12" },
    { id: "P5", num: "05", title: "Outputs",     meta: "Deliver · 10 min",  badge: "4" },
  ],
};

// "Power user · year 1" — high tempo, mature library. Higher amplitudes
// (more action), lower yBases (curves run high). Stuck patterns appear
// because the library is so big, plateau risk is real, hours saved peaks.
export const SCENARIO_HEAVY: Scenario = {
  id: "heavy",
  label: "Power user · year 1",
  desc: "Heavy run. Library mature, decisions cadence weekly, stuck patterns emerging from depth.",
  waves: makeWaves(
    [[28, 10], [34, 12], [24, 9], [40, 14], [22, 8]],
    [55, 78, 105, 128, 150],
    FREQ1, FREQ2, PHASE, DRIFT
  ),
  patternSignals: [
    { label: "Stuck patterns",  value: "11",    note: "prompts unused 60+ days" },
    { label: "Drift detected",  value: "4%",    note: "sessions asked context" },
    { label: "Plateau risk",    value: "high",  note: "5 wk no new prompt" },
  ],
  activeAlerts: 9,
  activity: [
    { kind: "use",  label: "prompt P19 used",       detail: "investor update",  when: "09:14" },
    { kind: "log",  label: "decision #94 logged",   detail: "deprecate v0 api", when: "10:38" },
    { kind: "edit", label: "claude.md updated",     detail: "ops conventions",  when: "11:55" },
    { kind: "sync", label: "nexus map +1 tool",     detail: "Linear",           when: "14:02" },
  ],
  railsPhases: [
    { id: "P1", num: "01", title: "Capture",     meta: "Brief · 5 min",     badge: "8" },
    { id: "P2", num: "02", title: "Accounts",    meta: "Wire-up · 15 min",  badge: "12" },
    { id: "P3", num: "03", title: "Starter pkg", meta: "Install · 10 min",  badge: "9" },
    { id: "P4", num: "04", title: "Configure",   meta: "Claude · 20 min",   badge: "31", badgeDot: true },
    { id: "P5", num: "05", title: "Outputs",     meta: "Deliver · 10 min",  badge: "16" },
  ],
};

export const SCENARIOS: Scenario[] = [SCENARIO_QUIET, SCENARIO_BASELINE, SCENARIO_HEAVY];
