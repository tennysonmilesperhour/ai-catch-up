/**
 * SVG gradient definitions for Nexus planets and the central sun.
 *
 * The reference look (Tennyson's "planets aesthetic wallpaper" board)
 * is photographic: rich multi-stop radial textures, off-center hot
 * spots, painterly cloud bands. We approximate that in pure SVG with
 * a hand-tuned palette of 12 planet textures + 1 sun texture, each
 * built from a primary radialGradient (3D sphere look) and an
 * optional bands linearGradient overlay (gas-giant feel).
 *
 * Usage in Nexus.tsx:
 *   <PlanetTextureDefs />          // drop inside <defs>
 *   const id = planetTextureFor(node.id);
 *   <circle fill={`url(#${id})`} />
 */

import { type ReactElement } from "react";

export const SUN_TEXTURE_ID = "nx-sun-fire";

type PlanetTexture = {
  id: string;
  /** Body radial gradient stops (offset → color). */
  body: Array<{ offset: string; color: string; opacity?: number }>;
  /** Center of the gradient: offset toward the lit side. */
  center: { cx: string; cy: string; r: string };
  /** Optional gas-giant-style horizontal band overlay. */
  bands?: Array<{ offset: string; color: string; opacity: number }>;
  /** Optional thin atmospheric rim (stroke at the edge). */
  rim?: { color: string; opacity: number };
};

const PLANET_TEXTURES: PlanetTexture[] = [
  {
    id: "nx-pink-marble",
    center: { cx: "32%", cy: "28%", r: "78%" },
    body: [
      { offset: "0%", color: "#fff0f6" },
      { offset: "30%", color: "#ff9ec5" },
      { offset: "65%", color: "#d24a8a" },
      { offset: "100%", color: "#5a1a3a" },
    ],
    rim: { color: "#2a0a1c", opacity: 0.55 },
  },
  {
    id: "nx-alien-rainbow",
    center: { cx: "38%", cy: "34%", r: "80%" },
    body: [
      { offset: "0%", color: "#ffeebb" },
      { offset: "20%", color: "#5fffd7" },
      { offset: "45%", color: "#5b8cff" },
      { offset: "70%", color: "#ff5fb3" },
      { offset: "100%", color: "#1a0e3a" },
    ],
    rim: { color: "#0a0220", opacity: 0.6 },
  },
  {
    id: "nx-mercury-cratered",
    center: { cx: "32%", cy: "26%", r: "82%" },
    body: [
      { offset: "0%", color: "#f6e2c0" },
      { offset: "30%", color: "#c19a72" },
      { offset: "60%", color: "#7a5a3e" },
      { offset: "100%", color: "#1c1208" },
    ],
    rim: { color: "#0a0604", opacity: 0.55 },
  },
  {
    id: "nx-pink-jupiter",
    center: { cx: "30%", cy: "30%", r: "80%" },
    body: [
      { offset: "0%", color: "#ffd4e5" },
      { offset: "30%", color: "#ff7eb6" },
      { offset: "65%", color: "#c34890" },
      { offset: "100%", color: "#3a0e2a" },
    ],
    bands: [
      { offset: "0%", color: "#ffffff", opacity: 0 },
      { offset: "20%", color: "#ffffff", opacity: 0.18 },
      { offset: "30%", color: "#ffffff", opacity: 0 },
      { offset: "50%", color: "#ffffff", opacity: 0.16 },
      { offset: "60%", color: "#ffffff", opacity: 0 },
      { offset: "80%", color: "#ffffff", opacity: 0.14 },
      { offset: "100%", color: "#ffffff", opacity: 0 },
    ],
    rim: { color: "#1a0612", opacity: 0.5 },
  },
  {
    id: "nx-gas-blue",
    center: { cx: "34%", cy: "28%", r: "82%" },
    body: [
      { offset: "0%", color: "#e8fbff" },
      { offset: "25%", color: "#7fdcff" },
      { offset: "55%", color: "#3a78c8" },
      { offset: "85%", color: "#1c3868" },
      { offset: "100%", color: "#06101e" },
    ],
    bands: [
      { offset: "0%", color: "#ffffff", opacity: 0 },
      { offset: "25%", color: "#ffffff", opacity: 0.20 },
      { offset: "35%", color: "#ffffff", opacity: 0 },
      { offset: "55%", color: "#ffffff", opacity: 0.16 },
      { offset: "70%", color: "#ffffff", opacity: 0 },
      { offset: "100%", color: "#ffffff", opacity: 0 },
    ],
    rim: { color: "#02060e", opacity: 0.6 },
  },
  {
    id: "nx-mars-red",
    center: { cx: "30%", cy: "28%", r: "80%" },
    body: [
      { offset: "0%", color: "#ffd5b5" },
      { offset: "30%", color: "#e57b3a" },
      { offset: "65%", color: "#9c3a1a" },
      { offset: "100%", color: "#2a0a04" },
    ],
    rim: { color: "#1a0500", opacity: 0.55 },
  },
  {
    id: "nx-coral",
    center: { cx: "35%", cy: "30%", r: "78%" },
    body: [
      { offset: "0%", color: "#fff2e6" },
      { offset: "30%", color: "#ff8a78" },
      { offset: "65%", color: "#c14860" },
      { offset: "100%", color: "#3a0e1c" },
    ],
    rim: { color: "#1a040a", opacity: 0.55 },
  },
  {
    id: "nx-rose-marble",
    center: { cx: "30%", cy: "32%", r: "78%" },
    body: [
      { offset: "0%", color: "#fff5fa" },
      { offset: "25%", color: "#ffa8d4" },
      { offset: "55%", color: "#a45fa8" },
      { offset: "100%", color: "#2a0e3a" },
    ],
    rim: { color: "#10051a", opacity: 0.55 },
  },
  {
    id: "nx-lavender-ice",
    center: { cx: "30%", cy: "26%", r: "82%" },
    body: [
      { offset: "0%", color: "#ffffff" },
      { offset: "30%", color: "#dcd2ff" },
      { offset: "65%", color: "#9a86d8" },
      { offset: "100%", color: "#1c1240" },
    ],
    rim: { color: "#0a0420", opacity: 0.5 },
  },
  {
    id: "nx-aurora",
    center: { cx: "40%", cy: "32%", r: "84%" },
    body: [
      { offset: "0%", color: "#fffaee" },
      { offset: "20%", color: "#ff8ade" },
      { offset: "50%", color: "#5fffd7" },
      { offset: "80%", color: "#3a4ec0" },
      { offset: "100%", color: "#0a0820" },
    ],
    rim: { color: "#04020e", opacity: 0.6 },
  },
  {
    id: "nx-gold-jupiter",
    center: { cx: "34%", cy: "30%", r: "82%" },
    body: [
      { offset: "0%", color: "#fff6d0" },
      { offset: "25%", color: "#ffd060" },
      { offset: "55%", color: "#c8893a" },
      { offset: "85%", color: "#5c3818" },
      { offset: "100%", color: "#1a0c04" },
    ],
    bands: [
      { offset: "0%", color: "#ffffff", opacity: 0 },
      { offset: "20%", color: "#ffffff", opacity: 0.22 },
      { offset: "30%", color: "#ffffff", opacity: 0 },
      { offset: "55%", color: "#ffffff", opacity: 0.18 },
      { offset: "65%", color: "#ffffff", opacity: 0 },
      { offset: "80%", color: "#ffffff", opacity: 0.14 },
      { offset: "100%", color: "#ffffff", opacity: 0 },
    ],
    rim: { color: "#0e0602", opacity: 0.55 },
  },
  {
    id: "nx-dusty-rose",
    center: { cx: "30%", cy: "32%", r: "80%" },
    body: [
      { offset: "0%", color: "#fce6e0" },
      { offset: "30%", color: "#d49aa0" },
      { offset: "65%", color: "#8a4a60" },
      { offset: "100%", color: "#28101c" },
    ],
    rim: { color: "#0e0610", opacity: 0.5 },
  },
];

/** FNV-1a 32-bit hash. Stable across runs and platforms. */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic mapping: same node id always returns the same texture. */
export function planetTextureFor(nodeId: string): string {
  const idx = hashId(nodeId) % PLANET_TEXTURES.length;
  return PLANET_TEXTURES[idx].id;
}

/** Drop inside the <defs> block of Nexus.tsx. */
export function PlanetTextureDefs(): ReactElement {
  return (
    <>
      {PLANET_TEXTURES.map((t) => (
        <radialGradient
          key={t.id}
          id={t.id}
          cx={t.center.cx}
          cy={t.center.cy}
          r={t.center.r}
          fx={t.center.cx}
          fy={t.center.cy}
        >
          {t.body.map((s, i) => (
            <stop
              key={i}
              offset={s.offset}
              stopColor={s.color}
              stopOpacity={s.opacity ?? 1}
            />
          ))}
        </radialGradient>
      ))}

      {PLANET_TEXTURES.filter((t) => t.bands).map((t) => (
        <linearGradient
          key={`${t.id}-bands`}
          id={`${t.id}-bands`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          {t.bands!.map((s, i) => (
            <stop
              key={i}
              offset={s.offset}
              stopColor={s.color}
              stopOpacity={s.opacity}
            />
          ))}
        </linearGradient>
      ))}

      {/* Central sun: bright white core, yellow mid, orange-red outer. */}
      <radialGradient
        id={SUN_TEXTURE_ID}
        cx="50%"
        cy="50%"
        r="65%"
        fx="50%"
        fy="50%"
      >
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="20%" stopColor="#fff4c2" />
        <stop offset="55%" stopColor="#ffb04c" />
        <stop offset="85%" stopColor="#e8651a" />
        <stop offset="100%" stopColor="#7a1e08" />
      </radialGradient>
    </>
  );
}

/** Look up whether a planet texture has bands (for the overlay layer). */
export function planetTextureHasBands(textureId: string): boolean {
  return PLANET_TEXTURES.some((t) => t.id === textureId && Boolean(t.bands));
}

/** Look up the rim color/opacity for a texture id (or null). */
export function planetTextureRim(
  textureId: string
): { color: string; opacity: number } | null {
  const t = PLANET_TEXTURES.find((x) => x.id === textureId);
  return t?.rim ?? null;
}
