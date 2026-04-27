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
import { buildOrbitalLayout } from "@/lib/nexus-layout";

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

type OrbitState = {
  cx: number;       // orbit center x (planet anchor or origin)
  cy: number;       // orbit center y
  radius: number;   // distance from center
  angle: number;    // current angular position (radians)
  speed: number;    // angular velocity in rad/ms (signed: + = ccw, - = cw)
  x: number;        // computed cartesian
  y: number;
  frozen: boolean;  // true while user is dragging this node
};

// Slow, meditative orbital speeds (radians per millisecond).
// Smaller = slower. These produce ~3-7 minute revolutions.
const APPS_INNER_SPEED = 0.00006;   // ~104 sec / revolution
const APPS_MID_SPEED   = 0.00005;   // ~125 sec
const ORPHAN_SPEED     = 0.00004;   // ~157 sec
const PLANET_SPEED     = 0.00003;   // ~210 sec around each planet

// Orbit ring radii (must match the layout helper's spacing).
const APPS_INNER_RADIUS = 90;
const APPS_MID_RADIUS = 175;
const ORPHAN_RING_RADIUS = 290;
const PLANET_NODE_RADIUS = 130;

// viewBox is centered on (0, 0): -700..700 horizontally, -500..500 vertically.
const VIEW_X = -700;
const VIEW_Y = -500;
const VIEW_W = 1400;
const VIEW_H = 1000;

function anchorFor(d: DomainInfo) {
  return { x: d.anchor.x, y: d.anchor.y };
}

function nodeRadius(n: NexusNode) {
  return 6 + n.weight * 1.5;
}

// Channel-wise tweaks for shading planets.
function lighten(hex: string, amount = 0.4): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const mix = (n: number) =>
    Math.min(255, Math.round(n + (255 - n) * amount));
  const r = mix(parseInt(c.slice(0, 2), 16));
  const g = mix(parseInt(c.slice(2, 4), 16));
  const b = mix(parseInt(c.slice(4, 6), 16));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Split a label into 1-2 lines and pick a font size that fits inside a
// circle of the given radius. Two-line if the label has two or three words;
// otherwise single line.
function fitPlanetLabel(
  label: string,
  innerRadius: number
): { lines: string[]; fontSize: number; lineHeight: number } {
  const words = label.split(/\s+/);
  let lines: string[];
  if (words.length <= 1) {
    lines = [label];
  } else if (words.length === 2) {
    lines = words;
  } else {
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }
  const longest = Math.max(...lines.map((l) => l.length));
  // 0.58 is a rough average glyph-width-to-font-size ratio for Outfit caps.
  // 1.7 = padding factor inside the circle so text doesn't touch the rim.
  const fontSize = Math.max(
    7,
    Math.min(12, (innerRadius * 1.7) / Math.max(longest, 1))
  );
  return { lines, fontSize, lineHeight: fontSize * 1.05 };
}

function darken(hex: string, amount = 0.5): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const r = Math.round(parseInt(c.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(c.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(c.slice(4, 6), 16) * (1 - amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function Nexus({ domains, nodes, links }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const positionsRef = useRef<Map<string, OrbitState>>(new Map());
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    pan: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Solar-system layout: core at origin, apps inner ring, other domains as
  // planets on an outer circle.
  const layout = useMemo(
    () => buildOrbitalLayout(domains, nodes),
    [domains, nodes]
  );
  const orbitalDomains = layout.domains;

  const domainList = useMemo(
    () =>
      Object.entries(orbitalDomains).map(([id, info]) => ({
        id,
        ...info,
      })),
    [orbitalDomains]
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

  // Initialize orbital state per node based on which "ring" they belong to.
  useEffect(() => {
    const positions = positionsRef.current;
    const planetSet = new Set(layout.planets.map((p) => p.id));
    const orphanDomainKeys = new Set(
      Object.keys(domains).filter(
        (k) => k !== "core" && k !== "apps" && !planetSet.has(k)
      )
    );

    // Bucket nodes by domain so we can spread initial angles within each ring.
    const byDomain = new Map<string, NexusNode[]>();
    for (const n of nodes) {
      if (!byDomain.has(n.domain)) byDomain.set(n.domain, []);
      byDomain.get(n.domain)!.push(n);
    }

    // Track running angle index for the orphan ring so multiple orphan
    // domains spread around the sun instead of stacking.
    let orphanRingIndex = 0;
    const orphanCount = Array.from(byDomain.entries())
      .filter(([k]) => orphanDomainKeys.has(k))
      .reduce((sum, [, list]) => sum + list.length, 0);

    let planetIndex = 0;
    for (const [domain, list] of byDomain.entries()) {
      // Core domain (Global Memory) sits on the sun, no orbit.
      if (domain === "core") {
        for (const n of list) {
          if (positions.has(n.id)) continue;
          positions.set(n.id, {
            cx: 0, cy: 0, radius: 0, angle: 0, speed: 0,
            x: 0, y: 0, frozen: false,
          });
        }
        continue;
      }

      // Apps: real / high-priority on inner ring, others on mid ring.
      if (domain === "apps") {
        const inner = list.filter(
          (n) => n.kind === "real" || (n.kind === "ghost" && n.priority === "high")
        );
        const mid = list.filter(
          (n) => !(n.kind === "real" || (n.kind === "ghost" && n.priority === "high"))
        );
        inner.forEach((n, i) => {
          if (positions.has(n.id)) return;
          const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(inner.length, 1);
          positions.set(n.id, {
            cx: 0, cy: 0,
            radius: APPS_INNER_RADIUS,
            angle: a,
            speed: APPS_INNER_SPEED,
            x: Math.cos(a) * APPS_INNER_RADIUS,
            y: Math.sin(a) * APPS_INNER_RADIUS,
            frozen: false,
          });
        });
        mid.forEach((n, i) => {
          if (positions.has(n.id)) return;
          const a =
            -Math.PI / 2 +
            Math.PI / 4 +
            (2 * Math.PI * i) / Math.max(mid.length, 1);
          positions.set(n.id, {
            cx: 0, cy: 0,
            radius: APPS_MID_RADIUS,
            angle: a,
            speed: APPS_MID_SPEED,
            x: Math.cos(a) * APPS_MID_RADIUS,
            y: Math.sin(a) * APPS_MID_RADIUS,
            frozen: false,
          });
        });
        continue;
      }

      // Orphan domains (single-node categories like security): orbit the sun
      // on the orphan ring, distributed evenly across the ring.
      if (orphanDomainKeys.has(domain)) {
        list.forEach((n) => {
          if (positions.has(n.id)) return;
          const a =
            -Math.PI / 2 +
            (2 * Math.PI * orphanRingIndex) / Math.max(orphanCount, 1);
          positions.set(n.id, {
            cx: 0, cy: 0,
            radius: ORPHAN_RING_RADIUS,
            angle: a,
            speed: ORPHAN_SPEED,
            x: Math.cos(a) * ORPHAN_RING_RADIUS,
            y: Math.sin(a) * ORPHAN_RING_RADIUS,
            frozen: false,
          });
          orphanRingIndex += 1;
        });
        continue;
      }

      // Planet domain: nodes orbit the planet anchor.
      const d = orbitalDomains[domain];
      if (!d) continue;
      const dirSign = planetIndex % 2 === 0 ? 1 : -1;
      planetIndex += 1;
      const planetAnchor = anchorFor(d);
      list.forEach((n, i) => {
        if (positions.has(n.id)) return;
        const a = (2 * Math.PI * i) / Math.max(list.length, 1);
        positions.set(n.id, {
          cx: planetAnchor.x,
          cy: planetAnchor.y,
          radius: PLANET_NODE_RADIUS,
          angle: a,
          speed: PLANET_SPEED * dirSign,
          x: planetAnchor.x + Math.cos(a) * PLANET_NODE_RADIUS,
          y: planetAnchor.y + Math.sin(a) * PLANET_NODE_RADIUS,
          frozen: false,
        });
      });
    }
  }, [nodes, domains, layout, orbitalDomains]);

  // Wheel-to-zoom + drag-to-pan, attached non-passively so wheel preventDefault
  // works (React's onWheel is passive by default, can't preventDefault).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoom((z) => {
        const next = z * (1 + delta * 0.001);
        return Math.max(0.4, Math.min(3, next));
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Don't start a pan if the pointer is on a node — that's a drag-the-node
    // gesture and the node's own handler will set draggingRef.
    const target = e.target as Element | null;
    if (target?.closest("[data-nexus-node]")) return;
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pan: { ...pan },
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onCanvasPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = panStateRef.current;
    if (!p) return;
    setPan({
      x: p.pan.x + (e.clientX - p.startX),
      y: p.pan.y + (e.clientY - p.startY),
    });
  };

  const onCanvasPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    panStateRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Orbital motion loop: advance each node's angle and recompute its position.
  useEffect(() => {
    const positions = positionsRef.current;
    let last = performance.now();

    const step = (now: number) => {
      const dt = now - last;
      last = now;
      for (const o of positions.values()) {
        if (o.frozen) continue;
        if (o.radius === 0) {
          // Pinned at center (sun).
          o.x = o.cx;
          o.y = o.cy;
          continue;
        }
        o.angle += o.speed * dt;
        o.x = o.cx + Math.cos(o.angle) * o.radius;
        o.y = o.cy + Math.sin(o.angle) * o.radius;
      }
      setTick((t) => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
    const o = positionsRef.current.get(nodeId);
    if (o) o.frozen = true;
  };

  const onNodePointerMove = (
    e: React.PointerEvent<SVGGElement>,
    nodeId: string
  ) => {
    if (draggingRef.current !== nodeId) return;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const o = positionsRef.current.get(nodeId);
    if (!o) return;
    const dx = x - o.x;
    const dy = y - o.y;
    if (dx * dx + dy * dy > 4) setDidDrag(true);
    o.x = x;
    o.y = y;
  };

  const onNodePointerUp = (
    e: React.PointerEvent<SVGGElement>,
    nodeId: string
  ) => {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    if (draggingRef.current === nodeId) {
      draggingRef.current = null;
      const o = positionsRef.current.get(nodeId);
      if (o) {
        // Re-derive orbital radius and angle from drop position so the node
        // resumes orbiting from where it was let go.
        const dx = o.x - o.cx;
        const dy = o.y - o.cy;
        o.radius = Math.sqrt(dx * dx + dy * dy);
        o.angle = Math.atan2(dy, dx);
        o.frozen = false;
      }
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
    <div
      ref={containerRef}
      className="relative w-full h-[70vh] min-h-[500px] bg-[#05030a] border border-[var(--color-border-dark)] overflow-hidden select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <svg
        ref={svgRef}
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{
          touchAction: "none",
          filter: "saturate(1.35) brightness(1.2)",
          cursor: panStateRef.current ? "grabbing" : "grab",
        }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
      >
        <g
          transform={`translate(${pan.x / zoom} ${pan.y / zoom}) scale(${zoom})`}
        >
        <defs>
          {/* Halo gradients (broad atmospheric color wash). */}
          {domainList.map((d) => (
            <radialGradient
              key={`halo-${d.id}`}
              id={`halo-${d.id}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={d.color} stopOpacity="0.22" />
              <stop offset="60%" stopColor={d.color} stopOpacity="0.05" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0" />
            </radialGradient>
          ))}

          {/* Sphere gradients for visible planets — light side / dark side. */}
          {layout.planets.map((p) => (
            <radialGradient
              key={`planet-${p.id}`}
              id={`planet-${p.id}`}
              cx="32%"
              cy="28%"
              r="80%"
            >
              <stop offset="0%" stopColor={lighten(p.color, 0.55)} stopOpacity="1" />
              <stop offset="35%" stopColor={p.color} stopOpacity="1" />
              <stop offset="80%" stopColor={darken(p.color, 0.45)} stopOpacity="1" />
              <stop offset="100%" stopColor={darken(p.color, 0.75)} stopOpacity="1" />
            </radialGradient>
          ))}

          {/* Inner-shadow / terminator overlay per planet — sits on top of the
              body, casts the dark side at the bottom-right. */}
          {layout.planets.map((p) => (
            <radialGradient
              key={`shadow-${p.id}`}
              id={`shadow-${p.id}`}
              cx="75%"
              cy="78%"
              r="65%"
            >
              <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          ))}

          {/* Sun gradient — bright core fading to the brand-warm. */}
          <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8e1" stopOpacity="1" />
            <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric orbital rings — faint, like a star atlas. */}
        <g stroke="rgba(125,138,173,0.18)" strokeDasharray="3 6" fill="none">
          {layout.ringRadii.map((r) => (
            <circle key={`ring-${r}`} cx={0} cy={0} r={r} />
          ))}
        </g>

        {/* Atmospheric halos for each visible planet. */}
        <g>
          {layout.planets.map((p) => (
            <circle
              key={`halo-circle-${p.id}`}
              cx={p.x}
              cy={p.y}
              r={170}
              fill={`url(#halo-${p.id})`}
            />
          ))}
        </g>

        {/* The sun: Projects core at the origin. Smaller, no glow filter. */}
        <g>
          <circle cx={0} cy={0} r={70} fill="url(#sun-core)" opacity={0.85} />
          <circle cx={0} cy={0} r={14} fill="#fde68a" opacity={0.85} />
          <text
            x={0}
            y={-100}
            textAnchor="middle"
            fill="#fde68a"
            style={{
              fontFamily: "var(--font-display), Outfit, system-ui, sans-serif",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            Projects
          </text>
        </g>

        {/* Per-planet orbital path ring — shows where this planet's nodes orbit. */}
        <g fill="none" strokeDasharray="2 5">
          {layout.planets.map((p) => (
            <circle
              key={`orbit-${p.id}`}
              cx={p.x}
              cy={p.y}
              r={130}
              stroke={p.color}
              strokeOpacity={0.20}
              strokeWidth={1}
            />
          ))}
        </g>

        {/* Visible planets: layered shaded sphere with the category name
            embossed inside. */}
        <g>
          {layout.planets.map((p, idx) => {
            const r = 58;
            const { lines, fontSize, lineHeight } = fitPlanetLabel(
              p.label.toUpperCase(),
              r
            );
            // Saturn-style ring on every other planet for visual variety.
            const hasRing = idx % 2 === 0;
            return (
              <g key={`planet-g-${p.id}`}>
                {/* Atmospheric outer glow */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 14}
                  fill={p.color}
                  opacity={0.06}
                />
                {/* Optional Saturn-like ring (drawn behind the body) */}
                {hasRing && (
                  <ellipse
                    cx={p.x}
                    cy={p.y + 4}
                    rx={r + 22}
                    ry={9}
                    fill="none"
                    stroke={p.color}
                    strokeOpacity={0.30}
                    strokeWidth={1.5}
                    transform={`rotate(-12 ${p.x} ${p.y})`}
                  />
                )}
                {/* Planet body — radial-shaded sphere */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={`url(#planet-${p.id})`}
                  opacity={0.92}
                />
                {/* Inner shadow pass on the bottom-right (terminator hint) */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={`url(#shadow-${p.id})`}
                  style={{ pointerEvents: "none" }}
                />
                {/* Atmospheric rim — subtle bright ring on the top edge */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill="none"
                  stroke={lighten(p.color, 0.5)}
                  strokeOpacity={0.55}
                  strokeWidth={1.2}
                />
                {/* Front half of Saturn-ring (drawn ON TOP of body) */}
                {hasRing && (
                  <ellipse
                    cx={p.x}
                    cy={p.y + 4}
                    rx={r + 22}
                    ry={9}
                    fill="none"
                    stroke={p.color}
                    strokeOpacity={0.55}
                    strokeWidth={1.5}
                    strokeDasharray={`${(r + 22) * Math.PI * 0.8} 9999`}
                    transform={`rotate(-12 ${p.x} ${p.y})`}
                  />
                )}
                {/* Category label, centered INSIDE the planet */}
                <g style={{ pointerEvents: "none" }}>
                  <text
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    style={{
                      fontFamily:
                        "var(--font-display), Outfit, system-ui, sans-serif",
                      fontSize,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      paintOrder: "stroke fill",
                    }}
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth={2}
                    strokeLinejoin="round"
                  >
                    {lines.length === 1 ? (
                      lines[0]
                    ) : (
                      <>
                        <tspan
                          x={p.x}
                          dy={`-${(lineHeight / 2).toFixed(2)}`}
                        >
                          {lines[0]}
                        </tspan>
                        <tspan x={p.x} dy={`${lineHeight.toFixed(2)}`}>
                          {lines[1]}
                        </tspan>
                      </>
                    )}
                  </text>
                </g>
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
            const d = orbitalDomains[n.domain];
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
                  fill="#f0f4ff"
                  fontStyle={n.kind === "ghost" ? "italic" : "normal"}
                  style={{
                    fontFamily: "var(--font-display), Outfit, system-ui, sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    fontWeight: 500,
                    pointerEvents: "none",
                  }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 font-mono text-xs">
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
          aria-label="Zoom in"
          className="w-9 h-9 flex items-center justify-center text-[var(--color-dark)] glass-button text-base leading-none"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
          aria-label="Zoom out"
          className="w-9 h-9 flex items-center justify-center text-[var(--color-dark)] glass-button text-base leading-none"
        >
          −
        </button>
        <button
          onClick={resetView}
          aria-label="Reset view"
          className="w-9 h-9 flex items-center justify-center text-[var(--color-dark)] glass-button text-[10px] leading-none uppercase tracking-[0.05em]"
        >
          1:1
        </button>
      </div>

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
