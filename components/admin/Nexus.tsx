"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type NexusKind = "real" | "ghost" | "fork";

export type NexusNode = {
  id: string;
  label: string;
  domain: string;
  kind: NexusKind;
  weight: number;
  desc: string;
  priority?: "high";
};

export type NexusLink = {
  source: string;
  target: string;
  strength: number;
};

export type DomainInfo = {
  label: string;
  color: string;
  anchor: { x: number; y: number };
};

export type DomainsRecord = Record<string, DomainInfo>;

type Props = {
  domains: DomainsRecord;
  nodes: NexusNode[];
  links: NexusLink[];
};

type Pos = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const DOMAIN_ANCHOR_PULL = 0.008;
const LINK_STIFFNESS = 0.01;
const LINK_TARGET = 110;
const REPULSION = 600;
const DAMPING = 0.82;

const VIEW_W = 1000;
const VIEW_H = 700;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

function anchorFor(d: DomainInfo) {
  return { x: CX + d.anchor.x, y: CY + d.anchor.y };
}

function nodeRadius(n: NexusNode) {
  return 6 + n.weight * 1.5;
}

export function Nexus({ domains, nodes, links }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const positionsRef = useRef<Map<string, Pos>>(new Map());
  const draggingRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const [, setTick] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [didDrag, setDidDrag] = useState(false);

  const domainList = useMemo(
    () =>
      Object.entries(domains).map(([id, info]) => ({
        id,
        ...info,
      })),
    [domains]
  );

  const neighborsOf = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of nodes) m.set(n.id, new Set());
    for (const l of links) {
      m.get(l.source)?.add(l.target);
      m.get(l.target)?.add(l.source);
    }
    return m;
  }, [nodes, links]);

  // Initialize positions near domain anchors
  useEffect(() => {
    const positions = positionsRef.current;
    for (const n of nodes) {
      if (positions.has(n.id)) continue;
      const d = domains[n.domain];
      const { x: cx, y: cy } = d
        ? anchorFor(d)
        : { x: CX, y: CY };
      const angle = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 40;
      positions.set(n.id, {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      });
    }
  }, [nodes, domains]);

  // Simulation loop
  useEffect(() => {
    const positions = positionsRef.current;

    const step = () => {
      for (const n of nodes) {
        if (draggingRef.current === n.id) continue;
        const p = positions.get(n.id);
        if (!p) continue;
        const d = domains[n.domain];
        if (!d) continue;
        const { x: ax, y: ay } = anchorFor(d);
        p.vx += (ax - p.x) * DOMAIN_ANCHOR_PULL;
        p.vy += (ay - p.y) * DOMAIN_ANCHOR_PULL;
      }

      for (const l of links) {
        const a = positions.get(l.source);
        const b = positions.get(l.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const diff = dist - LINK_TARGET;
        const k = LINK_STIFFNESS * l.strength;
        const fx = (dx / dist) * diff * k;
        const fy = (dy / dist) * diff * k;
        if (draggingRef.current !== l.source) {
          a.vx += fx;
          a.vy += fy;
        }
        if (draggingRef.current !== l.target) {
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = positions.get(nodes[i].id);
        if (!a) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = positions.get(nodes[j].id);
          if (!b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = Math.max(dx * dx + dy * dy, 25);
          const dist = Math.sqrt(distSq);
          const force = REPULSION / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (draggingRef.current !== nodes[i].id) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (draggingRef.current !== nodes[j].id) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      for (const n of nodes) {
        if (draggingRef.current === n.id) continue;
        const p = positions.get(n.id);
        if (!p) continue;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 20) {
          p.x = 20;
          p.vx = 0;
        } else if (p.x > VIEW_W - 20) {
          p.x = VIEW_W - 20;
          p.vx = 0;
        }
        if (p.y < 20) {
          p.y = 20;
          p.vy = 0;
        } else if (p.y > VIEW_H - 20) {
          p.y = VIEW_H - 20;
          p.vy = 0;
        }
      }

      setTick((t) => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, links, domains]);

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const onNodePointerDown = (
    e: React.PointerEvent<SVGGElement>,
    nodeId: string
  ) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = nodeId;
    setDidDrag(false);
  };

  const onNodePointerMove = (
    e: React.PointerEvent<SVGGElement>,
    nodeId: string
  ) => {
    if (draggingRef.current !== nodeId) return;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const p = positionsRef.current.get(nodeId);
    if (!p) return;
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy > 4) setDidDrag(true);
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
  };

  const onNodePointerUp = (
    e: React.PointerEvent<SVGGElement>,
    nodeId: string
  ) => {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    if (draggingRef.current === nodeId) {
      draggingRef.current = null;
      if (!didDrag) setSelectedId(nodeId);
    }
  };

  const selectedNode = selectedId
    ? nodes.find((n) => n.id === selectedId) || null
    : null;

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] bg-[var(--color-darker)] border border-[var(--color-border-dark)] overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ touchAction: "none" }}
      >
        <defs>
          {domainList.map((d) => (
            <radialGradient
              key={d.id}
              id={`halo-${d.id}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={d.color} stopOpacity="0.28" />
              <stop offset="60%" stopColor={d.color} stopOpacity="0.06" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g>
          {domainList.map((d) => {
            const { x, y } = anchorFor(d);
            return (
              <g key={d.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={180}
                  fill={`url(#halo-${d.id})`}
                />
                <text
                  x={x}
                  y={y - 150}
                  textAnchor="middle"
                  fill={d.color}
                  style={{
                    fontFamily: "ui-monospace, Menlo, monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    opacity: 0.8,
                  }}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </g>

        <g stroke="#d4cdbf" strokeOpacity="0.25">
          {links.map((l, i) => {
            const a = positionsRef.current.get(l.source);
            const b = positionsRef.current.get(l.target);
            if (!a || !b) return null;
            const isHighlighted =
              hoveredId &&
              (l.source === hoveredId || l.target === hoveredId);
            const dimmed = hoveredId && !isHighlighted;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeOpacity={dimmed ? 0.08 : isHighlighted ? 0.7 : 0.25}
                strokeWidth={isHighlighted ? 1.8 : 1}
              />
            );
          })}
        </g>

        <g>
          {nodes.map((n) => {
            const p = positionsRef.current.get(n.id);
            if (!p) return null;
            const d = domains[n.domain];
            const color = d?.color ?? "#d97757";
            const isHovered = hoveredId === n.id;
            const isNeighbor =
              hoveredId !== null &&
              neighborsOf.get(hoveredId)?.has(n.id);
            const dimmed =
              hoveredId !== null && !isHovered && !isNeighbor;
            const r = nodeRadius(n);

            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                style={{
                  cursor: "pointer",
                  opacity: dimmed ? 0.22 : 1,
                  transition: "opacity 200ms",
                }}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                onPointerMove={(e) => onNodePointerMove(e, n.id)}
                onPointerUp={(e) => onNodePointerUp(e, n.id)}
                onPointerEnter={() => setHoveredId(n.id)}
                onPointerLeave={() => setHoveredId(null)}
              >
                {n.kind === "real" && (
                  <>
                    <circle r={r + 5} fill={color} opacity={0.25} filter="url(#nodeGlow)" />
                    <circle r={r} fill={color} />
                    <circle r={Math.max(2, r * 0.25)} fill="#faf7f2" />
                  </>
                )}
                {n.kind === "ghost" && (
                  <>
                    <circle
                      r={r}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={1.4}
                      strokeDasharray="3 3"
                    >
                      <animate
                        attributeName="r"
                        values={`${r};${r + 2};${r}`}
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.6;1;0.6"
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {n.priority === "high" && (
                      <circle r={Math.max(2, r * 0.25)} fill="#d97757" />
                    )}
                  </>
                )}
                {n.kind === "fork" && (
                  <>
                    <circle
                      r={r + 3}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={1}
                      strokeOpacity={0.5}
                    />
                    <circle r={r} fill={color} opacity={0.75} />
                    <circle r={Math.max(2, r * 0.25)} fill="#faf7f2" />
                  </>
                )}
                <text
                  x={0}
                  y={r + 16}
                  textAnchor="middle"
                  fill="#faf7f2"
                  fontStyle={n.kind === "ghost" ? "italic" : "normal"}
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 12,
                    pointerEvents: "none",
                  }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute top-4 left-4 flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--color-terracotta)]" />
          <span>Real</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border border-[var(--color-terracotta)]"
            style={{ background: "transparent", borderStyle: "dashed" }}
          />
          <span>Ghost (coming soon)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background: "var(--color-terracotta)",
              opacity: 0.75,
              outline: "1px solid var(--color-terracotta)",
              outlineOffset: "1px",
            }}
          />
          <span>Fork</span>
        </div>
      </div>

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          domain={domains[selectedNode.domain]}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function NodeModal({
  node,
  domain,
  onClose,
}: {
  node: NexusNode;
  domain: DomainInfo | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kindLabel =
    node.kind === "real"
      ? "In the onboarding"
      : node.kind === "fork"
        ? "Fork / adjacent"
        : "Coming soon";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-cream)] text-[var(--color-dark)] max-w-md w-[90%] p-8 border border-[var(--color-border)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 font-mono text-sm text-[var(--color-muted-dark)] hover:text-[var(--color-dark)]"
          aria-label="Close"
        >
          X
        </button>
        <p className="label mb-3" style={{ color: domain?.color }}>
          {domain?.label || node.domain} &middot; {kindLabel}
        </p>
        <h2 className="font-serif text-2xl md:text-3xl mb-4">
          {node.label}
        </h2>
        {node.desc ? (
          <p className="text-[var(--color-muted-dark)] leading-relaxed">
            {node.desc}
          </p>
        ) : (
          <p className="italic text-[var(--color-muted)]">
            TODO: Description pending.
          </p>
        )}
      </div>
    </div>
  );
}
