"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import promptsData from "@/content/admin/prompts.json";
import decisionsData from "@/content/admin/decisions.json";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import {
  SCENARIO_BASELINE,
  type ActivityKind,
  type RailRow,
  type Scenario,
} from "@/lib/dashboard-scenarios";
import {
  getAggregateProgressData,
  getPersonalProgressData,
  hasPersonalData,
  type ProgressFeed,
  type ProgressSeries,
} from "@/lib/progress-chart-data";
import { readWorkspaceSnapshot } from "@/lib/workspace-state";

// Resolved at module init from prompts.json so the workspace rail-card
// "n prompts" label tracks Strategy Claude's actual library size.
type PromptShape = { id: number | string; category: string; title: string };
const PROMPTS_ARR: PromptShape[] = Array.isArray(promptsData)
  ? (promptsData as PromptShape[])
  : Array.isArray((promptsData as { prompts?: PromptShape[] }).prompts)
    ? ((promptsData as { prompts: PromptShape[] }).prompts)
    : [];
const PROMPT_COUNT = PROMPTS_ARR.length;

// ============================================================================
// Tab content data: clickable interactions across the dashboard.
// ============================================================================

type DashTab = "Overview" | "Tools" | "Prompts" | "Decisions";
const DASH_TABS: DashTab[] = ["Overview", "Tools", "Prompts", "Decisions"];

// Workspace rail-card hrefs. Clicking an artifact in the workspace rail
// jumps to the corresponding admin tab. Non-authed visitors get bounced
// to /login by middleware, which is fine — the click communicates "this
// is a real route, not chrome."
const WORKSPACE_HREF: Record<string, string> = {
  WS1: "/admin/claude-md",
  WS2: "/admin/nexus",
  WS3: "/admin/prompts",
};

// Activity-feed kind → admin tab href. The feed becomes a real
// navigational artifact instead of decoration.
const ACTIVITY_HREF: Record<ActivityKind, string> = {
  edit: "/admin/claude-md",
  use: "/admin/prompts",
  log: "/admin/decisions",
  sync: "/admin/nexus",
};

// Demo-tool list shown when the Tools tab is active. Marketing surface
// only; the post-purchase admin overview reads real connection state.
const DEMO_TOOLS: { name: string; detail: string; state: "ok" | "warn" }[] = [
  { name: "Anthropic", detail: "API connected",      state: "ok" },
  { name: "GitHub",    detail: "synced as you",      state: "ok" },
  { name: "Vercel",    detail: "deploy linked",      state: "ok" },
  { name: "Stripe",    detail: "payment ready",      state: "ok" },
  { name: "1Password", detail: "vault optional",     state: "warn" },
];

// Demo decisions shown when the Decisions tab is active. Curated to
// match the AI Catch Up narrative without exposing real customer data.
const DEMO_DECISIONS: { id: number; title: string; note: string }[] = [
  { id: 28, title: "Lock pricing at $49",                note: "no tiers" },
  { id: 27, title: "No subscription, lifetime access",   note: "one-time" },
  { id: 26, title: "Defer real-time sync to v1.1",       note: "v1.0 ships static" },
  { id: 25, title: `${PROMPT_COUNT}-prompt library, 9 categories`, note: "tone-tuned" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const NOW_MONTH = 3; // April (0-indexed)

// Workspace artifacts are stable across scenarios (the customer always
// gets these three deliverables), so they live here rather than in the
// scenario data.
const RAILS_WORKSPACE: RailRow[] = [
  { id: "WS1", num: "MD", title: "CLAUDE.md", meta: "spec" },
  { id: "WS2", num: "NX", title: "Nexus map", meta: "live graph" },
  { id: "WS3", num: "PL", title: "Prompt library", meta: `${PROMPT_COUNT} prompts` },
];

const KIND_COLOR: Record<ActivityKind, string> = {
  edit: "var(--color-cyan)",
  use:  "var(--color-magenta)",
  log:  "var(--color-violet)",
  sync: "var(--color-terracotta)",
};

// Decorative stream labels overlaid at fixed t=0 sample points; each
// renders its parent wave's display name (no longer the placeholder
// ST-983 / VYG1 codes).
const STREAM_LABELS = [
  { wave: 0, x: 220 },
  { wave: 1, x: 360 },
  { wave: 2, x: 540 },
  { wave: 3, x: 100 },
];

const CHART_W = 720;
const CHART_H = 220;
const CHART_PAD_R = 130; // reserve right gutter for end-of-line labels

/**
 * Convert a series of {x: 0..1, y: 0..1} points into a smooth Catmull-Rom
 * SVG path. y is flipped (1 = top of chart). Stable enough for 12-point
 * progress lines; smooth without going all bezier-spaghetti.
 */
function smoothPath(points: ProgressSeries["points"]): string {
  if (points.length === 0) return "";
  const pts = points.map((p) => ({
    x: p.x * (CHART_W - CHART_PAD_R),
    y: (1 - p.y) * (CHART_H - 24) + 12, // 12px top + bottom padding
  }));
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function endPoint(points: ProgressSeries["points"]) {
  const last = points[points.length - 1];
  return {
    x: last.x * (CHART_W - CHART_PAD_R),
    y: (1 - last.y) * (CHART_H - 24) + 12,
  };
}

/**
 * Progress chart: one SVG path per series + an end-of-line label with the
 * current value. Static curves (no per-frame compute), pulsing dots at
 * the rightmost point ("now") via CSS animation, gentle stroke-dash
 * reveal on first mount.
 */
function NexusChart({ feed }: { feed: ProgressFeed }) {
  return (
    <div className="chart" data-source={feed.source}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
        <defs>
          {feed.series.map((s, i) => (
            <linearGradient
              key={`grad-${i}`}
              id={`progress-fade-${i}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity="0.0" />
              <stop offset="20%" stopColor={s.color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.85" />
            </linearGradient>
          ))}
        </defs>

        {/* Lines */}
        {feed.series.map((s, i) => (
          <path
            key={`line-${i}`}
            d={smoothPath(s.points)}
            fill="none"
            stroke={`url(#progress-fade-${i})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="progress-line"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}

        {/* Right gutter divider hairline */}
        <line
          x1={CHART_W - CHART_PAD_R}
          y1="8"
          x2={CHART_W - CHART_PAD_R}
          y2={CHART_H - 8}
          stroke="rgba(95, 217, 255, 0.18)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />

        {/* "Now" markers + end-of-line labels */}
        {feed.series.map((s, i) => {
          const p = endPoint(s.points);
          return (
            <g key={`end-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3.2"
                fill={s.color}
                className="progress-end-dot"
                style={{ animationDelay: `${i * 240}ms` }}
              />
              <text
                x={p.x + 10}
                y={p.y - 6}
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="0.12em"
                fill={s.color}
                opacity="0.95"
              >
                {s.name}
              </text>
              <text
                x={p.x + 10}
                y={p.y + 10}
                fontFamily="var(--font-mono)"
                fontSize="11"
                letterSpacing="0.04em"
                fill="var(--color-dark)"
                opacity="0.85"
              >
                {s.currentLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Rail extracted as its own component so hover state stays local — the
// previous design hoisted activeRail into NexusDashPreview, which meant
// every hover re-rendered the chart, anomaly box, and activity feed too.
// Now hovering a phase card only re-renders the rail subtree.
function DashRail({ railsPhases }: { railsPhases: RailRow[] }) {
  const [activeRail, setActiveRail] = useState<string>(
    railsPhases[0]?.id ?? "P1"
  );
  return (
    <>
      <div className="rail-h">Phases · 5</div>
      {railsPhases.map((r) => (
        <div
          key={r.id}
          className={`rail-card ${activeRail === r.id ? "active" : ""}`}
          onMouseEnter={() => setActiveRail(r.id)}
        >
          <div className="row">
            <span className="num">{r.num}</span>
            <span className="ttl">{r.title}</span>
            {r.badge && <span className="badge">{r.badge}</span>}
            {r.badgeDot && (
              <span className="badge is-dot" aria-hidden>
                ●
              </span>
            )}
          </div>
          <div className="meta-row">{r.meta}</div>
        </div>
      ))}
      <div className="rail-h">Workspace · 3</div>
      {RAILS_WORKSPACE.map((r) => {
        const href = WORKSPACE_HREF[r.id] ?? "/admin";
        return (
          <Link
            key={r.id}
            href={href}
            className={`rail-card rail-link ${activeRail === r.id ? "active" : ""}`}
            onMouseEnter={() => setActiveRail(r.id)}
          >
            <div className="row">
              <span className="num">{r.num}</span>
              <span className="ttl">{r.title}</span>
              <span className="rail-arrow" aria-hidden>
                →
              </span>
            </div>
            <div className="meta-row">{r.meta}</div>
          </Link>
        );
      })}
    </>
  );
}

export function NexusDashPreview({
  scenario = SCENARIO_BASELINE,
}: {
  scenario?: Scenario;
}) {
  const [activeTab, setActiveTab] = useState<DashTab>("Overview");
  const { railsPhases, patternSignals, activeAlerts, activity } = scenario;

  // Progress chart data source. Defaults to the curated aggregate
  // (what the average member looks like over 12 months) — this is
  // what unauthenticated marketing visitors see. After mount, if any
  // workspace state exists in localStorage, swap to the personal feed
  // (this user's own setup progress + prompt usage + decisions).
  const promptsCount = useMemo(() => PROMPT_COUNT, []);
  const decisionsCount = useMemo(
    () =>
      Array.isArray(decisionsData)
        ? decisionsData.length
        : Array.isArray((decisionsData as { decisions?: unknown[] }).decisions)
          ? (decisionsData as { decisions: unknown[] }).decisions.length
          : 0,
    []
  );
  const [feed, setFeed] = useState<ProgressFeed>(() =>
    getAggregateProgressData()
  );
  useEffect(() => {
    function refresh() {
      const snap = readWorkspaceSnapshot({
        promptsCount,
        decisionsCount,
      });
      if (hasPersonalData(snap)) {
        setFeed(getPersonalProgressData(snap));
      } else {
        setFeed(getAggregateProgressData());
      }
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [promptsCount, decisionsCount]);

  const openPalette = () =>
    typeof window !== "undefined" &&
    window.dispatchEvent(new CustomEvent("command-palette:open"));

  return (
    <section
      id="nexus"
      className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto"
    >
      <Reveal>
        <div className="mb-4">
          <SectionEyebrow>The console</SectionEyebrow>
        </div>
      </Reveal>
      <div className="section-head">
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] max-w-3xl">
            Workspace Pulse.{" "}
            <span className="headline-gradient">Live for every customer</span>{" "}
            from minute 60.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="section-subhead">
            Sessions, commits, prompts, decisions, hours saved. All five
            streams auto-synced from your repos and tools.
          </p>
        </Reveal>
      </div>

      <Reveal delay={240}>
        <div className="glass-card-static dash">
          {/* Boot sequence: tabbar in first, then 3 columns cascade
              left-to-right at 80ms intervals — reads as the workspace
              "coming online" rather than landing as a single block. */}
          <Reveal delay={0}>
            <div className="dash-tabbar">
              <div className="pills">
                {DASH_TABS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActiveTab(p)}
                    className={`pill ${activeTab === p ? "is-active" : ""}`}
                    aria-pressed={activeTab === p}
                  >
                    {p}
                  </button>
                ))}
                <span
                  className={`demo-pill ${feed.source === "personal" ? "is-live" : ""}`}
                  title={
                    feed.source === "personal"
                      ? "Showing your workspace progress. Resets if you clear localStorage."
                      : "Cohort average across all members over 12 months. Sign in to see your own."
                  }
                >
                  ● {feed.source === "personal" ? "Live · your data" : "Cohort · 12-mo average"}
                </span>
              </div>
              <button
                type="button"
                onClick={openPalette}
                className="search"
                aria-label="Open command palette (⌘K)"
              >
                ⌘K · Search
              </button>
            </div>
          </Reveal>

          <div className="dash-grid">
            {/* left rail — owns its own hover state internally so hovering
                doesn't re-render the chart / signals / activity */}
            <Reveal as="div" delay={80} className="dash-rail">
              <DashRail railsPhases={railsPhases} />
            </Reveal>

            {/* center: month strip + chart */}
            <Reveal as="div" delay={160} className="flex flex-col gap-3">
              <div className="month-strip">
                {MONTHS.map((m, i) => (
                  <span key={m} className={i === NOW_MONTH ? "is-now" : ""}>
                    {m}
                  </span>
                ))}
              </div>
              <NexusChart feed={feed} />
              <div className="stream-legend">
                {feed.series.map((s) => (
                  <span
                    key={s.name}
                    className="stream-chip"
                    title={s.desc}
                  >
                    <span
                      className="dot"
                      style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                    />
                    <span className="name">{s.name}</span>
                    <span className="unit">{s.unit}</span>
                  </span>
                ))}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] flex justify-between pt-1">
                <span>
                  {feed.source === "personal"
                    ? "your progress · live"
                    : "cohort average · 12 months"}
                </span>
                <span className="num-tab">
                  {feed.source === "personal" ? "Personal" : "Aggregate"}
                </span>
              </div>
            </Reveal>

            {/* right side: tab-aware content */}
            <Reveal as="div" delay={240} className="dash-side">
              {activeTab === "Overview" && (
                <>
                  <Link
                    href="/admin/checklist"
                    className="anomaly anomaly-link"
                    aria-label="Open the launch checklist (where these signals get resolved)"
                  >
                    <div className="h-row">
                      <span className="h">
                        <span className="dot" aria-hidden /> Pattern signals
                      </span>
                      <span className="ext" aria-hidden>↗</span>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2 font-mono text-[11px] tracking-[0.04em] text-[var(--color-muted-dark)] num-tab">
                      {patternSignals.map((s) => (
                        <div key={s.label} className="flex flex-col">
                          <div className="flex justify-between">
                            <span>{s.label}</span>
                            <span className="text-[var(--color-dark)]">{s.value}</span>
                          </div>
                          <span className="text-[10px] text-[var(--color-muted)] tracking-[0.10em]">
                            {s.note}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between mt-1 pt-2 border-t border-[rgba(255,95,179,0.20)]">
                        <span>Active alerts</span>
                        <span className="text-[var(--color-magenta)]">●  {activeAlerts}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="rail-h" style={{ marginTop: 0 }}>
                    This week
                  </div>
                  <div className="loc-list">
                    {activity.map((a, i) => (
                      <Link
                        key={i}
                        href={ACTIVITY_HREF[a.kind]}
                        className="loc loc-link"
                      >
                        <span className="city" style={{ color: KIND_COLOR[a.kind] }}>
                          ●  {a.label}
                        </span>
                        <span className="label">{a.detail}</span>
                        <span className="when">{a.when} · today</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "Tools" && (
                <>
                  <div className="rail-h" style={{ marginTop: 0 }}>
                    Connected tools · {DEMO_TOOLS.length}
                  </div>
                  <div className="loc-list">
                    {DEMO_TOOLS.map((t) => (
                      <Link
                        key={t.name}
                        href="/admin"
                        className="loc loc-link"
                      >
                        <span
                          className="city"
                          style={{
                            color:
                              t.state === "ok"
                                ? "var(--color-organic)"
                                : "var(--color-terracotta)",
                          }}
                        >
                          ●  {t.name}
                        </span>
                        <span className="label">{t.detail}</span>
                        <span className="when">
                          {t.state === "ok" ? "Connected" : "Configurable"}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mt-2 leading-relaxed">
                    Demo. Buyer view shows your real connection state per tool.
                  </p>
                </>
              )}

              {activeTab === "Prompts" && (
                <>
                  <div className="rail-h" style={{ marginTop: 0 }}>
                    Recent prompts · {PROMPT_COUNT} library
                  </div>
                  <div className="loc-list">
                    {PROMPTS_ARR.slice(0, 4).map((p, i) => (
                      <Link
                        key={p.id}
                        href="/admin/prompts"
                        className="loc loc-link"
                      >
                        <span className="city" style={{ color: "var(--color-magenta)" }}>
                          ●  P{String(i + 1).padStart(2, "0")} · {p.title}
                        </span>
                        <span className="label">{p.category}</span>
                        <span className="when">Open library →</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/admin/prompts"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cyan)] hover:text-[var(--color-dark)] mt-2 inline-block transition-colors"
                  >
                    Browse all {PROMPT_COUNT} prompts →
                  </Link>
                </>
              )}

              {activeTab === "Decisions" && (
                <>
                  <div className="rail-h" style={{ marginTop: 0 }}>
                    Recent decisions · locked
                  </div>
                  <div className="loc-list">
                    {DEMO_DECISIONS.map((d) => (
                      <Link
                        key={d.id}
                        href="/admin/decisions"
                        className="loc loc-link"
                      >
                        <span className="city" style={{ color: "var(--color-violet)" }}>
                          ●  #{d.id} · {d.title}
                        </span>
                        <span className="label">{d.note}</span>
                        <span className="when">View log →</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/admin/decisions"
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cyan)] hover:text-[var(--color-dark)] mt-2 inline-block transition-colors"
                  >
                    Open the decisions log →
                  </Link>
                </>
              )}
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
