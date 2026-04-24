"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type {
  DomainsRecord,
  NexusLink,
  NexusNode,
} from "@/components/admin/Nexus";

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

  // Observe container size so the canvas fills its box on resize.
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

  const graphData = useMemo(() => {
    const gNodes: GraphNode[] = nodes.map((n) => {
      const domain = domains[n.domain];
      const base = domain?.color ?? "#d97757";
      return {
        id: n.id,
        label: n.label,
        domain: n.domain,
        kind: n.kind,
        desc: n.desc,
        color: brighten(base, 1.35),
        val: Math.max(2, n.weight ?? 3),
      };
    });
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

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] bg-[#05030a] border border-[var(--color-border-dark)] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0">
        <ForceGraph3D
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="#05030a"
          nodeLabel={(n: object) => (n as GraphNode).label}
          nodeColor={(n: object) => (n as GraphNode).color}
          nodeVal={(n: object) => (n as GraphNode).val}
          nodeOpacity={0.95}
          linkColor={() => "rgba(245, 239, 224, 0.25)"}
          linkWidth={0.8}
          linkOpacity={0.6}
          linkDirectionalParticles={0}
          enableNodeDrag={true}
          onNodeClick={(n: object) => {
            const g = n as GraphNode;
            const original = nodes.find((x) => x.id === g.id);
            if (original) setSelected(original);
          }}
        />
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)] pointer-events-none">
        <p>Click-drag: rotate</p>
        <p>Scroll: zoom</p>
        <p>Right-drag: pan</p>
      </div>

      {selected && (
        <div
          className="absolute top-4 right-4 max-w-xs bg-[rgba(10,8,12,0.95)] border border-[var(--color-border-dark)] p-4 text-[var(--color-cream)]"
          style={{
            borderLeft: `3px solid ${brighten(
              domains[selected.domain]?.color ?? "#d97757",
              1.35
            )}`,
          }}
        >
          <div className="flex justify-between items-start gap-3 mb-2">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.12em]"
              style={{
                color: brighten(
                  domains[selected.domain]?.color ?? "#d97757",
                  1.35
                ),
              }}
            >
              {domains[selected.domain]?.label ?? selected.domain}
            </p>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="text-[var(--color-muted)] hover:text-[var(--color-cream)] font-mono text-sm leading-none"
            >
              &times;
            </button>
          </div>
          <h3 className="font-serif text-lg mb-2 leading-tight">
            {selected.label}
          </h3>
          <p className="text-[var(--color-cream)]/80 text-sm leading-relaxed">
            {selected.desc}
          </p>
        </div>
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
