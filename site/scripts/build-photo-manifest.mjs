#!/usr/bin/env node
/**
 * Scans public/photos/ for JPG/JPEG files, extracts width, height, and
 * the average color (via sharp resize-to-1x1), converts sRGB → HSL,
 * and writes src/bento/photos.manifest.json.
 *
 * Run manually after adding/removing/replacing photos:
 *   pnpm build:photos
 *
 * The manifest is checked into the repo — this script is not part of
 * `pnpm build` because photo drops are infrequent and the manifest is
 * small enough (~5KB) that regenerating on every CI build would burn
 * more time than it saves.
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

async function analyze(file) {
  const path = join(PHOTOS_DIR, file);
  const img = sharp(path);
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  // Resize to 1x1 and pull the single RGB pixel — that's sharp's fast
  // path for "average color of this image."
  const raw = await sharp(path).resize(1, 1, { fit: 'cover' }).raw().toBuffer();
  const [r, g, b] = raw;
  const hsl = rgbToHsl(r, g, b);
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
  };
}

const files = readdirSync(PHOTOS_DIR)
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort();

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
