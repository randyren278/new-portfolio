# CLAUDE.md

Guidance for Claude Code working in this repo. Read this first.

---

## What this is

`randyren.org` — a single-page portfolio built as a **Next.js 15 App Router
site rendering a flat editorial bento grid**. Every cell is a React
component; content is server-loaded from `src/content/data.ts`; the
palette is a single light theme declared once at the top of `bento.css`.

The site's previous incarnation was a ~2,800-line vanilla-JS terminal
engine at `src/studio/`. It was retired in favor of the bento in the
`feat/bento-retire-terminal` branch — git log holds it if you ever want
it back. **Do not resurrect it unless the user explicitly asks.**

- **Node 22** (`.nvmrc`), **pnpm** (`package.json` uses pnpm-lock), **Biome**
  for lint/format, **Playwright** for smoke tests, **TypeScript strict**.
- Deploy is `git push origin main` → Vercel auto-deploys. There is no CI
  gate; the smoke is local.
- Live at `https://www.randyren.org`.

## Repository layout

```
site/
├── src/
│   ├── app/
│   │   ├── layout.tsx              — root metadata + viewport (viewport-fit=cover) + font links
│   │   ├── page.tsx                — server component; loads content + strava, renders <BentoHome>
│   │   └── api/strava/{connect,callback,latest}/route.ts
│   ├── bento/                      — the home page (replaces the old src/studio)
│   │   ├── BentoHome.tsx           — client wrapper, composes the 3×3 asymmetric grid
│   │   ├── bento.css               — palette API + grid geometry + cell chrome
│   │   ├── photos.ts               — photo pool + Fisher-Yates shuffle
│   │   └── cells/
│   │       ├── NameCell.tsx        — top-left corner (wordmark + one-line bio + status)
│   │       ├── ContactCell.tsx     — top-right corner (parses CONTACT_TEXT into rows)
│   │       ├── ProjectsCell.tsx    — spans 2 rows down the left, expand-in-place plate reveal
│   │       ├── ResumeCell.tsx      — bottom-right PDF preview + view/download actions
│   │       ├── StravaCell.tsx      — middle-right, renders SVG polyline (or fallback)
│   │       └── PhotoCell.tsx       — two shuffled photographs on the middle spine
│   ├── content/
│   │   ├── types.ts                — ShellContent shape
│   │   ├── data.ts                 — static content snapshot (Phase 1)
│   │   └── loader.ts               — async loader (rewrite for Postgres in Phase 2)
│   └── strava/
│       ├── client.ts               — OAuth + activity fetch
│       ├── tokenStore.ts           — local file OR Vercel Edge Config
│       └── polyline.ts             — Google polyline decode + SVG projection
├── scripts/
│   └── smoke-bento.cjs             — Playwright smoke (desktop + DEVICE=mobile)
├── public/
│   ├── photos/                     — drop photo-01..08.jpg here (see photos/README.md)
│   └── favicons, apple-touch-icon, og-image
├── biome.json
├── next.config.mjs                 — strict mode ON
└── tsconfig.json                   — path alias @/* → src/*
```

The `site/` directory IS the deployment root. `site/../index.html` at the
repo root is a legacy static prototype; do not touch it. Numerous
`mock-*.html` files in `site/` are design-process artifacts (bento
mockups, TUI mockups, etc.); they're not referenced by the build.

## The bento layout

The 3×3 asymmetric grid:

```
Row 1: [Name         ] [Photo A      ] [Contact      ]
Row 2: [Projects     ] [ (Photo A)   ] [Strava       ]
Row 3: [ (Projects)  ] [Photo B      ] [Résumé       ]
```

Projects spans rows 2–3 on the left. The middle column is a vertical
photo strip. Strava sits between Contact and Résumé on the right. The
page is capped at `max-width: 1680px` and centred; above that the cells
were stretching to 800px and the bio ran 120 characters a line.

- **Two columns (`721px`–`1100px`):** Name | Contact, then Projects
  (spanning two rows) | Photo A over Strava, then Résumé | Photo B. Photos
  are square here so the right column lands near the projects list.
  Projects used to span all four rows and sat 1300px tall with an empty
  bottom two-thirds.
- **Project rows** switch from `number / title / blurb` to `number /
  title-over-blurb` via a container query on the cell (`<= 380px`), not
  the viewport — the three-column row clips the blurb in any cell that
  narrow, which happens in both the 3-col and 2-col grids.

- **Mobile (`@media (max-width: 720px)`):** stacks to one column. Index stays
  first; Contact, Projects, Strava, Photo-A, Photo-B, and Résumé shuffle per
  visit, with the two photographs never adjacent. **No cell caps its own
  height.** `.cell-projects` used to sit at `max-height: 70dvh`, which made
  `.projects-list` a nested scroller and hid the last three projects; cells
  grow to their content and the page does the scrolling.
- **Cell chrome:** 1px hairline border in `var(--rule)`, 2px radius, 26px
  padding, `transition: border-color 120ms ease` on hover. Zero fills,
  zero glow, zero motion beyond the border darken and the plate-expand
  crossfade.
- **Projects cell interaction:** click a row → cell expands in place to
  reveal the plate essay (fade-in via `@keyframes plate-fade-in`, 220ms).
  Click `× close` (top-right of the expanded state) to collapse. Cell
  scrolls internally if the essay overflows; the rest of the bento does
  not resize.

## The palette API

**Light-only.** Dark mode and the theme toggle were retired with the
terminal engine — there is no `theme.ts`, no `ThemeToggle.tsx`, and no
`data-theme` attribute. `:root` declares `color-scheme: light` so a
visitor whose OS is dark does not get dark UA surfaces on paper.

Five roles, one `:root` block at the top of `src/bento/bento.css`:

- `--bg #fafaf7`, `--ink #0f0f0f`, `--muted #6f6f6f`,
  `--rule #d8d8d5`, `--accent #a8100a` (heritage vermillion)
- **Split-var pairs:** `--bg-rgb`, `--ink-rgb`, `--muted-rgb` (space-
  separated triplets so `rgba(var(--ink-rgb) / 0.03)` works)

**Never add a hardcoded color literal outside that `:root` block.** Every
hex/rgba elsewhere is a bug.

**`--muted` is pinned to WCAG AA.** It carries every section label,
caption, and metadata line on the page. At its old `#8a8a8a` it was
3.30:1 against `--bg` and failed AA on 21 text runs at once. `#6f6f6f` is
4.65:1. Do not lighten it; the smoke's contrast sweep will reject it.

## Content flow

- `src/content/data.ts` — the source of truth (NOTES, MEDIUMS, ORDER,
  ABOUT_TEXT, CONTACT_TEXT, RESUME, MAN, PLATE_DATA).
- `src/content/loader.ts` — `loadShellContent()` returns the whole shape.
  Signature is stable; rewrite the body for Postgres in Phase 2 without
  touching callers.
- `src/app/page.tsx` — server component, calls `loadShellContent()` and
  the Strava loader in parallel, passes both as props to `<BentoHome>`.
- **Add a new project:** add its entry to NOTES/MEDIUMS/ORDER/PLATE_DATA
  in `data.ts`. Nothing in `src/bento/` needs to change — the cells iterate
  `ORDER`. Plate number is derived from position in `ORDER` (1-indexed,
  zero-padded).

## Strava integration

The middle-right cell renders a projected SVG polyline from the most
recent GPS activity.

- OAuth: visit `/api/strava/connect` once → callback lands at
  `/api/strava/callback` → tokens persisted to the store.
- Two token backends, chosen by env:
  - `STRAVA_TOKEN_FILE` set → local JSON file (for `pnpm dev`, gitignored).
  - Otherwise → **Vercel Edge Config** (reads via SDK; writes via REST API
    using `VERCEL_TOKEN` + `EDGE_CONFIG_ID`).
- The polyline is projected server-side to a 360×200 SVG viewBox path.
  `StravaCell` drops the path string directly into `<path d={...}>`.
- If the fetch fails (no tokens, offline, no GPS activity), `page.tsx`
  passes `strava: null` and `StravaCell` renders a hand-drawn fallback
  polyline with a "not connected" caption. **The cell is never broken.**
- Data cache: 15 min via `next: { revalidate: 900 }` on the Strava fetch.

## Photos

`src/bento/photos.ts` holds an 8-entry pool of filenames
(`photo-01.jpg`..`photo-08.jpg`). On client mount, `BentoHome`'s
`PhotoCell` triggers a Fisher-Yates shuffle (once, module-scoped) and
each cell picks its slot's filename. Reload → new shuffle → new
permutation.

- **SSR is deterministic** — initial render uses the unshuffled pool so
  hydration matches. A `useEffect` swaps in the shuffled filename after
  hydration (imperceptible one-frame swap).
- **Missing files are the default state.** `/public/photos/` ships
  empty. Each `<img>` attempts `/photos/<filename>` and `onError` hides
  the image element — the muted background rectangle + mono filename
  label stand alone. No broken-image icons.
- **To add photos:** drop `photo-01.jpg`..`photo-08.jpg` (or `.webp`) into
  `public/photos/`. See `public/photos/README.md`.

## Development

```sh
pnpm install                          # first time
pnpm dev                              # http://localhost:3000 (or PORT=3877 for the smokes)
pnpm build                            # production build
pnpm lint                             # biome check
pnpm format                           # biome format --write
```

The smoke also enforces four page-wide invariants, so a change can break
it from a long way off: every visible text run clears WCAG AA contrast,
every control has a >=2px focus ring, the heading outline is one H1 plus
four H2s, and (mobile) every tappable control owns a 44x44 target. If one
of those goes red, fix the page — do not relax the assertion.

Smoke assumes dev on **:3877**:

```sh
PORT=3877 pnpm dev &                      # in another shell
node scripts/smoke-bento.cjs              # desktop, ~30 assertions
DEVICE=mobile node scripts/smoke-bento.cjs # iPhone 13
```

**Both modes must pass before shipping any bento change.**

Common gotcha: if dev 500s right after `pnpm build`, the production build
overwrote its `.next` chunks. Fix: `rm -rf .next`, restart dev.

## Secrets & git hygiene

- `.env`, `.env.local`, `.env*.local`, `.strava-tokens.json` are
  gitignored. Never commit them.
- If a token is ever exposed in chat/PR/commit: revoke immediately at
  `https://www.strava.com/settings/api` (Strava) or the Vercel dashboard.
- Public envs must be prefixed `NEXT_PUBLIC_`. There are none currently.

## Best practices for edits

Follow the four global rules from `~/.claude/CLAUDE.md` (think before
coding; simplicity first; surgical changes; goal-driven execution).
Repo-specific:

- **Match surrounding style.** Cells are terse React components with
  short block comments explaining "why."
- **Prefer additions in `content/data.ts`** when the request is a
  content edit (a new plate, a new bio line, a new project).
- **CSS changes go in `bento.css`, not inline.** Palette variables live
  at the top; use them. Never introduce a hex outside those blocks.
- **When touching layout or a cell, extend `smoke-bento.cjs` first**,
  then make it pass. The smoke doubles as the regression test.
- **Server → client boundary.** The Strava route handlers, `page.tsx`,
  and any Postgres code are server-only. `<BentoHome>` and every cell
  file marked `'use client'` are client-only. Do not import `pg` or
  `@vercel/edge-config` from `src/bento/*`.

## Verification checklist for any bento change

1. `pnpm build` completes cleanly.
2. `node scripts/smoke-bento.cjs` — all assertions green.
3. `DEVICE=mobile node scripts/smoke-bento.cjs` — all assertions green.
4. Manually: hard-refresh `randyren.org` on an actual iOS device (or the
   iOS simulator) and verify no horizontal scroll, all eight projects are
   reachable, and the grid reflows to one column.
5. Commit with a short conventional-commit subject
   (`feat(bento): ...`, `fix(cell): ...`, `chore(css): ...`).
