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

/** One of the five dominant tones, with the share of the frame it covers. */
export type PaletteTone = { hex: string; share: number };

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
  palette: PaletteTone[];
};

export const PHOTO_MANIFEST: readonly PhotoMeta[] = manifest as PhotoMeta[];

export const POOL_SIZE = PHOTO_MANIFEST.length;

/** Hue-sorted order — the sequence pickColorBand slices its window from. */
const BY_HUE: readonly PhotoMeta[] = [...PHOTO_MANIFEST].sort((a, b) => a.hue - b.hue);

/** 1-indexed position in the hue sort, so a card can say "33 of 40". */
function hueRank(file: string): number {
  return BY_HUE.findIndex((p) => p.file === file) + 1;
}

/**
 * A single photo cell's assignment. Carries the full metadata rather than
 * just a filename because the card's verso shows this frame's palette and
 * the frame it was paired with — `partner` is the other cell's photo, which
 * is the whole point of the color-band pick.
 */
export type PhotoSlot = { photo: PhotoMeta; partner: PhotoMeta; rank: number };

/** Both cells from one picked pair, each pointing at the other. */
function toSlots(pair: PhotoMeta[]): PhotoSlot[] {
  const [first, second] = pair;
  if (!first || !second) return [];
  return [
    { photo: first, partner: second, rank: hueRank(first.file) },
    { photo: second, partner: first, rank: hueRank(second.file) },
  ];
}

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
  const sorted = BY_HUE;
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
  return toSlots(pickColorBand(2, s));
}

/**
 * Initial (pre-hydration) slots — first 2 photos from the manifest.
 * Renders on the server and on first client paint so hydration
 * matches; a client-side useEffect then swaps in the seeded selection.
 * Same one-frame swap pattern the old shuffle used.
 */
export const INITIAL_SLOTS: readonly PhotoSlot[] = toSlots([...PHOTO_MANIFEST.slice(0, 2)]);
