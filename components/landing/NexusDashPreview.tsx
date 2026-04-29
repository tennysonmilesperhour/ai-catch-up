"use client";

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
const PROMPT_COUNT = Array.isArray(promptsData)
  ? promptsData.length
  : Array.isArray((promptsData as { prompts?: unknown[] }).prompts)
    ? ((promptsData as { prompts: unknown[] }).prompts.length)
    : 0;

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
    samplesRef.current = mobile ? 100 : 240;

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
      paint(now / 1000);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      io.disconnect();
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

export function NexusDashPreview({
  scenario = SCENARIO_BASELINE,
}: {
  scenario?: Scenario;
}) {
  const [activeRail, setActiveRail] = useState<string>(
    scenario.railsPhases[0]?.id ?? "P1"
  );
  const {
    waves,
    railsPhases,
    patternSignals,
    activeAlerts,
    activity,
  } = scenario;

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
                {["Overview", "Tools", "Prompts", "Decisions"].map((p) => (
                  <span
                    key={p}
                    className={`pill ${p === "Overview" ? "is-active" : ""}`}
                  >
                    {p}
                  </span>
                ))}
                <span
                  className="demo-pill"
                  title="Demo data. After purchase, this view is fed by your repos, sessions, and prompts."
                >
                  ● Demo · live for buyers
                </span>
              </div>
              <span className="search">⌘K · Search</span>
            </div>
          </Reveal>

          <div className="dash-grid">
            {/* left rail */}
            <Reveal as="div" delay={80} className="dash-rail">
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
                    {r.badgeDot && <span className="badge is-dot" aria-hidden>●</span>}
                  </div>
                  <div className="meta-row">{r.meta}</div>
                </div>
              ))}
              <div className="rail-h">Workspace · 3</div>
              {RAILS_WORKSPACE.map((r) => (
                <div
                  key={r.id}
                  className={`rail-card ${activeRail === r.id ? "active" : ""}`}
                  onMouseEnter={() => setActiveRail(r.id)}
                >
                  <div className="row">
                    <span className="num">{r.num}</span>
                    <span className="ttl">{r.title}</span>
                  </div>
                  <div className="meta-row">{r.meta}</div>
                </div>
              ))}
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

            {/* right side */}
            <Reveal as="div" delay={240} className="dash-side">
              <div className="anomaly">
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
              </div>
              <div className="rail-h" style={{ marginTop: 0 }}>
                This week
              </div>
              <div className="loc-list">
                {activity.map((a, i) => (
                  <div key={i} className="loc">
                    <span
                      className="city"
                      style={{ color: KIND_COLOR[a.kind] }}
                    >
                      ●  {a.label}
                    </span>
                    <span className="label">{a.detail}</span>
                    <span className="when">{a.when} · today</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
