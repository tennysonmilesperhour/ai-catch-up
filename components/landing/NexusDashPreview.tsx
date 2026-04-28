"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const NOW_MONTH = 3; // April (0-indexed)

const RAILS_PHASES = [
  { id: "P1", title: "Capture idea", meta: "5–10 min" },
  { id: "P2", title: "Set up accounts", meta: "15–20 min" },
  { id: "P3", title: "Install starter", meta: "10–15 min" },
  { id: "P4", title: "Configure Claude", meta: "10–15 min" },
  { id: "P5", title: "Receive outputs", meta: "5 min", active: true },
];
const RAILS_WORKSPACE = [
  { id: "WS1", title: "CLAUDE.md", meta: "spec" },
  { id: "WS2", title: "Nexus map", meta: "live graph" },
  { id: "WS3", title: "Prompt library", meta: "20 prompts" },
];

const LOCATIONS = [
  { who: "LA", when: "26-04-27T 13:43:18" },
  { who: "SF", when: "26-04-27T 16:08:15" },
  { who: "NYC", when: "26-04-27T 11:22:04" },
  { who: "LDN", when: "26-04-27T 09:51:47" },
];

function cityFor(code: string): string {
  switch (code) {
    case "LA":
      return "Los Angeles, CA";
    case "SF":
      return "San Francisco, CA";
    case "NYC":
      return "New York, NY";
    case "LDN":
      return "London, UK";
    case "BER":
      return "Berlin, DE";
    default:
      return code;
  }
}

const WAVES = [
  { ampBase: 18, ampVar: 6, freq1: 0.0042, freq2: 0.0018, phase: 0.6, yBase: 90, drift: 0.00012, color: "#5fffd7", op: 0.85 },
  { ampBase: 22, ampVar: 8, freq1: 0.0038, freq2: 0.0021, phase: 1.4, yBase: 115, drift: 0.00009, color: "#ff5fb3", op: 0.75 },
  { ampBase: 14, ampVar: 5, freq1: 0.0055, freq2: 0.0014, phase: 2.1, yBase: 140, drift: 0.00015, color: "#c084fc", op: 0.7 },
  { ampBase: 28, ampVar: 9, freq1: 0.0029, freq2: 0.0026, phase: 3.0, yBase: 160, drift: 0.00007, color: "#fbbf24", op: 0.6 },
  { ampBase: 12, ampVar: 4, freq1: 0.0072, freq2: 0.0011, phase: 4.5, yBase: 180, drift: 0.00018, color: "#4ade80", op: 0.55 },
];

const CHART_W = 720;
const CHART_H = 220;

type Wave = (typeof WAVES)[number];

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

function NexusChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const probeLineRef = useRef<SVGLineElement | null>(null);
  const probeDotRef = useRef<SVGCircleElement | null>(null);
  const probeLabelRef = useRef<SVGTextElement | null>(null);
  const reducedRef = useRef(false);
  const visibleRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef(240);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduce;

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    samplesRef.current = mobile ? 100 : 240;

    function paint(t: number) {
      const samples = samplesRef.current;
      WAVES.forEach((w, i) => {
        const p = pathRefs.current[i];
        if (p) p.setAttribute("d", genPath(w, t, samples, w.drift));
      });
      const xProbe = ((t * 0.06) % 1) * CHART_W;
      const probeWave = WAVES[0];
      const yProbe =
        probeWave.yBase +
        Math.sin(xProbe * probeWave.freq1 + t * probeWave.phase) * probeWave.ampBase +
        Math.cos(xProbe * probeWave.freq2 + t * 0.7) * probeWave.ampVar;
      probeLineRef.current?.setAttribute("x1", xProbe.toFixed(2));
      probeLineRef.current?.setAttribute("x2", xProbe.toFixed(2));
      probeDotRef.current?.setAttribute("cx", xProbe.toFixed(2));
      probeDotRef.current?.setAttribute("cy", yProbe.toFixed(2));
      const label = `VYG1 ${(yProbe * 0.84 + 12).toFixed(2)}`;
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
        {WAVES.map((w, i) => (
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
          VYG1
        </text>
      </svg>
    </div>
  );
}

export function NexusDashPreview() {
  const [activeRail, setActiveRail] = useState<string>("P5");

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
            The Nexus dashboard.{" "}
            <span className="headline-gradient">Live for every customer</span>{" "}
            from minute 60.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="section-subhead">
            What your workspace looks like the moment onboarding ends.
            Auto-syncing, observable, yours forever.
          </p>
        </Reveal>
      </div>

      <Reveal delay={240}>
        <div className="glass-card-static dash">
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
            </div>
            <span className="search">⌘K · Search</span>
          </div>

          <div className="dash-grid">
            {/* left rail */}
            <div className="dash-rail">
              <div className="rail-h">Setup phases</div>
              {RAILS_PHASES.map((r) => (
                <div
                  key={r.id}
                  className={`rail-card ${activeRail === r.id ? "active" : ""}`}
                  onMouseEnter={() => setActiveRail(r.id)}
                >
                  <span className="meta">{r.id}</span>
                  <span className="block">{r.title}</span>
                  <span className="meta">{r.meta}</span>
                </div>
              ))}
              <div className="rail-h">Workspace</div>
              {RAILS_WORKSPACE.map((r) => (
                <div
                  key={r.id}
                  className={`rail-card ${activeRail === r.id ? "active" : ""}`}
                  onMouseEnter={() => setActiveRail(r.id)}
                >
                  <span className="meta">{r.id}</span>
                  <span className="block">{r.title}</span>
                  <span className="meta">{r.meta}</span>
                </div>
              ))}
            </div>

            {/* center: month strip + chart */}
            <div className="flex flex-col gap-3">
              <div className="month-strip">
                {MONTHS.map((m, i) => (
                  <span key={m} className={i === NOW_MONTH ? "is-now" : ""}>
                    {m}
                  </span>
                ))}
              </div>
              <NexusChart />
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] flex justify-between pt-1">
                <span>Throughput · 5 streams</span>
                <span className="num-tab">VYG1 · live</span>
              </div>
            </div>

            {/* right side */}
            <div className="dash-side">
              <div className="anomaly">
                <div className="h-row">
                  <span className="h">
                    <span className="dot" aria-hidden /> Anomaly detection
                  </span>
                  <span className="ext" aria-hidden>↗</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-2 font-mono text-[11px] tracking-[0.04em] text-[var(--color-muted-dark)] num-tab">
                  <div className="flex justify-between">
                    <span>Service availability</span>
                    <span className="text-[var(--color-dark)]">29.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95 utilization</span>
                    <span className="text-[var(--color-dark)]">43.5 MHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overload [24h]</span>
                    <span className="text-[var(--color-dark)]">41 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active alerts</span>
                    <span className="text-[var(--color-magenta)]">●  34</span>
                  </div>
                </div>
              </div>
              <div className="rail-h" style={{ marginTop: 0 }}>
                Recent syncs
              </div>
              <div className="loc-list">
                {LOCATIONS.map((l) => (
                  <div key={l.who} className="loc">
                    <span className="city">{cityFor(l.who)}</span>
                    <span className="label">Last sync</span>
                    <span className="when">{l.when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
