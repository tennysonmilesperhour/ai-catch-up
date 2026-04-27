// Solar-system layout for the Nexus.
//
//   Sun        = the core domain (Global Memory) at the origin
//   Inner ring = apps domain (web-app projects), tight orbit around the sun
//   Mid ring   = orphan-domain nodes (any domain with only 1 node) at a
//                ring further out than projects but closer than the planets
//   Planets    = each multi-node domain placed evenly on an outer circle
//                with its own nodes orbiting it
//
// Returns the visible-planet anchors AND per-node initial positions.

import type {
  DomainsRecord,
  NexusNode,
} from "@/components/admin/Nexus";

const PLANET_RADIUS = 560;        // distance from origin to outer planet anchors
const PLANET_NODE_RADIUS = 110;   // node ring around each outer planet
const APPS_INNER_RADIUS = 90;     // tight inner ring (real / high-priority apps)
const APPS_MID_RADIUS = 175;      // wider apps ring (other apps)
const ORPHAN_RING_RADIUS = 290;   // single-node orphans live here
const ORPHAN_THRESHOLD = 1;        // domains with at-most this many nodes are orphans

const APPS = "apps";
const CORE = "core";

export type PlanetSpec = {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  /** True if this domain has its own visible planet rendered. */
  hasPlanet: boolean;
};

export type OrbitalLayout = {
  /** Domains record with anchors moved to orbital positions. */
  domains: DomainsRecord;
  /** Per-node initial positions seeded from the orbital layout. */
  initialPositions: Map<string, { x: number; y: number }>;
  /** Visible planets (multi-node outer-ring domains only). */
  planets: PlanetSpec[];
  /** Radii for the concentric orbit rings the renderer should draw. */
  ringRadii: number[];
};

export function buildOrbitalLayout(
  domains: DomainsRecord,
  nodes: NexusNode[]
): OrbitalLayout {
  // Bucket nodes by domain to figure out which domains are populated enough
  // to deserve a planet vs which should be treated as orphans.
  const byDomain = new Map<string, NexusNode[]>();
  for (const n of nodes) {
    if (!byDomain.has(n.domain)) byDomain.set(n.domain, []);
    byDomain.get(n.domain)!.push(n);
  }

  const planetDomains: string[] = [];
  const orphanDomains: string[] = [];
  for (const key of Object.keys(domains)) {
    if (key === CORE || key === APPS) continue;
    const count = byDomain.get(key)?.length ?? 0;
    if (count > ORPHAN_THRESHOLD) planetDomains.push(key);
    else orphanDomains.push(key);
  }

  // Place each planet evenly around an outer circle, starting at top.
  const newDomains: DomainsRecord = { ...domains };
  if (newDomains[CORE]) {
    newDomains[CORE] = { ...newDomains[CORE], anchor: { x: 0, y: 0 } };
  }
  if (newDomains[APPS]) {
    newDomains[APPS] = { ...newDomains[APPS], anchor: { x: 0, y: 0 } };
  }

  const planetSpecs: PlanetSpec[] = [];
  const angleStep = (2 * Math.PI) / Math.max(planetDomains.length, 1);
  planetDomains.forEach((key, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = Math.cos(angle) * PLANET_RADIUS;
    const y = Math.sin(angle) * PLANET_RADIUS;
    newDomains[key] = { ...domains[key], anchor: { x, y } };
    planetSpecs.push({
      id: key,
      label: domains[key]?.label ?? key,
      color: domains[key]?.color ?? "#fbbf24",
      x,
      y,
      hasPlanet: true,
    });
  });

  // Orphan domains — their (single) node sits on the mid-ring, anchor lives
  // there too so the simulation pulls the node into place.
  const orphanCount = orphanDomains.reduce(
    (sum, k) => sum + (byDomain.get(k)?.length ?? 0),
    0
  );
  let orphanIndex = 0;
  for (const key of orphanDomains) {
    const list = byDomain.get(key) ?? [];
    if (list.length === 0) {
      // No nodes at all; just pin the anchor somewhere on the ring so halo
      // gradients don't pile on the origin.
      newDomains[key] = {
        ...domains[key],
        anchor: { x: ORPHAN_RING_RADIUS, y: 0 },
      };
      continue;
    }
    list.forEach((n) => {
      const angle =
        -Math.PI / 2 +
        Math.PI / 4 + // offset so orphans don't stack on top of an apps node
        (2 * Math.PI * orphanIndex) / Math.max(orphanCount, 1);
      const x = Math.cos(angle) * ORPHAN_RING_RADIUS;
      const y = Math.sin(angle) * ORPHAN_RING_RADIUS;
      // Anchor the domain at the first orphan-node position; subsequent
      // nodes will simply share it. There is at most ORPHAN_THRESHOLD per
      // domain so this is fine.
      newDomains[key] = { ...domains[key], anchor: { x, y } };
      orphanIndex += 1;
    });
  }

  // Build per-node initial positions.
  const initialPositions = new Map<string, { x: number; y: number }>();
  for (const [domain, list] of byDomain.entries()) {
    if (domain === CORE) {
      list.forEach((n) => initialPositions.set(n.id, { x: 0, y: 0 }));
      continue;
    }
    if (domain === APPS) {
      const inner = list.filter(
        (n) => n.kind === "real" || (n.kind === "ghost" && n.priority === "high")
      );
      const mid = list.filter(
        (n) => !(n.kind === "real" || (n.kind === "ghost" && n.priority === "high"))
      );
      inner.forEach((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(inner.length, 1) - Math.PI / 2;
        initialPositions.set(n.id, {
          x: Math.cos(a) * APPS_INNER_RADIUS,
          y: Math.sin(a) * APPS_INNER_RADIUS,
        });
      });
      mid.forEach((n, i) => {
        const a =
          (2 * Math.PI * i) / Math.max(mid.length, 1) -
          Math.PI / 2 +
          Math.PI / 4;
        initialPositions.set(n.id, {
          x: Math.cos(a) * APPS_MID_RADIUS,
          y: Math.sin(a) * APPS_MID_RADIUS,
        });
      });
      continue;
    }
    if (orphanDomains.includes(domain)) {
      // Use the anchor position we just computed for this orphan domain.
      const anchor = newDomains[domain]?.anchor ?? { x: ORPHAN_RING_RADIUS, y: 0 };
      list.forEach((n, i) => {
        // If multiple orphan nodes share a domain (rare), spread them lightly.
        const a = (2 * Math.PI * i) / Math.max(list.length, 1);
        const r = list.length > 1 ? 25 : 0;
        initialPositions.set(n.id, {
          x: anchor.x + Math.cos(a) * r,
          y: anchor.y + Math.sin(a) * r,
        });
      });
      continue;
    }
    // Planet domain: ring of nodes around the planet anchor.
    const anchor = newDomains[domain]?.anchor ?? { x: 0, y: 0 };
    list.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(list.length, 1);
      initialPositions.set(n.id, {
        x: anchor.x + Math.cos(a) * PLANET_NODE_RADIUS,
        y: anchor.y + Math.sin(a) * PLANET_NODE_RADIUS,
      });
    });
  }

  return {
    domains: newDomains,
    initialPositions,
    planets: planetSpecs,
    ringRadii: [APPS_INNER_RADIUS, APPS_MID_RADIUS, ORPHAN_RING_RADIUS, PLANET_RADIUS],
  };
}
