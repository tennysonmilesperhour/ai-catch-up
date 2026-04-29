"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import promptsData from "@/content/admin/prompts.json";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import {
  SCENARIO_BASELINE,
  type ActivityKind,
  type RailRow,
  type Scenario,
  type Wave,
} from "@/lib/dashboard-scenarios";

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

function genPath(w: Wave, t: number, samples: number, drift: number) {
  const step = CHART_W / (samples - 1);
  let d = "";
  for (let i = 0; i < samples; i++) {
    const x = i * step;
    const y =
      w.yBase +
      Math.sin(x * w.freq1 + t * w.phase) * w.ampBase +
      Math.cos(x * w.freq2 + t * 0.7) * w.ampVar +
      Math.sin(t * drift + i * 0.012) * 4;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)} ` : `L ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d;
}

function NexusChart({ waves }: { waves: Wave[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const probeLineRef = useRef<SVGLineElement | null>(null);
  const probeDotRef = useRef<SVGCircleElement | null>(null);
  const probeLabelRef = useRef<SVGTextElement | null>(null);
  const reducedRef = useRef(false);
  const visibleRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef(240);
  // Hold current waves in a ref so the RAF reads the latest dataset on
  // every frame without restarting when scenarios swap on the playground.
  const wavesRef = useRef<Wave[]>(waves);
  useEffect(() => {
    wavesRef.current = waves;
  }, [waves]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduce;

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    // Cut sample density: 60 mobile / 140 desktop. Visually identical at
    // chart scale, ~2× cheaper per frame than the previous 100/240.
    samplesRef.current = mobile ? 60 : 140;
    // Frame throttle: paint at ~30fps instead of every frame. The chart
    // is decorative; halving the work doesn't change how it reads.
    const FRAME_INTERVAL = 1000 / 30;
    let lastPaintAt = 0;

    function paint(t: number) {
      const samples = samplesRef.current;
      const ws = wavesRef.current;
      ws.forEach((w, i) => {
        const p = pathRefs.current[i];
        if (p) p.setAttribute("d", genPath(w, t, samples, w.drift));
      });
      const xProbe = ((t * 0.06) % 1) * CHART_W;
      const probeWave = ws[0];
      if (!probeWave) return;
      const yProbe =
        probeWave.yBase +
        Math.sin(xProbe * probeWave.freq1 + t * probeWave.phase) * probeWave.ampBase +
        Math.cos(xProbe * probeWave.freq2 + t * 0.7) * probeWave.ampVar;
      probeLineRef.current?.setAttribute("x1", xProbe.toFixed(2));
      probeLineRef.current?.setAttribute("x2", xProbe.toFixed(2));
      probeDotRef.current?.setAttribute("cx", xProbe.toFixed(2));
      probeDotRef.current?.setAttribute("cy", yProbe.toFixed(2));
      // Map the wave's y back into a presentable count. The wave amplitude
      // is roughly 0..200, so dividing by 5 gives plausible "sessions/wk"
      // values in the 10-40 range.
      const reading = Math.max(0, Math.round((220 - yProbe) / 4));
      const label = `${probeWave.name} ${reading} ${probeWave.unit}`;
      probeLabelRef.current?.setAttribute("x", (xProbe + 8).toFixed(2));
      probeLabelRef.current?.setAttribute("y", (yProbe - 8).toFixed(2));
      if (probeLabelRef.current) probeLabelRef.current.textContent = label;
    }

    if (reduce) {
      paint(0);
      return;
    }

    const svgEl = svgRef.current;
    if (!svgEl) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visibleRef.current = e.isIntersecting;
          if (e.isIntersecting && rafRef.current == null) tick(performance.now());
        }
      },
      { threshold: 0.05 }
    );
    io.observe(svgEl);

    function tick(now: number) {
      if (!visibleRef.current) {
        rafRef.current = null;
        return;
      }
      if (now - lastPaintAt >= FRAME_INTERVAL) {
        paint(now / 1000);
        lastPaintAt = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    // Pause cleanly when the tab goes hidden so background tabs don't
    // burn CPU on a chart no one's looking at.
    function onVis() {
      if (document.visibilityState === "hidden") {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (visibleRef.current && rafRef.current == null) {
        lastPaintAt = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="chart">
      <svg ref={svgRef} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
        {waves.map((w, i) => (
          <path
            key={`w-${i}`}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d=""
            fill="none"
            stroke={w.color}
            strokeOpacity={w.op}
            strokeWidth="1.2"
          />
        ))}
        {/* probe sweep */}
        <line
          ref={probeLineRef}
          x1="0"
          y1="0"
          x2="0"
          y2={CHART_H}
          stroke="rgba(95, 217, 255, 0.4)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <circle ref={probeDotRef} cx="0" cy="0" r="3.2" fill="#5fffd7" />
        <text
          ref={probeLabelRef}
          x="0"
          y="0"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="0.14em"
          fill="#5fffd7"
        >
          Sessions
        </text>

        {/* Decorative stream labels (static, anchored at t=0). */}
        {STREAM_LABELS.map((s, i) => {
          const w = waves[s.wave];
          if (!w) return null;
          const y =
            w.yBase +
            Math.sin(s.x * w.freq1 + 0) * w.ampBase +
            Math.cos(s.x * w.freq2 + 0) * w.ampVar;
          return (
            <g key={`label-${i}`}>
              <circle cx={s.x} cy={y} r="3" fill={w.color} />
              <text
                x={s.x + 8}
                y={y - 8}
                fontFamily="var(--font-mono)"
                fontSize="9"
                letterSpacing="0.14em"
                fill={w.color}
                opacity="0.85"
              >
                {w.name}
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
  const {
    waves,
    railsPhases,
    patternSignals,
    activeAlerts,
    activity,
  } = scenario;

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
                  className="demo-pill"
                  title="Demo data. After purchase, this view is fed by your repos, sessions, and prompts."
                >
                  ● Demo · live for buyers
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
              <NexusChart waves={waves} />
              <div className="stream-legend">
                {waves.map((w) => (
                  <span
                    key={w.name}
                    className="stream-chip"
                    title={w.desc}
                  >
                    <span className="dot" style={{ background: w.color, boxShadow: `0 0 6px ${w.color}` }} />
                    <span className="name">{w.name}</span>
                    <span className="unit">{w.unit}</span>
                  </span>
                ))}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] flex justify-between pt-1">
                <span>5 streams · auto-synced</span>
                <span className="num-tab">Sessions · live probe</span>
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
