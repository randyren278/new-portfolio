# CLAUDE.md

Guidance for Claude Code working in this repo. Read this first.

---

## What this is

`randyren.org` — a single-page portfolio built as a **Next.js 15 App Router shell
wrapped around an imperative ~2,800-line vanilla-JS terminal engine**. The
engine is the product. Next.js exists to ship it, hydrate it with server-fetched
content, and give it an API surface (Strava). React does not own the DOM inside
`#term` — the engine does.

- **Node 22** (`.nvmrc`), **pnpm** (`package.json` uses pnpm-lock), **Biome** for
  lint/format, **Playwright** for smoke tests, **TypeScript strict**.
- Deploy is `git push origin main` → Vercel auto-deploys. There is no CI gate;
  the smokes are local.
- Live at `https://www.randyren.org`.

## Repository layout

```
site/
├── src/
│   ├── app/
│   │   ├── layout.tsx              — root metadata + viewport (viewport-fit=cover)
│   │   ├── page.tsx                — server component; loads content, renders <StudioShell>
│   │   └── api/strava/{connect,callback,latest}/route.ts
│   ├── studio/
│   │   ├── StudioShell.tsx         — client wrapper, mounts the engine exactly once
│   │   ├── shell-engine.js         — the ~2,800-line imperative engine (IGNORED BY BIOME)
│   │   └── shell.css               — all shell styling incl. the mobile media query
│   ├── content/
│   │   ├── types.ts                — ShellContent shape
│   │   ├── data.ts                 — static content snapshot (Phase 1)
│   │   └── loader.ts               — async loader (rewrite for Postgres in Phase 2)
│   └── strava/
│       ├── client.ts               — OAuth + activity fetch
│       ├── tokenStore.ts           — local file OR Vercel Edge Config
│       └── polyline.ts             — Google polyline decode + SVG projection
├── scripts/
│   ├── smoke-nav.cjs               — desktop Playwright smoke (17 assertions)
│   └── smoke-mobile.cjs            — iPhone-13 emulation smoke (14 assertions)
├── .claude/
│   └── skills/
│       └── plate-motif/SKILL.md    — how to design a new project motif
├── public/                         — favicons, apple-touch-icon, og-image
├── biome.json                      — ignores shell-engine.js
├── next.config.mjs                 — strict mode ON
└── tsconfig.json                   — path alias @/* → src/*
```

The `site/` directory IS the deployment root. `site/../index.html` at the repo
root is a legacy static prototype; do not touch it.

## The engine contract (non-negotiable)

`shell-engine.js` is hand-written. It is not idiomatic React. It uses
`document.getElementById(...)` against IDs that `StudioShell.tsx` renders. Rules:

1. **Never rename the IDs.** `#term`, `#buffer`, `#active-line`, `#input-area`,
   `#input-before`, `#caret`, `#input-after`, `#chips`, `#keysink`, `#palette`,
   `#pal-input`, `#pal-list`, `#page-loader`, `#pl-num`, `#pl-fill`, `#pl-log`,
   `#pl-hint`, `#chrome-cmdk`, `#margin-hint`, `#prompt-dot`, `#prompt-fragment`,
   `#scroll-aff`. Grep before renaming anything.
2. **The engine is imperative and stateful.** It binds `window`/`document`
   listeners, runs animation loops, and holds closures. Boot it exactly once —
   `StudioShell.tsx` uses a `mountedRef` guard because React 18/19 StrictMode
   double-invokes effects in dev.
3. **Content is injected, not imported.** `bootShell(content)` receives NOTES /
   MEDIUMS / ORDER / ABOUT_TEXT / CONTACT_TEXT / HOURS_TEXT / COLOPHON_TEXT /
   MAN / PLATE_DATA. Add a field → update `src/content/types.ts` AND read it
   inside `bootShell`. Never re-inline content back into the engine.
4. **Biome ignores `shell-engine.js`** on purpose (`biome.json:files.ignore`).
   Do not run the formatter over it. Match its existing dense-comment style if
   editing.
5. **Event dispatch targets `document`, not `window`.** The engine's keydown
   listener is bound to `document` at `shell-engine.js:385`. Events bubble UP,
   not DOWN — a `window.dispatchEvent` never reaches document listeners. The
   `⌘K palette` button in `StudioShell.tsx` correctly dispatches on `document`.

## Mobile / touch invariants

Learned the hard way over three audit rounds. Break these and iOS Safari
regresses.

- **Detection:** `TOUCH = window.matchMedia('(pointer: coarse)').matches` in the
  engine; `@media (pointer: coarse)` in CSS. Prefer this over `max-width` — it
  catches iPad and phone landscape correctly and doesn't false-fire on a narrow
  desktop window.
- **Soft keyboard must never appear on any terminal tap.** Three interlocking
  guards, all required:
  1. `focusInput()` in the engine early-returns on `TOUCH`. This blocks the
     `mouseup`, window `focus`, `visibilitychange`, palette/plate close paths.
  2. `#input-area { pointer-events: none; user-select: none }` inside the
     `(pointer: coarse)` block — taps pass through to `#term`.
  3. `<input id="keysink" readOnly inputMode="none">` in JSX — iOS refuses
     to summon the keyboard for readonly / inputMode:none inputs even if some
     future path calls `.focus()` on it.
  The palette's `#pal-input` is the exception — it MUST summon the keyboard
  (it's a real search field).
- **Full plate modal is blocked on touch.** In the engine's `open` command:
  `if (!TOUCH && isInlineCardVisible(arg)) openPlate(arg); else renderFile(...)`.
  Chip label wording flips accordingly — `TOUCH ? 'Show the note' : 'Open the project'`.
- **Chip row is a 2-column CSS grid on mobile**, not the desktop inline-block +
  `·` separator layout. `.chip-sep { display: none }`.
- **Prefer `pointerdown` over `mousedown`** for outside-click / skip listeners.
  Mousedown fires late on touch (after the synthesized 300ms delay), and skip
  handlers that use it feel broken. See the palette overlay, plate overlay,
  boot ceremony, and page-loader skip listeners.
- **Safe-area env() requires `viewportFit: 'cover'`** in `app/layout.tsx`. All
  chrome uses `max(base, env(safe-area-inset-*, 0px))` with the base rule left
  intact above the max() rule as a fallback.
- **`overscroll-behavior: none` on body** — kills iOS rubber-band that would
  otherwise expose address-bar chrome when the plate scrolls internally.

## Theme system (dark ⇄ light)

The site ships two palettes selected by `data-theme` on `<html>`. **Never
add a hardcoded color literal outside the palette API** — every hex/rgba
outside the palette definition is a bug that will fail one of the two themes.

- **Palette API — five roles.** `--bg`, `--ink`, `--muted`, `--rule`,
  `--accent`. Also `--bg-rgb / --ink-rgb / --muted-rgb` split-var pairs for
  `rgba()` calls (the `rgb(from …)` syntax is not yet universally supported).
  Do not introduce role #6.
- **Two palette blocks live under `:root[data-theme="light"]` and
  `:root[data-theme="dark"]`** in `shell.css`. No `@media (prefers-color-scheme)`
  in the stylesheet — the JS resolver picks and sets the attribute, CSS
  only cares about `[data-theme]`.
- **Pre-paint script.** `src/studio/theme.ts` exports an inline script that
  `layout.tsx` renders in `<head>`. It reads `localStorage.theme` (falling
  back to `matchMedia('(prefers-color-scheme: dark)')`) and sets
  `data-theme` on `<html>` **before body render** to avoid a light-flash.
- **Toggle chrome** lives at `.chrome-tl` (top-left), symmetrical opposite
  of `.chrome-tr`. Same safe-area / `pointer-events` guards as `.chrome-br`
  — inert on desktop (to preserve drag-select), tappable on touch. Same
  `readOnly / inputMode="none"` idiom — no soft keyboard on tap.
- **`theme` command** at the prompt: `theme dark|light|auto`. `auto`
  removes the stored choice and follows system pref live.
- **`themechange` `CustomEvent` on `document`** fires when the theme flips.
  Anything reading `getComputedStyle(--ink)` — motifs, Strava polyline,
  boot pulse — must re-render on this event. See `plate-motif` skill for
  the pattern.
- **Never opacity below 0.55 on foreground text.** The floor exists per
  theme; do not stack opacity to "get muted" — use `color: var(--muted)`
  and `opacity: 1`. Opacity is for genuine fade animations only.

## Development

```sh
pnpm install                          # first time
pnpm dev                              # http://localhost:3000 (or PORT=3877 for the smokes)
pnpm build                            # production build
pnpm lint                             # biome check
pnpm format                           # biome format --write
```

Smokes assume dev on **:3877**:

```sh
PORT=3877 pnpm dev &                  # (start it once in another shell)
node scripts/smoke-nav.cjs            # desktop, 17 assertions
node scripts/smoke-mobile.cjs         # iPhone-13, 14 assertions
```

**Both smokes must pass before shipping any change to the engine or shell.css.**
If mobile fails after touching CSS: check that new rules aren't leaking into the
`(pointer: coarse)` block (or missing from it).

Common gotcha: if the dev server 500s right after `pnpm build`, the production
build overwrote its `.next` chunks. Fix: kill dev, `rm -rf .next`, restart.

## Strava integration

Optional feature; the shell degrades gracefully if not configured.

- OAuth flow: visit `/api/strava/connect` once → callback lands at
  `/api/strava/callback` → tokens persisted to the store.
- **Two token backends**, chosen by env:
  - `STRAVA_TOKEN_FILE` set → local JSON file (for `pnpm dev`, gitignored).
  - Otherwise → **Vercel Edge Config** (reads via SDK; writes via REST API using
    `VERCEL_TOKEN` + `EDGE_CONFIG_ID`).
- `/api/strava/latest` returns the most recent GPS activity with the polyline
  **already projected server-side to a 360×200 SVG path**. The client just drops
  `d="..."` into a `<path>`. Never do the math in the browser.
- Data cache: 15 min via `next: { revalidate: 900 }` on the Strava fetch.

## Secrets & git hygiene

- `.env`, `.env.local`, `.env*.local`, `.strava-tokens.json` are gitignored.
  Never commit them, never paste their contents to a public surface, and never
  echo `VERCEL_TOKEN` into build logs.
- If a token is ever exposed in chat/PR/commit: revoke immediately at
  `https://www.strava.com/settings/api` (Strava) or the Vercel dashboard.
- Public envs must be prefixed `NEXT_PUBLIC_`. There are none currently.

## Best practices for edits

Follow the four global rules from `~/.claude/CLAUDE.md` (think before coding;
simplicity first; surgical changes; goal-driven execution). Repo-specific:

- **Match surrounding style.** The engine is dense with `/* ... */` block
  comments explaining the "why"; keep that up. `.tsx` files are terse.
- **Do not refactor the engine into React.** That is a separate project. If a
  change would require it, stop and surface the tradeoff.
- **Prefer additions in `content/data.ts` over engine changes** when the
  request is a content edit (a new plate, a new bio line, a new project).
- **CSS changes go in `shell.css`, not inline.** Palette variables live at the
  top under `:root`; use them. Do not introduce a new color without asking.
- **When touching mobile behavior, extend the mobile smoke first**, then make
  it pass. The smoke doubles as the regression test.
- **Cite the palette + contrast rules** at the top of `shell.css` before
  changing any color. Every color reference must go through the palette
  API (`var(--ink)`, `rgba(var(--ink-rgb), 0.16)`, etc.). No new hex or
  named color literals in `shell.css` or `shell-engine.js`.
- **Server → client boundary.** The Strava route handlers and any Postgres
  code are server-only. The engine + `<StudioShell>` are client-only. Do not
  import `pg` or `@vercel/edge-config` from `src/studio/*`.

## Adding a new project (plate + motif)

New projects go in `src/content/data.ts` (metadata + essay), then get a
360×200 **motif** drawn imperatively in `shell-engine.js`. The motif is
the plate's cover glyph — not decorative, part of the project's identity.

**Before drawing a motif, read `.claude/skills/plate-motif/SKILL.md`.** It
covers the visual grammar, the six existing motifs as precedent, the
theme-aware color API, and the anti-patterns learned so far. The mockup
at `motif-mockup.html` (repo root of `site/`) is the fast iteration
playground — clone an existing block, mutate, refresh, decide, then port
to the engine.

## Verification checklist for any shell change

1. `pnpm build` completes cleanly.
2. `node scripts/smoke-nav.cjs` — all 17 green.
3. `node scripts/smoke-mobile.cjs` — all 14 green.
4. Manually: hard-refresh `randyren.org` on an actual iOS device (or the iOS
   simulator) and verify no keyboard on terminal tap, palette opens via the
   `⌘K palette` button, and the mobile chip grid is 2-col.
5. Commit with a short conventional-commit subject
   (`feat(mobile): ...`, `fix(engine): ...`, `chore(shell): ...`).
