// Solar-system layout for the Nexus: the Global Memory core sits at the
// origin, the apps domain hugs the center as the inner ring, and every other
// domain ("planet") is placed evenly around an outer circle. Each node is
// pre-positioned in a tight orbit around its planet.

import type {
  DomainsRecord,
  NexusNode,
} from "@/components/admin/Nexus";

const PLANET_RADIUS = 540; // distance from origin to outer planet anchors
const APPS_INNER_RADIUS = 80; // node ring around the central apps anchor
const APPS_MID_RADIUS = 170; // ring for ghost / non-priority apps
const PLANET_NODE_RADIUS = 95; // node ring around each outer planet

const APPS = "apps";
const CORE = "core";

export type OrbitalLayout = {
  domains: DomainsRecord;
  initialPositions: Map<string, { x: number; y: number }>;
};

export function buildOrbitalLayout(
  domains: DomainsRecord,
  nodes: NexusNode[]
): OrbitalLayout {
  const planets = Object.keys(domains).filter(
    (k) => k !== CORE && k !== APPS
  );
  const angleStep = (2 * Math.PI) / Math.max(planets.length, 1);

  const newDomains: DomainsRecord = { ...domains };
  if (newDomains[CORE]) {
    newDomains[CORE] = {
      ...newDomains[CORE],
      anchor: { x: 0, y: 0 },
    };
  }
  if (newDomains[APPS]) {
    newDomains[APPS] = {
      ...newDomains[APPS],
      anchor: { x: 0, y: 0 },
    };
  }
  planets.forEach((key, i) => {
    // Start at the top (-Pi/2) and step clockwise.
    const angle = -Math.PI / 2 + i * angleStep;
    newDomains[key] = {
      ...domains[key],
      anchor: {
        x: Math.cos(angle) * PLANET_RADIUS,
        y: Math.sin(angle) * PLANET_RADIUS,
      },
    };
  });

  // Group nodes by domain and pre-position them around their anchor.
  const byDomain = new Map<string, NexusNode[]>();
  for (const n of nodes) {
    if (!byDomain.has(n.domain)) byDomain.set(n.domain, []);
    byDomain.get(n.domain)!.push(n);
  }

  const initialPositions = new Map<string, { x: number; y: number }>();
  for (const [domain, list] of byDomain.entries()) {
    const anchor = newDomains[domain]?.anchor ?? { x: 0, y: 0 };

    if (domain === APPS) {
      // Within the apps domain we further split: real / high-priority projects
      // live on the inner ring, others (evil-brian, contact-lens, etc.) get
      // pushed to the mid orbit so they read as "adjacent, not central".
      const inner = list.filter(
        (n) => n.kind === "real" || (n.kind === "ghost" && n.priority === "high")
      );
      const mid = list.filter(
        (n) => !(n.kind === "real" || (n.kind === "ghost" && n.priority === "high"))
      );
      inner.forEach((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(inner.length, 1) - Math.PI / 2;
        initialPositions.set(n.id, {
          x: anchor.x + Math.cos(a) * APPS_INNER_RADIUS,
          y: anchor.y + Math.sin(a) * APPS_INNER_RADIUS,
        });
      });
      mid.forEach((n, i) => {
        const a =
          (2 * Math.PI * i) / Math.max(mid.length, 1) -
          Math.PI / 2 +
          Math.PI / 4;
        initialPositions.set(n.id, {
          x: anchor.x + Math.cos(a) * APPS_MID_RADIUS,
          y: anchor.y + Math.sin(a) * APPS_MID_RADIUS,
        });
      });
      continue;
    }

    if (domain === CORE) {
      // The core typically has only the Global Memory ghost. Pin it to origin.
      list.forEach((n) => initialPositions.set(n.id, { x: 0, y: 0 }));
      continue;
    }

    // Planet domains: circle of nodes around the anchor.
    list.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(list.length, 1);
      initialPositions.set(n.id, {
        x: anchor.x + Math.cos(a) * PLANET_NODE_RADIUS,
        y: anchor.y + Math.sin(a) * PLANET_NODE_RADIUS,
      });
    });
  }

  return { domains: newDomains, initialPositions };
}
