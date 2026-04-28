"use client";

import { useMemo } from "react";

const GLOBE_R = 170;
const VIEW = 400;
const CENTER = VIEW / 2;
const DOT_COUNT = 140;

type Dot = { x: number; y: number; r: number; cyan: boolean };

function generateDots(): Dot[] {
  const dots: Dot[] = [];
  let seed = 137;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  while (dots.length < DOT_COUNT) {
    const a = rnd() * Math.PI * 2;
    const b = Math.acos(2 * rnd() - 1);
    const x = Math.sin(b) * Math.cos(a);
    const y = Math.sin(b) * Math.sin(a);
    const z = Math.cos(b);
    if (z < 0.05) continue;
    dots.push({
      x: CENTER + x * GLOBE_R * 0.95,
      y: CENTER + y * GLOBE_R * 0.95,
      r: 0.7 + (1 - z) * 1.4,
      cyan: rnd() < 0.18,
    });
  }
  return dots;
}

const PINGS = [
  { x: CENTER - 70, y: CENTER + 30, color: "#5fffd7", delay: "0s",   label: "SF",  count: "2.1k" },
  { x: CENTER + 80, y: CENTER - 40, color: "#ff5fb3", delay: "0.6s", label: "NYC", count: "3.8k" },
  { x: CENTER + 30, y: CENTER + 70, color: "#c084fc", delay: "1.2s", label: "LDN", count: "1.4k" },
];

export function OpsPanelGlobe() {
  const dots = useMemo(() => generateDots(), []);

  return (
    <div className="glass-card-static ops-panel">
      <div className="ops-panel-head">
        <span>Nexus · Live map</span>
        <span className="live">
          <span className="dot" aria-hidden /> Tracking
        </span>
      </div>

      <div className="globe-wrap">
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label="Live nexus map">
          <defs>
            <radialGradient id="globe-fill" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(95, 255, 215, 0.10)" />
              <stop offset="60%" stopColor="rgba(13, 28, 52, 0.0)" />
              <stop offset="100%" stopColor="rgba(2, 6, 14, 0.4)" />
            </radialGradient>
          </defs>

          {/* base sphere */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={GLOBE_R}
            fill="url(#globe-fill)"
            stroke="rgba(95, 255, 215, 0.4)"
            strokeWidth="1.2"
          />

          {/* longitude lines */}
          {[0.6, 1.0, 1.4].map((rx, i) => (
            <ellipse
              key={`lon-${i}`}
              cx={CENTER}
              cy={CENTER}
              rx={GLOBE_R * rx * 0.55}
              ry={GLOBE_R}
              fill="none"
              stroke="rgba(95, 217, 255, 0.18)"
              strokeWidth="1"
            />
          ))}

          {/* latitude lines */}
          {[0.35, 0.65, 0.85, 0.95].map((ry, i) => (
            <ellipse
              key={`lat-${i}`}
              cx={CENTER}
              cy={CENTER}
              rx={GLOBE_R}
              ry={GLOBE_R * ry}
              fill="none"
              stroke="rgba(95, 217, 255, 0.18)"
              strokeWidth="1"
            />
          ))}

          {/* surface dots */}
          {dots.map((d, i) => (
            <circle
              key={`d-${i}`}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={d.cyan ? "rgba(95, 255, 215, 0.85)" : "rgba(125, 138, 173, 0.55)"}
            />
          ))}

          {/* dashed magenta orbit */}
          <g style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
            <ellipse
              cx={CENTER}
              cy={CENTER}
              rx={GLOBE_R + 18}
              ry={GLOBE_R * 0.45}
              fill="none"
              stroke="rgba(255, 95, 179, 0.55)"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`-15 ${CENTER} ${CENTER}`}
                to={`345 ${CENTER} ${CENTER}`}
                dur="40s"
                repeatCount="indefinite"
              />
            </ellipse>
          </g>

          {/* location pings */}
          {PINGS.map((p, i) => {
            const labelOnLeft = p.x > CENTER;
            const tx = labelOnLeft ? p.x - 12 : p.x + 12;
            const anchor = labelOnLeft ? "end" : "start";
            return (
              <g key={`p-${i}`}>
                <circle cx={p.x} cy={p.y} r="3" fill={p.color}>
                  <animate
                    attributeName="r"
                    from="3"
                    to="22"
                    dur="2.4s"
                    begin={p.delay}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.9"
                    to="0"
                    dur="2.4s"
                    begin={p.delay}
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx={p.x} cy={p.y} r="3.2" fill={p.color} />
                <text
                  x={tx}
                  y={p.y + 4}
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  letterSpacing="0.14em"
                  fill={p.color}
                  textAnchor={anchor}
                  opacity="0.95"
                >
                  {p.label} · {p.count}
                </text>
              </g>
            );
          })}

          {/* outer ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={GLOBE_R + 18}
            fill="none"
            stroke="rgba(95, 217, 255, 0.18)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Stat strip moved to Hero per the reference shots; OpsPanelGlobe now
          carries just the globe + header chip. */}
    </div>
  );
}
