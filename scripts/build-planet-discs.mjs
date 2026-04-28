/**
 * Build planet disc PNGs from equirectangular planet maps.
 *
 * Sources: threex.planets (Jerome Etienne) — texture files originally
 * derived from public-domain NASA imagery. We download each map to
 * /tmp, then project onto a sphere using orthographic projection
 * (the view of a sphere from infinity, which is what a planet looks
 * like from far away), and write a 512×512 RGBA PNG to
 * /public/bg/planets/.
 *
 * Run once:
 *   node scripts/build-planet-discs.mjs
 *
 * Re-run only if you want different source textures or output sizes.
 * The output PNGs are committed to the repo so production deploys
 * don't need to do this work.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT_DIR = "public/bg/planets";
const SIZE = 256;
const TMP_DIR = "/tmp/planet-src";

const PLANETS = [
  { name: "mercury", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg" },
  { name: "venus", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg" },
  { name: "earth", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg" },
  { name: "mars", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg" },
  { name: "jupiter", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg" },
  { name: "saturn", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg" },
  { name: "uranus", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg" },
  { name: "neptune", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg" },
  { name: "moon", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg" },
  { name: "sun", url: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/sunmap.jpg" },
];

async function ensureDir(path) {
  if (!existsSync(path)) await mkdir(path, { recursive: true });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

/**
 * Orthographic projection of an equirectangular source to a circle disc.
 *
 *   For each output pixel (px, py):
 *     1. Map to normalized sphere coords nx, ny in [-1, 1].
 *     2. Skip pixels outside the unit circle (alpha = 0).
 *     3. Compute the 3D surface point on the front hemisphere:
 *          z = sqrt(1 - nx² - ny²)
 *     4. Convert (nx, ny, z) → (lat, lon).
 *     5. Sample the equirectangular source at the matching uv.
 *
 * Adds a soft limb-darkening pass and a specular highlight in the
 * upper-left for "lit from above-left" sphere readability.
 */
async function projectToDisc(srcPath, outPath, name) {
  const src = sharp(srcPath);
  const meta = await src.metadata();
  const sw = meta.width;
  const sh = meta.height;
  const srcRaw = await src
    .removeAlpha()
    .raw()
    .toBuffer();

  const out = Buffer.alloc(SIZE * SIZE * 4);
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = SIZE / 2 - 1;

  // Light direction (upper-left). Used for limb darkening shading.
  const LX = -0.5;
  const LY = -0.45;
  const LZ = 0.74; // unit-ish

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const dx = (px - cx) / r;
      const dy = (py - cy) / r;
      const d2 = dx * dx + dy * dy;
      const oi = (py * SIZE + px) * 4;
      if (d2 > 1) {
        // Outside the disc — fully transparent.
        out[oi + 3] = 0;
        continue;
      }
      const z = Math.sqrt(1 - d2);
      // 3D point on the unit sphere = (dx, dy, z) where dy points down
      // in image coords. Latitude is asin(-dy) so up = positive lat.
      const lat = Math.asin(-dy); // -π/2 .. π/2
      const lon = Math.atan2(dx, z); // -π/2 .. π/2 (front hemisphere)
      // Sample equirectangular: u in 0..1 maps lon -π..π, v 0..1 maps
      // lat π/2..-π/2. We slide lon by π/2 so the visible chunk is
      // a recognisable face (different per-planet rotation isn't worth
      // the extra controls right now).
      let u = lon / (2 * Math.PI) + 0.5;
      let v = 0.5 - lat / Math.PI;
      u = Math.max(0, Math.min(0.999, u));
      v = Math.max(0, Math.min(0.999, v));
      const sx = Math.floor(u * sw);
      const sy = Math.floor(v * sh);
      const si = (sy * sw + sx) * 3;
      let r8 = srcRaw[si];
      let g8 = srcRaw[si + 1];
      let b8 = srcRaw[si + 2];
      // Lambertian shading using surface normal (dx, -dy, z).
      const nx = dx;
      const ny = -dy;
      const nz = z;
      let lambert = nx * LX + ny * LY + nz * LZ;
      lambert = Math.max(0, Math.min(1, lambert));
      // Mix: 70% true color, 30% shaded by lambert (avoid going pitch
      // black on the night side — keep some ambient).
      const shade = 0.55 + 0.45 * lambert;
      r8 = Math.min(255, Math.round(r8 * shade));
      g8 = Math.min(255, Math.round(g8 * shade));
      b8 = Math.min(255, Math.round(b8 * shade));
      // Soft alpha rolloff at the very edge to anti-alias the limb.
      const edge = Math.min(1, (1 - Math.sqrt(d2)) * 24);
      const alpha = Math.round(255 * Math.max(0, Math.min(1, edge)));
      out[oi + 0] = r8;
      out[oi + 1] = g8;
      out[oi + 2] = b8;
      out[oi + 3] = alpha;
    }
  }

  await sharp(out, {
    raw: { width: SIZE, height: SIZE, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`  ✓ ${name} → ${outPath}`);
}

async function main() {
  await ensureDir(TMP_DIR);
  await ensureDir(OUT_DIR);

  for (const p of PLANETS) {
    const tmp = join(TMP_DIR, `${p.name}.jpg`);
    if (!existsSync(tmp)) {
      const bytes = await download(p.url, tmp);
      console.log(`  ↓ ${p.name} (${bytes} bytes)`);
    }
    await projectToDisc(tmp, join(OUT_DIR, `${p.name}.png`), p.name);
  }
  console.log(`done. wrote ${PLANETS.length} discs to ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
