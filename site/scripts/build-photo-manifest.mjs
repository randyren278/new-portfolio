#!/usr/bin/env node
/**
 * Validates canonical public/photos/photo-NN.jpg derivatives, extracts width,
 * height, average color, and a five-tone palette, then writes
 * src/bento/photos.manifest.json.
 *
 * Run manually after adding/removing/replacing photos:
 *   pnpm build:photos
 *
 * The manifest is checked into the repo — this script is not part of
 * `pnpm build` because photo drops are infrequent and the manifest is
 * small enough that regenerating on every CI build would burn more time than
 * it saves.
 */

import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const PHOTOS_DIR = join(process.cwd(), 'public', 'photos');
const OUT_PATH = join(process.cwd(), 'src', 'bento', 'photos.manifest.json');

// sRGB [0..255] → HSL where h ∈ [0..360), s,l ∈ [0..100].
// Standard formula; nothing exotic.
function rgbToHsl(r, g, b) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN:
        h = (gN - bN) / d + (gN < bN ? 6 : 0);
        break;
      case gN:
        h = (bN - rN) / d + 2;
        break;
      default:
        h = (rN - gN) / d + 4;
    }
    h *= 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

const hex = (r, g, b) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/**
 * k-means over a downsampled pixel set → the N most-occupied colors, each
 * with the share of the frame it covers. The average color (above) answers
 * "what hue is this photo"; this answers "what is its palette", which is
 * what the photo card's verso actually shows.
 *
 * Seeds are spread evenly through the sample rather than picked at random
 * so the output is deterministic — the manifest is checked in, and a
 * re-run that reshuffles every palette would be pure diff noise.
 */
function kmeans(pixels, k, iterations) {
  const centroids = [];
  for (let i = 0; i < k; i++) {
    centroids.push(pixels[Math.floor((i * (pixels.length - 1)) / (k - 1))].slice());
  }
  const assignment = new Array(pixels.length).fill(0);
  for (let step = 0; step < iterations; step++) {
    for (let i = 0; i < pixels.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dr = pixels[i][0] - centroids[c][0];
        const dg = pixels[i][1] - centroids[c][1];
        const db = pixels[i][2] - centroids[c][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      assignment[i] = best;
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < pixels.length; i++) {
      const a = assignment[i];
      sums[a][0] += pixels[i][0];
      sums[a][1] += pixels[i][1];
      sums[a][2] += pixels[i][2];
      sums[a][3]++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c][3] === 0) continue;
      centroids[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
    }
  }
  const counts = new Array(k).fill(0);
  for (const a of assignment) counts[a]++;
  return centroids
    .map((c, i) => ({
      hex: hex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2])),
      share: Math.round((counts[i] / pixels.length) * 100),
    }))
    .sort((a, b) => b.share - a.share);
}

async function analyze(file) {
  const path = join(PHOTOS_DIR, file);
  const img = sharp(path);
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new Error(`${file}: could not read image dimensions`);
  }
  if (Math.max(width, height) > 1600) {
    throw new Error(`${file}: ${width}x${height} exceeds the 1600px long-edge limit`);
  }
  if (meta.exif || meta.xmp || meta.iptc) {
    throw new Error(`${file}: embedded metadata must be stripped before publication`);
  }
  // Resize to 1x1 and pull the single RGB pixel — that's sharp's fast
  // path for "average color of this image."
  const raw = await sharp(path).resize(1, 1, { fit: 'cover' }).raw().toBuffer();
  const [r, g, b] = raw;
  const hsl = rgbToHsl(r, g, b);

  // 60x80 is enough signal for a 5-way split and keeps the whole 40-photo
  // run under a couple of seconds.
  const { data, info } = await sharp(path)
    .resize(60, 80, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  return {
    file,
    w: width,
    h: height,
    aspect: Math.round((width / height) * 1000) / 1000,
    r,
    g,
    b,
    hue: hsl.h,
    sat: hsl.s,
    lig: hsl.l,
    palette: kmeans(pixels, 5, 24),
  };
}

const jpegFiles = readdirSync(PHOTOS_DIR)
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort();
const invalidNames = jpegFiles.filter((f) => !/^photo-\d{2}\.jpg$/.test(f));
if (invalidNames.length > 0) {
  throw new Error(
    `non-canonical photo filenames: ${invalidNames.join(', ')}; expected photo-NN.jpg`,
  );
}
const files = jpegFiles;

console.log(`analyzing ${files.length} photos in ${PHOTOS_DIR}`);

const manifest = [];
for (const f of files) {
  const entry = await analyze(f);
  manifest.push(entry);
  console.log(
    `  ${entry.file}  ${entry.w}x${entry.h}  ar=${entry.aspect}  hsl(${entry.hue},${entry.sat}%,${entry.lig}%)`,
  );
}

writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`\nwrote ${manifest.length} entries → ${OUT_PATH}`);
