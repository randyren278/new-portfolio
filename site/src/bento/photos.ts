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
 * A single photo cell's assignment: which file, and its exact grid-row
 * placement (as a CSS `grid-row` value like "1 / span 2" or "3").
 * PhotoCell applies this as an inline style so the grid doesn't need
 * conditional classes for every layout variant.
 */
export type PhotoSlot = { file: string; gridRow: string };

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

/** Portrait if aspect < 0.87 (skinny); everything else uses 1-row cells. */
function isPortrait(p: PhotoMeta): boolean {
  return p.aspect < 0.87;
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
 * Decide layout for the middle column of the desktop 3-row grid:
 *
 *   - If the initial 3-photo band is ALL portraits → drop to 2 photos.
 *     One takes rows 1-2 (tall), the other row 3 (short) — flipped per
 *     visit so the rhythm doesn't ossify.
 *   - Otherwise → keep 3 photos, each 1 row.
 *
 * The returned `gridRow` strings work as-is in the CSS Grid — desktop
 * has 3 rows in the middle column, mobile stacks everything, and the
 * mobile media query overrides `grid-row` to `auto` so this data is
 * inert there (see bento.css @media (max-width: 720px)).
 */
export function pickLayout(seed?: number): PhotoSlot[] {
  const s = seed ?? Math.floor(Math.random() * 2 ** 32);
  const three = pickColorBand(3, s);
  const allPortrait = three.every(isPortrait);
  if (!allPortrait) {
    return three.map((p, i) => ({ file: p.file, gridRow: `${i + 1}` }));
  }
  const two = pickColorBand(2, s ^ 0xdeadbeef);
  const tallFirst = mulberry32(s)() < 0.5;
  return tallFirst
    ? [
        { file: two[0].file, gridRow: '1 / span 2' },
        { file: two[1].file, gridRow: '3' },
      ]
    : [
        { file: two[0].file, gridRow: '1' },
        { file: two[1].file, gridRow: '2 / span 2' },
      ];
}

/**
 * Initial (pre-hydration) slots — first 3 photos from the manifest,
 * each 1 row tall. Renders on the server and on first client paint so
 * hydration matches; a client-side useEffect then swaps in the seeded
 * selection. Same one-frame swap pattern the old shuffle used.
 */
export const INITIAL_SLOTS: readonly PhotoSlot[] = PHOTO_MANIFEST.slice(0, 3).map((p, i) => ({
  file: p.file,
  gridRow: `${i + 1}`,
}));
