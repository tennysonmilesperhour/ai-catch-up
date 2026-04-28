/**
 * SVG pattern fills for Nexus planets and the central sun, using
 * photographic disc images.
 *
 * Source: equirectangular planet maps from threex.planets (Jerome
 * Etienne, derived from public-domain NASA imagery), projected to
 * 256×256 RGBA discs by `scripts/build-planet-discs.mjs`. Output PNGs
 * live in `/public/bg/planets/`.
 *
 * Public API matches the previous radial-gradient version so Nexus.tsx
 * does not need to change:
 *   <PlanetTextureDefs />          // drop inside <defs>
 *   const id = planetTextureFor(node.id);
 *   <circle fill={`url(#${id})`} />
 *
 * planetTextureHasBands() always returns false now (band overlays
 * aren't needed — the photo has bands baked in). planetTextureRim()
 * always returns null (limb darkening is in the rendered disc).
 */

import { type ReactElement } from "react";

export const SUN_TEXTURE_ID = "nx-tex-sun";

const PLANET_TEXTURES: Array<{ id: string; image: string }> = [
  { id: "nx-tex-mercury", image: "/bg/planets/mercury.png" },
  { id: "nx-tex-venus",   image: "/bg/planets/venus.png" },
  { id: "nx-tex-earth",   image: "/bg/planets/earth.png" },
  { id: "nx-tex-mars",    image: "/bg/planets/mars.png" },
  { id: "nx-tex-jupiter", image: "/bg/planets/jupiter.png" },
  { id: "nx-tex-saturn",  image: "/bg/planets/saturn.png" },
  { id: "nx-tex-uranus",  image: "/bg/planets/uranus.png" },
  { id: "nx-tex-neptune", image: "/bg/planets/neptune.png" },
  { id: "nx-tex-moon",    image: "/bg/planets/moon.png" },
];

const SUN = { id: SUN_TEXTURE_ID, image: "/bg/planets/sun.png" };

/** FNV-1a 32-bit hash. Stable across runs and platforms. */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic mapping: same node id always returns the same disc. */
export function planetTextureFor(nodeId: string): string {
  const idx = hashId(nodeId) % PLANET_TEXTURES.length;
  return PLANET_TEXTURES[idx].id;
}

/** Drop inside the <defs> block of Nexus.tsx. */
export function PlanetTextureDefs(): ReactElement {
  return (
    <>
      {PLANET_TEXTURES.map((t) => (
        <pattern
          key={t.id}
          id={t.id}
          patternUnits="objectBoundingBox"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <image
            href={t.image}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      ))}
      <pattern
        id={SUN.id}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <image
          href={SUN.image}
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="xMidYMid slice"
        />
      </pattern>
    </>
  );
}

/** Photo discs already include band detail; SVG band overlays are unused. */
export function planetTextureHasBands(_textureId: string): boolean {
  return false;
}

/** Photo discs already include limb darkening; SVG rim strokes are unused. */
export function planetTextureRim(
  _textureId: string
): { color: string; opacity: number } | null {
  return null;
}
