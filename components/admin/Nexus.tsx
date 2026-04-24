"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionButton,
  type Action,
} from "@/components/shared/ActionButton";
import { StepsModal } from "@/components/shared/StepsModal";

export type NexusKind = "real" | "ghost" | "fork";

export type NexusActionKind =
  | "copy-prompt"
  | "open-url"
  | "copy-commands"
  | "view-steps";

export type NexusAction = {
  kind: NexusActionKind;
  label: string;
  payload: string;
};

export type NexusNode = {
  id: string;
  label: string;
  domain: string;
  kind: NexusKind;
  weight: number;
  desc: string;
  priority?: "high" | "medium" | "low";
  deployed?: boolean;
  github?: string;
  homepage?: string;
  actions?: NexusAction[];
  synced?: boolean;
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
const LINK_TARGET = 130;
const REPULSION = 800;
const DAMPING = 0.82;

// viewBox is centered on (0, 0): -700..700 horizontally, -500..500 vertically.
// Domain anchor coords are used directly without offset.
const VIEW_X = -700;
const VIEW_Y = -500;
const VIEW_W = 1400;
const VIEW_H = 1000;
const HALF_W = VIEW_W / 2;
const HALF_H = VIEW_H / 2;

function anchorFor(d: DomainInfo) {
  return { x: d.anchor.x, y: d.anchor.y };
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
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [didDrag, setDidDrag] = useState(false);
  const [stepsModalContent, setStepsModalContent] = useState<string | null>(
    null
  );

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
        : { x: 0, y: 0 };
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
        if (p.x < -HALF_W + 20) {
          p.x = -HALF_W + 20;
          p.vx = 0;
        } else if (p.x > HALF_W - 20) {
          p.x = HALF_W - 20;
          p.vx = 0;
        }
        if (p.y < -HALF_H + 20) {
          p.y = -HALF_H + 20;
          p.vy = 0;
        } else if (p.y > HALF_H - 20) {
          p.y = HALF_H - 20;
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
      if (!didDrag) setPinnedId(nodeId);
    }
  };

  const pinnedNode = pinnedId
    ? nodes.find((n) => n.id === pinnedId) || null
    : null;

  const hoveredNode = hoveredId
    ? nodes.find((n) => n.id === hoveredId) || null
    : null;

  // Pinned takes precedence over hover. Hover is ignored while pinned.
  const activeNode = pinnedNode || hoveredNode;
  const isPinned = pinnedNode !== null;

  const visibleIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  // While pinned, click outside the tooltip (and not on a node) closes it.
  useEffect(() => {
    if (!isPinned) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (tooltipRef.current && tooltipRef.current.contains(target)) return;
      if (target.closest("[data-nexus-node]")) return;
      setPinnedId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinnedId(null);
    };
    document.addEventListener("click", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [isPinned]);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] bg-[#05030a] border border-[var(--color-border-dark)] overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{
          touchAction: "none",
          filter: "saturate(1.35) brightness(1.2)",
        }}
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

        <g>
          {links.map((l, i) => {
            if (!visibleIds.has(l.source) || !visibleIds.has(l.target))
              return null;
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
                stroke={isHighlighted ? "#d97757" : "#d4cdbf"}
                strokeOpacity={dimmed ? 0.08 : isHighlighted ? 0.9 : 0.25}
                strokeWidth={isHighlighted ? 1.8 : 1}
              />
            );
          })}
        </g>

        <g>
          {nodes.map((n) => {
            if (!visibleIds.has(n.id)) return null;
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
                data-nexus-node={n.id}
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
                    {n.synced && (
                      <circle
                        r={r + 4}
                        fill="transparent"
                        stroke="#faf7f2"
                        strokeWidth={0.8}
                        strokeOpacity={0.5}
                        strokeDasharray="2 3"
                      />
                    )}
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

      {activeNode && (
        <HoverTooltip
          ref={tooltipRef}
          node={activeNode}
          domain={domains[activeNode.domain]}
          pinned={isPinned}
          onClose={() => setPinnedId(null)}
          onViewSteps={(payload) => {
            setStepsModalContent(payload);
            setHoveredId(null);
            setPinnedId(null);
          }}
        />
      )}

      {stepsModalContent && (
        <StepsModal
          content={stepsModalContent}
          onClose={() => setStepsModalContent(null)}
        />
      )}
    </div>
  );
}

const HoverTooltip = forwardRef<
  HTMLDivElement,
  {
    node: NexusNode;
    domain: DomainInfo | undefined;
    pinned: boolean;
    onClose: () => void;
    onViewSteps: (payload: string) => void;
  }
>(function HoverTooltip(
  { node, domain, pinned, onClose, onViewSteps },
  ref
) {
  const domainColor = domain?.color ?? "#d97757";
  const kindTag = node.synced
    ? "auto-synced"
    : node.kind === "real"
      ? "original"
      : node.kind === "fork"
        ? "fork"
        : node.priority === "high"
          ? "high priority gap"
          : "gap";
  const hasActions = !!(node.actions && node.actions.length > 0);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        maxWidth: 320,
        background: "rgba(26, 22, 18, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "16px 18px",
        border: `1px solid ${domainColor}`,
        borderLeft: `3px solid ${domainColor}`,
        pointerEvents: pinned || hasActions ? "auto" : "none",
        zIndex: 10,
        boxShadow: pinned
          ? "0 8px 28px rgba(0, 0, 0, 0.55)"
          : "0 4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {pinned && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "transparent",
            border: 0,
            color: "#8a7f6b",
            fontSize: 16,
            fontFamily: "ui-monospace, Menlo, monospace",
            cursor: "pointer",
            padding: 4,
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      )}
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: domainColor,
          marginBottom: 6,
          fontFamily: "ui-monospace, Menlo, monospace",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>{domain?.label ?? node.domain}</span>
        <span style={{ opacity: 0.7 }}>{kindTag}</span>
      </div>
      <div
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 15,
          fontWeight: 600,
          color: "#f5efe0",
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        {node.label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#a99c87",
          lineHeight: 1.55,
        }}
      >
        {node.desc}
      </div>
      {hasActions && node.actions && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${domainColor}40`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {node.actions.map((action, i) => (
            <ActionButton
              key={i}
              action={action as Action}
              accentColor={domainColor}
              onViewSteps={onViewSteps}
            />
          ))}
        </div>
      )}
      {!hasActions && (node.github || node.homepage) && (
        <div
          style={{
            fontSize: 11,
            color: "#5a4f43",
            marginTop: 10,
            fontFamily: "ui-monospace, Menlo, monospace",
          }}
        >
          click to open
        </div>
      )}
    </div>
  );
});
