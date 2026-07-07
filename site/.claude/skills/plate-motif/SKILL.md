---
name: plate-motif
description: Use when adding a new project to the portfolio and needing to design its plate motif — the 360×200 SVG "cover art" that appears next to the essay in the plate overlay. Covers the visual grammar, the six existing motifs as precedent, the theme-aware color API, and how the motif is wired into shell-engine.js. Also use when redesigning an existing motif or diagnosing a motif that doesn't feel right.
---

# Plate motif — how to design & ship a new one

## What a motif is

Every project on randy.sh has a **plate** — a full-screen overlay opened when
you type `open <slug>` or click the "Open the project" chip. The plate has a
short essay + a small **motif** — a `360×200` SVG "cover", built from a few
straight/curved lines and a translucent wash. It is drawn imperatively by the
engine inside `plateFor(slug)` at `src/studio/shell-engine.js` (search for
`if (slug === 'oryzo')` — around line 1940 in the current file, may drift).

The six existing motifs are the precedent:

| slug            | geometry                                                     |
| --------------- | ------------------------------------------------------------ |
| `oryzo`         | Three concentric arcs opening upward + vertical stem         |
| `halcyon`       | Rectangle framing three small triangles                      |
| `aperture`      | Four concentric circles (iris)                               |
| `fieldnote`     | Seven horizontal rules + one vertical accent                 |
| `signal-garden` | Six hexagons in a cluster                                    |
| `loom`          | Six overlapping circles arranged in a ring                   |

Every motif reads visually like a **hand-drafted architectural glyph** —
`1px vector-effect="non-scaling-stroke"`, no gradients, no filters, no
raster. The wash is a single translucent rectangle behind the strokes.

## Design constraints (do not break)

1. **Canvas is `360×200`** — hardcoded `W`, `H` at the top of the block. Do
   not change it. The plate overlay CSS assumes this aspect.
2. **Everything is 1px, stroked, non-scaling.** Use the existing helpers:
   `arc(cx,cy,r,a1,a2,color)`, `circle(cx,cy,r,color)`, `rect(x,y,w,h,color)`,
   `line(x1,y1,x2,y2,color)`, `poly(pts,color)`. Do not introduce fills on
   drawn elements (the wash rect is the exception — it uses `fill` and no
   stroke).
3. **Three color roles:** `primary` (the ink strokes — most of the motif),
   `secondary` (one or two elements, becomes the accent), `wash` (the
   translucent rectangle behind the strokes). Every motif function must
   name these clearly.
4. **The motif must survive theme swap.** Colors come from the
   theme-aware `palette()` helper (see [Color API](#color-api) below), NOT
   from hex literals. A hardcoded `#111` in a motif is a bug.
5. **`vector-effect: non-scaling-stroke`** on every stroked element so the
   1px hairline stays exactly 1px at every viewport size the plate can be
   scaled to.
6. **Glyph label** — every motif ends with a right-aligned uppercase text
   node showing the slug. Font `IBM Plex Mono` 9pt, letter-spacing 1.5,
   fill `palette().muted`. Copied from any existing motif.
7. **`washRect` starts at `opacity="0"`** and is animated in by the engine's
   reveal pass. Do not set a non-zero opacity in the SVG itself.
8. **No `fill`, `stroke`, or `color` values inside quotes** except through
   the palette API. Grep test: `git grep -nE '#[0-9a-fA-F]{3,6}' src/studio/shell-engine.js`
   should find no *new* hex literals in your motif block.

## Color API (theme-aware)

The engine exposes `palette()`, which reads live values from CSS custom
properties on `<html data-theme="…">`:

```js
function palette() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink:    cs.getPropertyValue('--ink').trim(),
    muted:  cs.getPropertyValue('--muted').trim(),
    accent: cs.getPropertyValue('--accent').trim(),
  };
}
```

Call it **once at the top of the motif block** and reuse the resolved
values:

```js
const p = palette();
const primary = p.ink, secondary = p.accent, washFill = p.muted;
```

The engine also dispatches a `themechange` `CustomEvent` on `document` when
the user flips theme. Any open plate re-runs its motif function so colors
refresh — do not cache `palette()` outside the function.

## Visual vocabulary — what "feels right"

Motifs are not illustrations, and not diagrams. They are **specimen glyphs**
— close to what an architect draws in the corner of a plan sheet to signal
"this element". Reach for:

- **primitives.** arcs, circles, rectangles, hexagons, evenly-spaced parallels.
- **one asymmetry.** every motif has a single element that breaks the pattern
  — the vertical stem in oryzo, the diagonal in fieldnote, the inner ring in
  aperture. That element is `secondary` (accent-colored).
- **generous negative space.** the wash rect is smaller than the canvas.
  ~70% of the canvas should be substrate. If your motif fills the frame it's
  wrong.
- **six or fewer distinct strokes/shapes.** anything more reads as noise at
  360×200.
- **rotational or reflective symmetry** as the underlying skeleton — then
  break it in one place.

Avoid:

- **representational imagery** (a house, a leaf, a face). Motifs are abstract.
- **text INSIDE the motif** beyond the corner glyph.
- **grids of dots**, **radiating rays**, **spirals**. Overused, and they
  read as generic "AI art" rather than hand-drawn.
- **wash gradients** — the wash is one flat translucent color.
- **decorative flourishes** — no serifs on caps, no drop shadows.

## Adding a new motif — step by step

1. **Add the project's content** to `src/content/data.ts` first, including
   the `slug`, `title`, `year`, `meta` fields, and the essay HTML. The motif
   is second-tier — no point drawing until the copy is real.

2. **Sketch on paper or in the browser** using `motif-mockup.html` as your
   playground. It renders every motif in all treatments — clone one of the
   existing `if (slug === '…')` blocks in the mockup script and iterate
   until it feels right.

3. **Decide the secondary element.** What is the *one* thing the accent
   picks out? A ring? A vertical stem? A triangle? This is the whole visual
   identity of the motif — do not pick arbitrarily. It should map to the
   project's essence: aperture = the iris, loom = the anchor node, etc.

4. **Add the block to `shell-engine.js`** in `plateFor()`:

    ```js
    } else if (slug === '<new-slug>') {
      strokes.push(circle(180, 100, 60, primary));
      strokes.push(circle(180, 100, 30, secondary)); // the one asymmetry
      washRect = rect(120, 40, 120, 120, 'none');
      washRect.setAttribute('fill', washFill);
    }
    ```

    Use the same `p = palette()` binding that other motifs use — do not
    re-inline colors.

5. **Add the same block to `renderMotifFull()`** (around line 2218 in
   the current file) — this is the larger full-page version that appears
   at `~/projects` before the plate opens. Same geometry, larger viewBox
   (1000×500). Consult existing motif pairs for the scale factor.

6. **Verify manually:**
    - `pnpm dev`, visit `/`, type `open <new-slug>`. The plate opens, motif
      renders, all three color roles resolve.
    - Toggle theme with the top-left chrome. Motif redraws, colors flip.
    - Reduce motion in system prefs, reload. Motif renders instantly with
      no animation artefacts.

7. **Extend the mobile smoke** if the motif has interactive elements
   (uncommon — usually it's decorative and mobile just gets the essay).

## Anti-patterns (learned from real edits)

- **Copy-pasting a motif and swapping numbers.** Every motif is bespoke.
  If two motifs look like variants of each other, one of them is a bug.
- **Introducing a fourth color.** The palette API has three roles for a
  reason. If your motif "needs" a fourth, either the design is too busy
  or you're missing that `muted` and `accent` are already two options
  distinct from `ink`.
- **Setting explicit opacity on strokes.** The 1px hairline at ink is
  already the minimum-emphasis primary. Opacity below 1 fights the
  contrast rule at the top of `shell.css`.
- **Drawing something recognizable.** If the motif reads as "a leaf" or
  "a phone" or "a graph", it's out of grammar. Motifs are architectural
  specimens, not icons.

## Files touched by a new motif

- `src/content/data.ts` — the project entry itself (slug, essay, meta)
- `src/studio/shell-engine.js` — motif block in `plateFor()` AND
  `renderMotifFull()` (the full-page variant)
- `motif-mockup.html` — optional but recommended: add the block here
  first for fast iteration without a `pnpm dev` reload cycle
- `scripts/smoke-nav.cjs` — add an assertion that `open <slug>` opens
  a plate with a non-empty SVG (one-line assertion, mirrors existing)

## Related

- `CLAUDE.md` at repo root — the engine contract (IDs, imperative model,
  content injection, theme system)
- `motif-mockup.html` — the treatments playground; the fastest way to
  A/B a new motif idea before touching the engine
- `shell.css` — palette-locked comment at the top, the source of truth
  for what `--ink`, `--muted`, `--accent` mean per theme
