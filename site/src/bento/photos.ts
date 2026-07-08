/**
 * Photo selection: color-band picker + aspect-aware layout.
 *
 * At build time, `pnpm build:photos` walks public/photos/, extracts each
 * JPG's dimensions and average color, and writes photos.manifest.json.
 * This module imports that JSON and exposes two functions the client
 * uses at render time:
 *
 *   - `pickColorBand(n)` — pick N consecutive photos from the hue-sorted
 *     manifest. All photos in the same visit share a palette (same
 *     ~N/pool slice of the hue circle); which slice is random.
 *
 *   - `pickLayout()` — decide whether to render 2 or 3 slots and how
 *     tall each spans. Portraits favor tall (2-row) cells so most of
 *     the image shows; landscapes favor short (1-row) cells.
 *
 * Both use a seeded PRNG (mulberry32). BentoHome does selection
 * client-only in a useEffect, matching the previous PhotoCell hydration
 * pattern (imperceptible one-frame swap after hydration).
 */

import manifest from './photos.manifest.json';

export type PhotoMeta = {
  file: string;
  w: number;
  h: number;
  aspect: number;
  r: number;
  g: number;
  b: number;
  hue: number;
  sat: number;
  lig: number;
};

export const PHOTO_MANIFEST: readonly PhotoMeta[] = manifest as PhotoMeta[];

/**
 * A single photo cell's assignment: just which file. Row placement
 * is fixed in CSS (photo cells always span half of a 6-row grid on
 * desktop; aspect-ratio: 4/5 on mobile) — see bento.css.
 */
export type PhotoSlot = { file: string };

/**
 * Seeded PRNG. Small, deterministic, good enough for shuffle picks.
 * https://stackoverflow.com/a/47593316
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick `n` color-coherent photos. Hue-sort the manifest, then slice a
 * window of size `n` starting at a random offset. Within the window,
 * shuffle order so photos don't appear in strict hue-ascending order
 * (looks like a gradient chip strip otherwise).
 */
export function pickColorBand(n: number, seed?: number): PhotoMeta[] {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 32));
  const sorted = [...PHOTO_MANIFEST].sort((a, b) => a.hue - b.hue);
  const maxStart = Math.max(0, sorted.length - n);
  const start = Math.floor(rng() * (maxStart + 1));
  const band = sorted.slice(start, start + n);
  for (let i = band.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [band[i], band[j]] = [band[j], band[i]];
  }
  return band;
}

/**
 * Decide layout for the middle column. Always 2 photos, near-square
 * cells (~441×430 at 1440x900 desktop) so both portraits and
 * landscapes fit with only ~12% crop on the long axis. Cell shape
 * is fixed in CSS; this picker just chooses which two files to show.
 *
 * Kept as a separate function (rather than inlining `pickColorBand(2)`
 * at the call site) so future refinements — aspect-matched pairing,
 * saturation-weighted picks, etc. — have a single home.
 */
export function pickLayout(seed?: number): PhotoSlot[] {
  const s = seed ?? Math.floor(Math.random() * 2 ** 32);
  const two = pickColorBand(2, s);
  return two.map((p) => ({ file: p.file }));
}

/**
 * Initial (pre-hydration) slots — first 2 photos from the manifest.
 * Renders on the server and on first client paint so hydration
 * matches; a client-side useEffect then swaps in the seeded selection.
 * Same one-frame swap pattern the old shuffle used.
 */
export const INITIAL_SLOTS: readonly PhotoSlot[] = PHOTO_MANIFEST.slice(0, 2).map((p) => ({
  file: p.file,
}));
