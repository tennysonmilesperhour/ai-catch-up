"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type {
  DomainsRecord,
  NexusLink,
  NexusNode,
} from "@/components/admin/Nexus";
import { ActionButton, type Action } from "@/components/shared/ActionButton";
import { StepsModal } from "@/components/shared/StepsModal";
import { buildOrbitalLayout } from "@/lib/nexus-layout";

// three.js and the force graph library are heavy — lazy-load only when 3D
// mode is toggled on.
const ForceGraph3D = dynamic(
  () => import("react-force-graph-3d").then((m) => m.default),
  { ssr: false, loading: () => <LoadingCanvas /> }
);

type Props = {
  domains: DomainsRecord;
  nodes: NexusNode[];
  links: NexusLink[];
};

type GraphNode = {
  id: string;
  label: string;
  domain: string;
  kind: string;
  desc: string;
  color: string;
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
};

type GraphLink = {
  source: string;
  target: string;
  strength: number;
};

function brighten(hex: string, amount = 1.2): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function Nexus3D({ domains, nodes, links }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [selected, setSelected] = useState<NexusNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [stepsModalContent, setStepsModalContent] = useState<string | null>(
    null
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape closes the detail panel (parity with 2D pinned tooltip).
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const neighborsById = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of nodes) m.set(n.id, new Set());
    for (const l of links) {
      m.get(l.source)?.add(l.target);
      m.get(l.target)?.add(l.source);
    }
    return m;
  }, [nodes, links]);

  const graphData = useMemo(() => {
    const layout = buildOrbitalLayout(domains, nodes);
    const planetKeys = layout.planets.map((p) => p.id);
    // Give each planet a z-offset so the solar system reads as 3D, not flat.
    const planetZ = new Map<string, number>();
    planetKeys.forEach((k, i) => {
      const sign = i % 2 === 0 ? 1 : -1;
      const magnitude = 60 + (i % 3) * 30;
      planetZ.set(k, sign * magnitude);
    });

    const gNodes: GraphNode[] = nodes.map((n) => {
      const domain = layout.domains[n.domain];
      const base = domain?.color ?? "#fbbf24";
      const seeded = layout.initialPositions.get(n.id);
      const planetOffsetZ = planetZ.get(n.domain) ?? 0;
      return {
        id: n.id,
        label: n.label,
        domain: n.domain,
        kind: n.kind,
        desc: n.desc,
        color: brighten(base, 1.35),
        val: Math.max(2, n.weight ?? 3),
        x: seeded?.x ?? 0,
        y: seeded?.y ?? 0,
        z: planetOffsetZ + (Math.random() - 0.5) * 30,
        fx: seeded?.x,
        fy: seeded?.y,
      };
    });

    // Sun pseudo-node: huge golden sphere at the origin, locked in place.
    gNodes.push({
      id: "__sun__",
      label: "Projects",
      domain: "core",
      kind: "real",
      desc: "Projects core (Global Memory + your apps)",
      color: "#ffd966",
      val: 60,
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
    });

    // Planet pseudo-nodes: large shaded spheres at each outer-ring anchor,
    // labeled with the category name (visible on hover via nodeLabel).
    for (const p of layout.planets) {
      const z = planetZ.get(p.id) ?? 0;
      gNodes.push({
        id: `__planet_${p.id}__`,
        label: p.label,
        domain: p.id,
        kind: "real",
        desc: p.label,
        color: brighten(p.color, 1.25),
        val: 30,
        x: p.x,
        y: p.y,
        z,
        fx: p.x,
        fy: p.y,
      });
    }

    const nodeIds = new Set(gNodes.map((n) => n.id));
    const gLinks: GraphLink[] = links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
        strength: l.strength,
      }));
    return { nodes: gNodes, links: gLinks };
  }, [nodes, links, domains]);

  const hovered = hoveredId
    ? nodes.find((n) => n.id === hoveredId) || null
    : null;

  // "Context" node — either the pinned one (wins) or the hovered one.
  const focusId = selected?.id ?? hoveredId;
  const focusNeighbors = focusId ? neighborsById.get(focusId) : null;

  const getNodeColor = (raw: object): string => {
    const g = raw as GraphNode;
    if (!focusId) return g.color;
    if (g.id === focusId) return g.color;
    if (focusNeighbors?.has(g.id)) return g.color;
    // Dim unrelated nodes
    return dim(g.color, 0.22);
  };

  const getLinkColor = (raw: object): string => {
    const l = raw as { source: string | { id: string }; target: string | { id: string } };
    const sId = typeof l.source === "string" ? l.source : l.source.id;
    const tId = typeof l.target === "string" ? l.target : l.target.id;
    if (!focusId) return "rgba(245, 239, 224, 0.25)";
    if (sId === focusId || tId === focusId) return "#d97757";
    return "rgba(245, 239, 224, 0.06)";
  };

  const getLinkWidth = (raw: object): number => {
    const l = raw as { source: string | { id: string }; target: string | { id: string } };
    const sId = typeof l.source === "string" ? l.source : l.source.id;
    const tId = typeof l.target === "string" ? l.target : l.target.id;
    if (!focusId) return 0.8;
    if (sId === focusId || tId === focusId) return 2;
    return 0.6;
  };

  const tooltipNode = selected ?? hovered;

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] bg-[#05030a] border border-[var(--color-border-dark)] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0">
        <ForceGraph3D
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="#05030a"
          nodeLabel={(n: object) => (n as GraphNode).label}
          nodeColor={getNodeColor}
          nodeVal={(n: object) => (n as GraphNode).val}
          nodeOpacity={0.95}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkOpacity={0.7}
          linkDirectionalParticles={0}
          enableNodeDrag={true}
          onNodeHover={(n: object | null) => {
            const id = n ? (n as GraphNode).id : null;
            // Don't show hover details for sun/planet decorations.
            if (id && id.startsWith("__")) {
              setHoveredId(null);
              return;
            }
            setHoveredId(id);
          }}
          onNodeClick={(n: object) => {
            const g = n as GraphNode;
            if (g.id.startsWith("__")) return;
            const original = nodes.find((x) => x.id === g.id);
            if (original) setSelected(original);
          }}
          onBackgroundClick={() => setSelected(null)}
        />
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)] pointer-events-none">
        <p>Click-drag: rotate</p>
        <p>Scroll: zoom</p>
        <p>Click node: details</p>
      </div>

      {tooltipNode && (
        <DetailPanel
          node={tooltipNode}
          domain={domains[tooltipNode.domain]}
          pinned={!!selected}
          onClose={() => setSelected(null)}
          onViewSteps={(payload) => {
            setStepsModalContent(payload);
            setSelected(null);
            setHoveredId(null);
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

function LoadingCanvas() {
  return (
    <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] font-mono text-xs uppercase tracking-[0.1em]">
      Loading 3D view...
    </div>
  );
}

function dim(hex: string, amount = 0.22): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * amount);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * amount);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function DetailPanel({
  node,
  domain,
  pinned,
  onClose,
  onViewSteps,
}: {
  node: NexusNode;
  domain: { label: string; color: string } | undefined;
  pinned: boolean;
  onClose: () => void;
  onViewSteps: (payload: string) => void;
}) {
  const accent = brighten(domain?.color ?? "#d97757", 1.35);
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
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        maxWidth: 320,
        background: "rgba(5, 3, 10, 0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "16px 18px",
        border: `1px solid ${accent}`,
        borderLeft: `3px solid ${accent}`,
        pointerEvents: pinned || hasActions ? "auto" : "none",
        zIndex: 10,
        boxShadow: pinned
          ? "0 8px 28px rgba(0, 0, 0, 0.65)"
          : "0 4px 20px rgba(0, 0, 0, 0.45)",
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
          color: accent,
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
      {hasActions && node.actions && pinned && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${accent}40`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {node.actions.map((action, i) => (
            <ActionButton
              key={i}
              action={action as Action}
              accentColor={accent}
              onViewSteps={onViewSteps}
            />
          ))}
        </div>
      )}
      {hasActions && !pinned && (
        <p
          style={{
            fontSize: 10,
            color: "#5a4f43",
            marginTop: 10,
            fontFamily: "ui-monospace, Menlo, monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Click node to unlock actions
        </p>
      )}
      {!hasActions && pinned && (node.github || node.homepage) && (
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
}
