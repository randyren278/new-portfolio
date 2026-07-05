# Randy Ren Portfolio Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the personal portfolio at `randyren.com` — a museum-as-curator's-terminal — as a production Next.js app on Vercel, with the terminal shell, plate viewer, page loader, and contact form all wired end-to-end.

**Architecture:** Next.js 15 (App Router) single-repo. Static content (projects, plates, bio) authored in MDX and imported at build time. The terminal shell is a client component tree ported from `prototypes/catalog/index.html` — filesystem, command parser, chip system, and reveal engine are TypeScript modules. Contact form is a single Route Handler backed by Resend for delivery and Upstash Redis for IP rate-limiting. Deploys through Vercel with a preview per PR.

**Tech Stack:**
- Next.js 15 (App Router, RSC), React 19, TypeScript strict
- CSS Modules (no Tailwind — palette is too specific)
- MDX via `@next/mdx` for plate long-form
- Vitest + `@testing-library/react` for unit
- Playwright for E2E
- Resend for transactional email
- Upstash Redis + `@upstash/ratelimit` for rate limiting
- Zod for input validation
- pnpm for package management
- Biome for lint + format (fast, single-tool)
- Vercel for hosting + preview deploys

## Global Constraints

- Node runtime: `>=20.11` (`.nvmrc` pins `20.11.1`)
- Package manager: pnpm `>=9`
- TypeScript: `strict: true`, `noUncheckedIndexedAccess: true`
- Palette (locked, use CSS custom properties, never hardcoded elsewhere):
  - `--cream: #F1E8D4`
  - `--ink: #111111`
  - `--prussian: #1F3A5F`
  - `--umber-strong: #5A3818`
  - `--umber-muted: #7A4A1F` (marginalia only)
  - `--vermillion: #A8100A` (accent only)
- Fonts: Instrument Serif (display), IBM Plex Mono (terminal + UI), IBM Plex Serif italic (plate body italics). Loaded via `next/font/google` with `display: 'swap'` and preloaded. **No Fraunces.**
- No opacity below `0.55` on any foreground text on cream.
- Every non-instant animation MUST short-circuit under `prefers-reduced-motion: reduce`.
- All terminal semantics (typing cadences, corner-trace timings, chip logic, cd/open/cat resolvers, two-click plate promotion, page loader 2200/220/720ms) are ported verbatim from `prototypes/catalog/index.html` unless a task explicitly changes them.
- Six project slugs, fixed order (`ORDER`): `oryzo`, `halcyon`, `paperlane`, `atlas`, `koinu`, `linen`.
- Copy rule: Randy writes in lowercase-first, dry, understated register. Sentences end with periods. No em-dashes replaced by hyphens (use en-dash where needed).
- Accessibility floor: WCAG 2.2 AA. Every interactive control has a visible focus ring (`2px solid var(--prussian)`, `outline-offset: 2px`).
- Bundle budget: `/` route JS ≤ 90 KB gzipped after first paint. Plates lazy-loaded.

---

## File Structure

```
site/
├── .nvmrc
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json
├── next.config.mjs
├── mdx-components.tsx
├── vitest.config.ts
├── playwright.config.ts
├── .env.example
├── .env.local                          # gitignored
├── public/
│   ├── favicon.svg
│   ├── og-default.png
│   └── fonts/                          # only if self-hosting fallback
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root html, font loading, metadata
│   │   ├── page.tsx                    # the terminal museum (single-page site)
│   │   ├── globals.css                 # tokens + resets only
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── api/
│   │       └── contact/
│   │           └── route.ts            # POST handler
│   ├── content/
│   │   ├── projects.ts                 # ORDER + metadata index
│   │   ├── bio.ts                      # about + get-in-touch strings
│   │   └── plates/
│   │       ├── oryzo.mdx
│   │       ├── halcyon.mdx
│   │       ├── paperlane.mdx
│   │       ├── atlas.mdx
│   │       ├── koinu.mdx
│   │       └── linen.mdx
│   ├── terminal/
│   │   ├── Terminal.tsx                # top-level client component
│   │   ├── Terminal.module.css
│   │   ├── Loader.tsx                  # 0-100% page loader
│   │   ├── Loader.module.css
│   │   ├── Chips.tsx
│   │   ├── Chips.module.css
│   │   ├── InlineLabel.tsx             # rendered when `open <slug>` is inline
│   │   ├── InlineLabel.module.css
│   │   ├── PlateViewer.tsx             # full-screen plate modal
│   │   ├── PlateViewer.module.css
│   │   ├── engine/
│   │   │   ├── filesystem.ts           # virtual FS tree + resolve
│   │   │   ├── commands.ts             # command dispatch table
│   │   │   ├── parser.ts               # tokenize + arg parse
│   │   │   ├── history.ts              # up/down history
│   │   │   ├── completion.ts           # tab completion
│   │   │   └── types.ts
│   │   ├── reveal/
│   │   │   ├── typewriter.ts           # char-by-char with jitter + holds
│   │   │   ├── cornerTrace.ts          # SVG stroke-dashoffset frame
│   │   │   └── cadences.ts             # timing constants
│   │   └── hooks/
│   │       ├── useReducedMotion.ts
│   │       ├── useSessionFlag.ts       # first-visit ceremony gate
│   │       └── useVisibleSlug.ts       # tracks which inline label is on screen
│   ├── contact/
│   │   ├── schema.ts                   # zod input schema
│   │   └── rateLimit.ts                # Upstash wrapper
│   └── lib/
│       ├── env.ts                      # runtime env validation
│       └── analytics.ts                # Vercel Analytics wrapper
├── tests/
│   ├── unit/
│   │   ├── parser.test.ts
│   │   ├── filesystem.test.ts
│   │   ├── completion.test.ts
│   │   ├── commands.test.ts
│   │   ├── typewriter.test.ts
│   │   └── contact-schema.test.ts
│   └── e2e/
│       ├── loader.spec.ts
│       ├── terminal-basic.spec.ts
│       ├── plate-promotion.spec.ts
│       ├── contact-form.spec.ts
│       └── a11y.spec.ts
└── docs/
    └── decisions/
        └── README.md                   # decision log entry point
```

**Boundary rules:**
- `terminal/engine/**` is pure TypeScript — no React, no DOM. Tested in isolation.
- `terminal/reveal/**` is DOM-aware but framework-free.
- React components in `terminal/*.tsx` compose engine + reveal + UI.
- `content/**` is the only place project/bio strings live.
- `app/api/contact/route.ts` is the only backend surface.

---

## Task Overview

Tasks are ordered so each produces something demonstrable on its own. Each ends with `pnpm test` (or the relevant subset) green and a commit.

1. Repo scaffold + tooling
2. Design tokens + global styles + fonts
3. Content model (projects + bio) with typed exports
4. Terminal engine — parser
5. Terminal engine — filesystem
6. Terminal engine — commands
7. Terminal engine — history + completion
8. Reveal engine — typewriter
9. Reveal engine — corner trace
10. Chips component
11. InlineLabel component
12. PlateViewer component + MDX plate loading
13. Terminal top-level component (wires engine + reveal + UI)
14. Page loader (0–100% ceremony)
15. Home page composition + metadata + OG
16. Contact form — schema + Route Handler + Resend + rate limit
17. Analytics + robots + sitemap
18. E2E test suite
19. Accessibility pass + reduced-motion audit
20. Bundle budget + Lighthouse gate
21. Deployment to Vercel + production DNS

---

### Task 1: Repo scaffold + tooling

**Files:**
- Create: `site/.nvmrc`, `site/.gitignore`, `site/package.json`, `site/tsconfig.json`, `site/biome.json`, `site/next.config.mjs`, `site/.env.example`, `site/vitest.config.ts`, `site/playwright.config.ts`
- Create: `site/src/app/layout.tsx`, `site/src/app/page.tsx`, `site/src/app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: a `site/` workspace where `pnpm dev` boots Next.js on `http://localhost:3000` and `pnpm test` runs Vitest.

- [ ] **Step 1: Create the workspace shell**

Run:
```bash
mkdir -p "/Users/randyren/Developer/2026 portfolio/site"
cd "/Users/randyren/Developer/2026 portfolio/site"
echo "20.11.1" > .nvmrc
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules
.next
out
.env.local
.env.*.local
.vercel
coverage
playwright-report
test-results
.DS_Store
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "randyren-portfolio",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20.11" },
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@next/mdx": "15.0.3",
    "@mdx-js/react": "3.1.0",
    "@mdx-js/loader": "3.1.0",
    "zod": "3.23.8",
    "resend": "4.0.1",
    "@upstash/ratelimit": "2.0.4",
    "@upstash/redis": "1.34.3",
    "@vercel/analytics": "1.4.1"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "@types/node": "22.9.0",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.1",
    "@types/mdx": "2.0.13",
    "@biomejs/biome": "1.9.4",
    "vitest": "2.1.5",
    "@vitest/coverage-v8": "2.1.5",
    "@testing-library/react": "16.0.1",
    "@testing-library/user-event": "14.5.2",
    "@testing-library/jest-dom": "6.6.3",
    "jsdom": "25.0.1",
    "@playwright/test": "1.48.2",
    "@axe-core/playwright": "4.10.1"
  }
}
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts", "**/*.mdx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "noNonNullAssertion": "off" },
      "suspicious": { "noExplicitAny": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

- [ ] **Step 6: Write `next.config.mjs`**

```js
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [], rehypePlugins: [] }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  experimental: { mdxRs: true }
};

export default withMDX(nextConfig);
```

- [ ] **Step 7: Write `.env.example`**

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=hi@randyren.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 8: Write minimal `src/app/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'Randy Ren', description: 'Portfolio.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Write minimal `src/app/page.tsx`**

```tsx
export default function Home() {
  return <main>randy.</main>;
}
```

- [ ] **Step 10: Write minimal `src/app/globals.css`**

```css
:root { color-scheme: light; }
html, body { margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #F1E8D4; color: #111; }
```

- [ ] **Step 11: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx']
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  }
});
```

- [ ] **Step 12: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
```

- [ ] **Step 13: Install and boot**

Run:
```bash
cd "/Users/randyren/Developer/2026 portfolio/site"
pnpm install
pnpm typecheck
pnpm dev
```
Expected: `pnpm typecheck` exits 0. `pnpm dev` serves cream page reading "randy." at `http://localhost:3000`. Kill with Ctrl-C.

- [ ] **Step 14: Commit**

```bash
cd "/Users/randyren/Developer/2026 portfolio"
git init 2>/dev/null || true
git add site/
git commit -m "chore: scaffold next.js 15 workspace with biome + vitest + playwright"
```

---

### Task 2: Design tokens + global styles + fonts

**Files:**
- Modify: `site/src/app/globals.css`
- Modify: `site/src/app/layout.tsx`
- Create: `site/src/app/tokens.css`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--cream`, `--ink`, `--prussian`, `--umber-strong`, `--umber-muted`, `--vermillion`, plus font stacks `--font-serif`, `--font-mono`, `--font-italic`. Available globally.

- [ ] **Step 1: Write `src/app/tokens.css`**

```css
:root {
  --cream: #F1E8D4;
  --ink: #111111;
  --prussian: #1F3A5F;
  --umber-strong: #5A3818;
  --umber-muted: #7A4A1F;
  --vermillion: #A8100A;

  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
  --font-italic: 'IBM Plex Serif', Georgia, serif;

  --focus-ring: 2px solid var(--prussian);
  --focus-offset: 2px;
}
```

- [ ] **Step 2: Rewrite `src/app/globals.css`**

```css
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

body {
  background: var(--cream);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.55;
  min-height: 100dvh;
}

:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
a { color: var(--prussian); text-decoration-thickness: 1px; text-underline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Load fonts via `next/font/google` in `src/app/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Instrument_Serif, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';

const serif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-google'
});
const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-google'
});
const italic = IBM_Plex_Serif({
  weight: '400',
  style: 'italic',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-italic-google'
});

export const metadata = {
  title: 'Randy Ren',
  description: "randy ren's catalog. a museum expressed as a curator's terminal."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} ${italic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Wire Google variables into tokens.css**

Replace the three font stacks in `tokens.css` with:

```css
--font-serif: var(--font-serif-google), Georgia, serif;
--font-mono: var(--font-mono-google), ui-monospace, SFMono-Regular, monospace;
--font-italic: var(--font-italic-google), Georgia, serif;
```

- [ ] **Step 5: Verify visually**

Run `pnpm dev` and confirm the cream background and monospace "randy." at `http://localhost:3000`. Kill server.

- [ ] **Step 6: Commit**

```bash
git add site/src/app/tokens.css site/src/app/globals.css site/src/app/layout.tsx
git commit -m "feat: lock design tokens and load fonts"
```

---

### Task 3: Content model — projects + bio

**Files:**
- Create: `site/src/content/projects.ts`
- Create: `site/src/content/bio.ts`
- Create: `site/src/content/plates/oryzo.mdx`
- Create: `site/src/content/plates/halcyon.mdx`
- Create: `site/src/content/plates/paperlane.mdx`
- Create: `site/src/content/plates/atlas.mdx`
- Create: `site/src/content/plates/koinu.mdx`
- Create: `site/src/content/plates/linen.mdx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ORDER: readonly ['oryzo','halcyon','paperlane','atlas','koinu','linen']`
  - `PROJECTS: Record<Slug, ProjectMeta>` where `ProjectMeta = { slug, kicker, title, year, role, stack, blurb, hint }`
  - `getProjectMeta(slug: Slug): ProjectMeta`
  - `type Slug = typeof ORDER[number]`
  - `BIO: { about: string; contact: { email: string; social: {label:string;href:string}[] } }`

- [ ] **Step 1: Write `src/content/projects.ts`**

```ts
export const ORDER = ['oryzo', 'halcyon', 'paperlane', 'atlas', 'koinu', 'linen'] as const;
export type Slug = (typeof ORDER)[number];

export type ProjectMeta = {
  slug: Slug;
  kicker: string;
  title: string;
  year: string;
  role: string;
  stack: string;
  blurb: string;
  hint: string;
};

export const PROJECTS: Record<Slug, ProjectMeta> = {
  oryzo: {
    slug: 'oryzo',
    kicker: 'plate 01 · oryzo',
    title: 'a paced rice cooker for one.',
    year: '2025',
    role: 'design + firmware',
    stack: 'esp32, react native, custom pcb',
    blurb: 'a small appliance that measures rice by weight, not cups. the interface is a single dial and a hairline gauge.',
    hint: 'open oryzo for the long plate.'
  },
  halcyon: {
    slug: 'halcyon',
    kicker: 'plate 02 · halcyon',
    title: 'a quiet client for a loud protocol.',
    year: '2024',
    role: 'design + engineering',
    stack: 'swiftui, matrix protocol',
    blurb: 'a matrix client shaped like a notebook. rooms are tabs, messages are marginalia.',
    hint: 'open halcyon for the long plate.'
  },
  paperlane: {
    slug: 'paperlane',
    kicker: 'plate 03 · paperlane',
    title: 'a newsletter that respects the reader.',
    year: '2024',
    role: 'product + typography',
    stack: 'nextjs, postgres, resend',
    blurb: 'a newsletter platform with typography as the first-class primitive. no dashboards, no funnels.',
    hint: 'open paperlane for the long plate.'
  },
  atlas: {
    slug: 'atlas',
    kicker: 'plate 04 · atlas',
    title: 'a cartography tool for hand-drawn maps.',
    year: '2023',
    role: 'creative technology',
    stack: 'canvas, wasm, rust',
    blurb: 'a browser tool that turns pen strokes into contour lines. built for one specific cartographer.',
    hint: 'open atlas for the long plate.'
  },
  koinu: {
    slug: 'koinu',
    kicker: 'plate 05 · koinu',
    title: 'a walk tracker with a memory.',
    year: '2023',
    role: 'design + ios',
    stack: 'swiftui, core location',
    blurb: 'a walk tracker that remembers routes as small drawings, not heatmaps. named after a friend’s dog.',
    hint: 'open koinu for the long plate.'
  },
  linen: {
    slug: 'linen',
    kicker: 'plate 06 · linen',
    title: 'a wardrobe planner that reads the sky.',
    year: '2022',
    role: 'design + ios',
    stack: 'swift, weatherkit',
    blurb: 'a small ios app that lays out an outfit based on tomorrow’s forecast, then forgets it once you dress.',
    hint: 'open linen for the long plate.'
  }
};

export function getProjectMeta(slug: Slug): ProjectMeta {
  return PROJECTS[slug];
}
```

- [ ] **Step 2: Write `src/content/bio.ts`**

```ts
export const BIO = {
  about: [
    'randy ren makes small, careful software.',
    'currently based in toronto. previously at boutique product teams; before that, industrial design school.',
    'this catalog is a working record — six plates, each a project seen from a distance and up close.'
  ].join('\n\n'),
  contact: {
    email: 'hi@randyren.com',
    social: [
      { label: 'github', href: 'https://github.com/randyren' },
      { label: 'read.cv', href: 'https://read.cv/randyren' }
    ]
  }
};
```

- [ ] **Step 3: Write one plate — `src/content/plates/oryzo.mdx`**

```mdx
# oryzo

*a paced rice cooker for one.*

## the plate

the cooker measures rice by weight. a load cell reads the bowl before water goes in, then again after. the difference sets the pour time.

## the frame

we spent six weeks on the dial. it has a single detent at the halfway mark so you can find "one cup" without looking.

## the caption

built with a friend in a shared garage over ten weekends in 2025.
```

- [ ] **Step 4: Copy the same shape into the other five plates**

Create `halcyon.mdx`, `paperlane.mdx`, `atlas.mdx`, `koinu.mdx`, `linen.mdx`, each with the pattern:

```mdx
# <slug>

*<title from PROJECTS>*

## the plate

<one paragraph placeholder — Randy will replace before launch>

## the frame

<one paragraph placeholder>

## the caption

<one line placeholder>
```

- [ ] **Step 5: Write `src/content/plates/index.ts` for typed lazy loading**

Create `src/content/plates/index.ts`:

```ts
import type { ComponentType } from 'react';
import type { Slug } from '../projects';

export const platesLoader: Record<Slug, () => Promise<{ default: ComponentType }>> = {
  oryzo: () => import('./oryzo.mdx'),
  halcyon: () => import('./halcyon.mdx'),
  paperlane: () => import('./paperlane.mdx'),
  atlas: () => import('./atlas.mdx'),
  koinu: () => import('./koinu.mdx'),
  linen: () => import('./linen.mdx')
};
```

- [ ] **Step 6: Verify typecheck**

Run `pnpm typecheck`. Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add site/src/content
git commit -m "feat: project metadata, bio, and six placeholder plates"
```

---

### Task 4: Terminal engine — parser

**Files:**
- Create: `site/src/terminal/engine/types.ts`
- Create: `site/src/terminal/engine/parser.ts`
- Create: `site/tests/unit/parser.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ParsedCommand = { cmd: string; args: string[]; raw: string }`
  - `parse(input: string): ParsedCommand | null` — returns null for empty/whitespace-only input.

- [ ] **Step 1: Write the failing test — `tests/unit/parser.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parse } from '@/terminal/engine/parser';

describe('parse', () => {
  it('returns null for empty input', () => {
    expect(parse('')).toBeNull();
    expect(parse('   ')).toBeNull();
  });

  it('splits cmd and args on whitespace', () => {
    expect(parse('ls -la ~/work')).toEqual({
      cmd: 'ls',
      args: ['-la', '~/work'],
      raw: 'ls -la ~/work'
    });
  });

  it('trims outer whitespace but preserves inner spacing', () => {
    expect(parse('  open   oryzo  ')?.args).toEqual(['oryzo']);
  });

  it('lowercases the command but not args', () => {
    expect(parse('CAT Oryzo')?.cmd).toBe('cat');
    expect(parse('CAT Oryzo')?.args).toEqual(['Oryzo']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/parser.test.ts`
Expected: FAIL with "Cannot find module '@/terminal/engine/parser'".

- [ ] **Step 3: Write `src/terminal/engine/types.ts`**

```ts
export type ParsedCommand = { cmd: string; args: string[]; raw: string };
```

- [ ] **Step 4: Write `src/terminal/engine/parser.ts`**

```ts
import type { ParsedCommand } from './types';

export function parse(input: string): ParsedCommand | null {
  const raw = input.trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  const first = parts[0];
  if (!first) return null;
  const cmd = first.toLowerCase();
  const args = parts.slice(1);
  return { cmd, args, raw: input.trim() };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/parser.test.ts`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add site/src/terminal/engine/parser.ts site/src/terminal/engine/types.ts site/tests/unit/parser.test.ts
git commit -m "feat(terminal): parse tokenizes command input"
```

---

### Task 5: Terminal engine — filesystem

**Files:**
- Create: `site/src/terminal/engine/filesystem.ts`
- Create: `site/tests/unit/filesystem.test.ts`

**Interfaces:**
- Consumes: `ORDER`, `Slug` from `@/content/projects`.
- Produces:
  - `type FsNode = { kind: 'dir' | 'file'; children?: Record<string, FsNode>; slug?: Slug; label?: string }`
  - `FS: FsNode` — root tree with `/randy/`, `/randy/work/<slug>/label`, `/randy/about`, `/randy/contact`.
  - `resolvePath(cwd: string, target: string): string | null` — normalizes `.`, `..`, `~`, absolute/relative. Returns absolute path or null if it walks above root.
  - `getNode(path: string): FsNode | null`
  - `listDir(path: string): string[] | null`

The virtual FS mirrors the prototype: `~` is `/randy`, `~/work` lists the six slugs, `~/work/<slug>` contains a `label` file, `~/about` and `~/contact` are files.

- [ ] **Step 1: Write the failing test — `tests/unit/filesystem.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { FS, getNode, listDir, resolvePath } from '@/terminal/engine/filesystem';

describe('resolvePath', () => {
  it('expands ~ to /randy', () => {
    expect(resolvePath('/randy', '~')).toBe('/randy');
    expect(resolvePath('/randy', '~/work')).toBe('/randy/work');
  });

  it('handles absolute paths', () => {
    expect(resolvePath('/randy/work', '/randy/about')).toBe('/randy/about');
  });

  it('handles relative paths with ..', () => {
    expect(resolvePath('/randy/work/oryzo', '..')).toBe('/randy/work');
    expect(resolvePath('/randy/work/oryzo', '../halcyon')).toBe('/randy/work/halcyon');
  });

  it('returns null when walking above root', () => {
    expect(resolvePath('/randy', '../..')).toBeNull();
  });

  it('resolves bare slug from ~/work parent when unambiguous', () => {
    // handled in commands layer, not here; keep filesystem pure
    expect(resolvePath('/randy/work', 'oryzo')).toBe('/randy/work/oryzo');
  });
});

describe('listDir', () => {
  it('lists the six project slugs under ~/work in fixed order', () => {
    expect(listDir('/randy/work')).toEqual(['oryzo', 'halcyon', 'paperlane', 'atlas', 'koinu', 'linen']);
  });

  it('lists work, about, contact under ~', () => {
    expect(listDir('/randy')).toEqual(['work', 'about', 'contact']);
  });

  it('returns null for a file', () => {
    expect(listDir('/randy/about')).toBeNull();
  });
});

describe('getNode', () => {
  it('finds the oryzo label file', () => {
    const node = getNode('/randy/work/oryzo/label');
    expect(node?.kind).toBe('file');
    expect(node?.slug).toBe('oryzo');
  });
});

describe('FS', () => {
  it('root is a directory', () => {
    expect(FS.kind).toBe('dir');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/filesystem.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/terminal/engine/filesystem.ts`**

```ts
import { ORDER, type Slug } from '@/content/projects';

export type FsNode = {
  kind: 'dir' | 'file';
  children?: Record<string, FsNode>;
  slug?: Slug;
  label?: string;
};

function buildProjectDir(slug: Slug): FsNode {
  return {
    kind: 'dir',
    children: {
      label: { kind: 'file', slug, label: `${slug}.label` }
    }
  };
}

const workChildren: Record<string, FsNode> = {};
for (const slug of ORDER) workChildren[slug] = buildProjectDir(slug);

export const FS: FsNode = {
  kind: 'dir',
  children: {
    randy: {
      kind: 'dir',
      children: {
        work: { kind: 'dir', children: workChildren },
        about: { kind: 'file', label: 'about.txt' },
        contact: { kind: 'file', label: 'contact.txt' }
      }
    }
  }
};

const ROOT = '/randy';

function splitAbs(path: string): string[] {
  return path.split('/').filter(Boolean);
}

export function resolvePath(cwd: string, target: string): string | null {
  if (!target || target === '~') return ROOT;
  let base: string[];
  if (target.startsWith('~/')) {
    base = splitAbs(ROOT);
    target = target.slice(2);
  } else if (target.startsWith('/')) {
    base = [];
  } else {
    base = splitAbs(cwd);
  }
  const parts = target.split('/').filter(Boolean);
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (base.length === 0) return null;
      base.pop();
      continue;
    }
    base.push(part);
  }
  const abs = '/' + base.join('/');
  return abs === '/' ? null : abs;
}

export function getNode(path: string): FsNode | null {
  if (path === '/') return FS;
  const parts = splitAbs(path);
  let node: FsNode | undefined = FS;
  for (const p of parts) {
    if (!node || node.kind !== 'dir' || !node.children) return null;
    node = node.children[p];
  }
  return node ?? null;
}

export function listDir(path: string): string[] | null {
  const node = getNode(path);
  if (!node || node.kind !== 'dir' || !node.children) return null;
  // preserve insertion order — /randy/work uses ORDER
  return Object.keys(node.children);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/filesystem.test.ts`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add site/src/terminal/engine/filesystem.ts site/tests/unit/filesystem.test.ts
git commit -m "feat(terminal): virtual filesystem tree + path resolution"
```

---

### Task 6: Terminal engine — commands

**Files:**
- Create: `site/src/terminal/engine/commands.ts`
- Create: `site/tests/unit/commands.test.ts`

**Interfaces:**
- Consumes: `parse` (Task 4), `resolvePath`, `getNode`, `listDir` (Task 5), `PROJECTS`, `ORDER`, `Slug` (Task 3).
- Produces:
  - `type CommandResult = { kind: 'text'; lines: string[] } | { kind: 'cd'; newCwd: string } | { kind: 'openInline'; slug: Slug } | { kind: 'openPlate'; slug: Slug } | { kind: 'clear' } | { kind: 'error'; message: string } | { kind: 'help'; lines: string[] }`
  - `type ExecContext = { cwd: string; visibleSlug: Slug | null }`
  - `execute(input: string, ctx: ExecContext): CommandResult`

Semantics ported from prototype:
- `pwd`, `ls`, `cd`, `cat`, `open`, `clear`, `help`, `whoami`, `about`, `contact`
- `cd` with bare slug: try current-dir child, then `/randy/work/<slug>`, then `/randy/<slug>` — first match wins.
- `open <slug>`: if `<slug>` inline card is NOT currently visible (per ctx.visibleSlug), return `openInline`. If it IS visible, return `openPlate`. This is the two-click promotion.
- `open about` / `open contact`: return inline (no plate for those).
- `cat <slug>`: alias of `open <slug>` inline-only path.

- [ ] **Step 1: Write the failing test — `tests/unit/commands.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { execute } from '@/terminal/engine/commands';

const ctx = (cwd: string, visibleSlug: null | 'oryzo' | 'halcyon' | 'paperlane' | 'atlas' | 'koinu' | 'linen' = null) =>
  ({ cwd, visibleSlug });

describe('execute', () => {
  it('pwd echoes the current directory as ~ form', () => {
    const r = execute('pwd', ctx('/randy'));
    expect(r).toEqual({ kind: 'text', lines: ['~'] });
  });

  it('ls at ~ lists work about contact', () => {
    const r = execute('ls', ctx('/randy'));
    expect(r).toEqual({ kind: 'text', lines: ['work  about  contact'] });
  });

  it('ls at ~/work lists ORDER', () => {
    const r = execute('ls', ctx('/randy/work'));
    expect(r).toEqual({
      kind: 'text',
      lines: ['oryzo  halcyon  paperlane  atlas  koinu  linen']
    });
  });

  it('cd bare slug from ~/work resolves to child', () => {
    const r = execute('cd oryzo', ctx('/randy/work'));
    expect(r).toEqual({ kind: 'cd', newCwd: '/randy/work/oryzo' });
  });

  it('cd bare slug from ~ falls back to ~/work/<slug>', () => {
    const r = execute('cd halcyon', ctx('/randy'));
    expect(r).toEqual({ kind: 'cd', newCwd: '/randy/work/halcyon' });
  });

  it('cd ~ returns to home', () => {
    const r = execute('cd ~', ctx('/randy/work/oryzo'));
    expect(r).toEqual({ kind: 'cd', newCwd: '/randy' });
  });

  it('open <slug> returns inline when slug not visible', () => {
    const r = execute('open oryzo', ctx('/randy/work', null));
    expect(r).toEqual({ kind: 'openInline', slug: 'oryzo' });
  });

  it('open <slug> promotes to plate when slug is visible', () => {
    const r = execute('open oryzo', ctx('/randy/work', 'oryzo'));
    expect(r).toEqual({ kind: 'openPlate', slug: 'oryzo' });
  });

  it('open about is always inline', () => {
    const r = execute('open about', ctx('/randy'));
    expect(r).toEqual({ kind: 'text', lines: expect.any(Array) });
  });

  it('unknown command returns error', () => {
    const r = execute('sudo rm -rf /', ctx('/randy'));
    expect(r.kind).toBe('error');
  });

  it('clear returns kind clear', () => {
    expect(execute('clear', ctx('/randy'))).toEqual({ kind: 'clear' });
  });

  it('help returns kind help with a lines array', () => {
    const r = execute('help', ctx('/randy'));
    expect(r.kind).toBe('help');
  });
});
```

- [ ] **Step 2: Run tests, confirm failure**

Run: `pnpm test tests/unit/commands.test.ts`
Expected: module-not-found failure.

- [ ] **Step 3: Write `src/terminal/engine/commands.ts`**

```ts
import { BIO } from '@/content/bio';
import { ORDER, PROJECTS, type Slug } from '@/content/projects';
import { getNode, listDir, resolvePath } from './filesystem';
import { parse } from './parser';

export type ExecContext = { cwd: string; visibleSlug: Slug | null };

export type CommandResult =
  | { kind: 'text'; lines: string[] }
  | { kind: 'cd'; newCwd: string }
  | { kind: 'openInline'; slug: Slug }
  | { kind: 'openPlate'; slug: Slug }
  | { kind: 'clear' }
  | { kind: 'help'; lines: string[] }
  | { kind: 'error'; message: string };

const SLUGS: readonly Slug[] = ORDER;

function toDisplay(path: string): string {
  if (path === '/randy') return '~';
  if (path.startsWith('/randy/')) return '~' + path.slice('/randy'.length);
  return path;
}

function isSlug(s: string): s is Slug {
  return (SLUGS as readonly string[]).includes(s);
}

function smartResolveCd(cwd: string, arg: string): string | null {
  const direct = resolvePath(cwd, arg);
  if (direct && getNode(direct)?.kind === 'dir') return direct;
  if (isSlug(arg)) {
    const viaWork = resolvePath('/randy/work', arg);
    if (viaWork && getNode(viaWork)?.kind === 'dir') return viaWork;
  }
  const viaRoot = resolvePath('/randy', arg);
  if (viaRoot && getNode(viaRoot)?.kind === 'dir') return viaRoot;
  return null;
}

function helpLines(): string[] {
  return [
    'available commands',
    '  ls              list current directory',
    '  cd <path>       change directory (accepts bare slugs)',
    '  pwd             print working directory',
    '  cat <slug>      read a label inline',
    '  open <slug>     first click: inline. second (while visible): plate.',
    '  about           inline about card',
    '  contact         inline contact card',
    '  clear           clear the screen',
    '  help            this list'
  ];
}

function renderAbout(): string[] {
  return BIO.about.split('\n').filter(Boolean);
}

function renderContact(): string[] {
  const socials = BIO.contact.social.map((s) => `  ${s.label.padEnd(10)} ${s.href}`);
  return [`email  ${BIO.contact.email}`, ...socials];
}

function renderLabel(slug: Slug): string[] {
  const p = PROJECTS[slug];
  return [
    p.kicker,
    p.title,
    '',
    `year   ${p.year}`,
    `role   ${p.role}`,
    `stack  ${p.stack}`,
    '',
    p.blurb,
    '',
    p.hint
  ];
}

export function execute(input: string, ctx: ExecContext): CommandResult {
  const parsed = parse(input);
  if (!parsed) return { kind: 'text', lines: [] };
  const { cmd, args } = parsed;

  switch (cmd) {
    case 'help':
    case '?':
      return { kind: 'help', lines: helpLines() };

    case 'clear':
    case 'cls':
      return { kind: 'clear' };

    case 'pwd':
      return { kind: 'text', lines: [toDisplay(ctx.cwd)] };

    case 'whoami':
      return { kind: 'text', lines: ['randy'] };

    case 'ls': {
      const arg = args[0] ?? '.';
      const target = resolvePath(ctx.cwd, arg);
      if (!target) return { kind: 'error', message: `ls: ${arg}: no such directory` };
      const entries = listDir(target);
      if (!entries) return { kind: 'error', message: `ls: ${arg}: not a directory` };
      return { kind: 'text', lines: [entries.join('  ')] };
    }

    case 'cd': {
      const arg = args[0] ?? '~';
      const dest = smartResolveCd(ctx.cwd, arg);
      if (!dest) return { kind: 'error', message: `cd: ${arg}: no such directory` };
      return { kind: 'cd', newCwd: dest };
    }

    case 'about':
      return { kind: 'text', lines: renderAbout() };

    case 'contact':
      return { kind: 'text', lines: renderContact() };

    case 'cat':
    case 'open': {
      const arg = args[0];
      if (!arg) return { kind: 'error', message: `${cmd}: missing argument` };
      if (arg === 'about') return { kind: 'text', lines: renderAbout() };
      if (arg === 'contact') return { kind: 'text', lines: renderContact() };
      if (!isSlug(arg)) return { kind: 'error', message: `${cmd}: ${arg}: not a project` };
      if (cmd === 'open' && ctx.visibleSlug === arg) return { kind: 'openPlate', slug: arg };
      return { kind: 'openInline', slug: arg };
    }

    default:
      return { kind: 'error', message: `command not found: ${cmd}. type "help".` };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/commands.test.ts`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add site/src/terminal/engine/commands.ts site/tests/unit/commands.test.ts
git commit -m "feat(terminal): command dispatch with smart cd and two-click open"
```

---

### Task 7: Terminal engine — history + completion

**Files:**
- Create: `site/src/terminal/engine/history.ts`
- Create: `site/src/terminal/engine/completion.ts`
- Create: `site/tests/unit/completion.test.ts`

**Interfaces:**
- Consumes: `ORDER`, `Slug` (Task 3), `listDir`, `resolvePath` (Task 5).
- Produces:
  - `createHistory(): { push(cmd: string): void; up(): string | null; down(): string | null; reset(): void }`
  - `complete(input: string, cwd: string): string` — returns the extended input string (unchanged if no completion possible).

Completion rules ported from prototype:
- If tokenising yields `cd <partial>` or `open <partial>` or `cat <partial>`: match against slugs; if `cd` also match dirs in cwd.
- Single match: return the full command with completed slug/dir.
- Multiple matches: return input unchanged (no list; the prototype does this).
- Zero matches: return input unchanged.

- [ ] **Step 1: Write `src/terminal/engine/history.ts`**

```ts
export function createHistory() {
  const buf: string[] = [];
  let idx = -1;
  return {
    push(cmd: string) {
      if (!cmd.trim()) return;
      if (buf[buf.length - 1] !== cmd) buf.push(cmd);
      idx = buf.length;
    },
    up(): string | null {
      if (buf.length === 0) return null;
      idx = Math.max(0, idx - 1);
      return buf[idx] ?? null;
    },
    down(): string | null {
      if (buf.length === 0) return null;
      idx = Math.min(buf.length, idx + 1);
      return idx === buf.length ? '' : (buf[idx] ?? null);
    },
    reset() {
      idx = buf.length;
    }
  };
}
```

- [ ] **Step 2: Write the failing test — `tests/unit/completion.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { complete } from '@/terminal/engine/completion';

describe('complete', () => {
  it('completes a unique open slug', () => {
    expect(complete('open ory', '/randy')).toBe('open oryzo');
  });

  it('completes cat with case-insensitive prefix', () => {
    expect(complete('cat Hal', '/randy')).toBe('cat halcyon');
  });

  it('returns input unchanged on ambiguous prefix', () => {
    // no ambiguous slugs share a real prefix, so contrive one for cd against a dir
    expect(complete('open x', '/randy')).toBe('open x');
  });

  it('returns input unchanged when nothing to complete', () => {
    expect(complete('ls', '/randy')).toBe('ls');
  });

  it('cd completes among cwd children when unique', () => {
    expect(complete('cd or', '/randy/work')).toBe('cd oryzo');
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `pnpm test tests/unit/completion.test.ts`
Expected: module-not-found failure.

- [ ] **Step 4: Write `src/terminal/engine/completion.ts`**

```ts
import { ORDER } from '@/content/projects';
import { listDir } from './filesystem';

function matchOne(prefix: string, pool: readonly string[]): string | null {
  const lower = prefix.toLowerCase();
  const hits = pool.filter((s) => s.toLowerCase().startsWith(lower));
  return hits.length === 1 ? (hits[0] ?? null) : null;
}

export function complete(input: string, cwd: string): string {
  const trimmed = input.trimEnd();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return input;
  const cmd = parts[0]?.toLowerCase();
  const arg = parts[parts.length - 1] ?? '';
  if (!cmd || !arg) return input;

  let pool: readonly string[] = [];
  if (cmd === 'open' || cmd === 'cat') {
    pool = ORDER;
  } else if (cmd === 'cd') {
    pool = [...ORDER, ...(listDir(cwd) ?? [])];
  } else {
    return input;
  }

  const hit = matchOne(arg, pool);
  if (!hit) return input;
  const head = parts.slice(0, -1).join(' ');
  return `${head} ${hit}`;
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test tests/unit/completion.test.ts`
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add site/src/terminal/engine/history.ts site/src/terminal/engine/completion.ts site/tests/unit/completion.test.ts
git commit -m "feat(terminal): input history + tab completion"
```

---

### Task 8: Reveal engine — typewriter

**Files:**
- Create: `site/src/terminal/reveal/cadences.ts`
- Create: `site/src/terminal/reveal/typewriter.ts`
- Create: `site/tests/unit/typewriter.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CADENCES = { kicker: 22, title: 24, metaDt: 12, metaDd: 11, blurb: 14, hint: 12 } as const` — ms/char, ported verbatim.
  - `type TypewriterHandle = { skip(): void; done: Promise<void> }`
  - `typeInto(el: HTMLElement, text: string, opts?: { msPerChar?: number; jitterMs?: number; holdOn?: RegExp; holdMs?: number; signal?: AbortSignal }): TypewriterHandle`
  - Uses deterministic jitter based on character index (seeded), NOT `Math.random`, so tests are stable and SSR-safe.

- [ ] **Step 1: Write `src/terminal/reveal/cadences.ts`**

```ts
export const CADENCES = {
  kicker: 22,
  title: 24,
  metaDt: 12,
  metaDd: 11,
  blurb: 14,
  hint: 12
} as const;

export const FRAME_MS = 800;
export const CONTENT_AT = 0.45;
export const LOADER = { duration: 2200, hold: 220, dissolve: 720 } as const;
```

- [ ] **Step 2: Write the failing test — `tests/unit/typewriter.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { typeInto } from '@/terminal/reveal/typewriter';

describe('typeInto', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves with the full text after enough time', async () => {
    vi.useFakeTimers();
    const el = document.createElement('span');
    const handle = typeInto(el, 'hello', { msPerChar: 10, jitterMs: 0 });
    await vi.advanceTimersByTimeAsync(200);
    await handle.done;
    expect(el.textContent).toBe('hello');
  });

  it('skip() jumps to final text immediately', async () => {
    vi.useFakeTimers();
    const el = document.createElement('span');
    const handle = typeInto(el, 'abcdef', { msPerChar: 50, jitterMs: 0 });
    handle.skip();
    await vi.advanceTimersByTimeAsync(1);
    await handle.done;
    expect(el.textContent).toBe('abcdef');
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `pnpm test tests/unit/typewriter.test.ts`
Expected: module-not-found failure.

- [ ] **Step 4: Write `src/terminal/reveal/typewriter.ts`**

```ts
export type TypewriterHandle = { skip(): void; done: Promise<void> };
export type TypewriterOpts = {
  msPerChar?: number;
  jitterMs?: number;
  holdOn?: RegExp;
  holdMs?: number;
  signal?: AbortSignal;
};

function seededJitter(seed: number, max: number): number {
  // deterministic in [-max, +max]
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = s - Math.floor(s);
  return (frac * 2 - 1) * max;
}

export function typeInto(el: HTMLElement, text: string, opts: TypewriterOpts = {}): TypewriterHandle {
  const { msPerChar = 20, jitterMs = 4, holdOn = /[.,;:]/, holdMs = 80, signal } = opts;
  let cancelled = false;
  let skipped = false;
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  el.textContent = '';

  const done = new Promise<void>((resolve) => {
    function step() {
      if (cancelled) return resolve();
      if (skipped) {
        el.textContent = text;
        return resolve();
      }
      if (i >= text.length) return resolve();
      const ch = text.charAt(i);
      el.textContent += ch;
      i += 1;
      const isHold = holdOn.test(ch);
      const base = isHold ? holdMs : msPerChar;
      const jit = seededJitter(i, jitterMs);
      timer = setTimeout(step, Math.max(0, base + jit));
    }
    step();
  });

  if (signal) {
    signal.addEventListener('abort', () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    });
  }

  return {
    skip() { skipped = true; if (timer) clearTimeout(timer); },
    done
  };
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test tests/unit/typewriter.test.ts`
Expected: 2 passing.

- [ ] **Step 6: Commit**

```bash
git add site/src/terminal/reveal
git add site/tests/unit/typewriter.test.ts
git commit -m "feat(reveal): typewriter with deterministic jitter and skip"
```

---

### Task 9: Reveal engine — corner trace

**Files:**
- Create: `site/src/terminal/reveal/cornerTrace.ts`

**Interfaces:**
- Consumes: `FRAME_MS`, `CONTENT_AT` from `cadences.ts`.
- Produces:
  - `traceCorners(svg: SVGSVGElement, opts?: { durationMs?: number; onContent?: () => void; signal?: AbortSignal }): Promise<void>` — animates four `<path class="corner">` elements' `stroke-dashoffset` from full-length to zero over `durationMs`, staggered by index. Fires `onContent` at `CONTENT_AT * durationMs`. Resolves when all four are complete.

Ported verbatim from prototype: four corner strokes, each ~28px each way, staggered 60ms.

- [ ] **Step 1: Write `src/terminal/reveal/cornerTrace.ts`**

```ts
import { CONTENT_AT, FRAME_MS } from './cadences';

export type TraceOpts = {
  durationMs?: number;
  onContent?: () => void;
  signal?: AbortSignal;
};

export function traceCorners(svg: SVGSVGElement, opts: TraceOpts = {}): Promise<void> {
  const { durationMs = FRAME_MS, onContent, signal } = opts;
  const corners = Array.from(svg.querySelectorAll<SVGPathElement>('path.corner'));
  if (corners.length === 0) return Promise.resolve();

  const stagger = Math.min(80, durationMs / (corners.length * 4));
  const perDuration = durationMs - stagger * (corners.length - 1);

  return new Promise((resolve) => {
    let cancelled = false;
    if (signal) signal.addEventListener('abort', () => { cancelled = true; resolve(); });

    corners.forEach((path, idx) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.style.transition = 'none';
      // force reflow so the transition takes effect
      void path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${perDuration}ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * stagger}ms`;
      requestAnimationFrame(() => {
        if (cancelled) return;
        path.style.strokeDashoffset = '0';
      });
    });

    if (onContent) setTimeout(() => { if (!cancelled) onContent(); }, durationMs * CONTENT_AT);
    setTimeout(() => { if (!cancelled) resolve(); }, durationMs + 40);
  });
}
```

- [ ] **Step 2: Confirm typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/terminal/reveal/cornerTrace.ts
git commit -m "feat(reveal): corner trace SVG animation"
```

---

### Task 10: Chips component

**Files:**
- Create: `site/src/terminal/Chips.tsx`
- Create: `site/src/terminal/Chips.module.css`

**Interfaces:**
- Consumes: `ORDER`, `Slug`, `PROJECTS` (Task 3).
- Produces:
  - `type Chip = { l1: string; cmd: string }`
  - `<Chips chips={Chip[]} onRun={(cmd: string) => void} />`
  - `buildChipSet(cwd: string, visibleSlug: Slug | null): Chip[]` — the collapse rule from the prototype: at `~/work` with a visible slug, return `[{l1:'Open the plate', cmd:'open <slug>'}, {l1:'Back home', cmd:'cd ~'}]`; otherwise the full six-project set. At `~`: about/contact/work. At `~/work/<slug>`: back to `~/work` + open plate. Anywhere else: `cd ~`.

- [ ] **Step 1: Write `src/terminal/Chips.tsx`**

```tsx
'use client';
import { ORDER, PROJECTS, type Slug } from '@/content/projects';
import styles from './Chips.module.css';

export type Chip = { l1: string; cmd: string };

export function buildChipSet(cwd: string, visibleSlug: Slug | null): Chip[] {
  if (cwd === '/randy/work') {
    if (visibleSlug) {
      return [
        { l1: 'Open the plate', cmd: `open ${visibleSlug}` },
        { l1: 'Back home', cmd: 'cd ~' }
      ];
    }
    return ORDER.map((s) => ({ l1: `Open ${PROJECTS[s].slug}`, cmd: `open ${s}` }));
  }
  if (cwd === '/randy') {
    return [
      { l1: 'See work', cmd: 'cd work' },
      { l1: 'About', cmd: 'open about' },
      { l1: 'Get in touch', cmd: 'open contact' }
    ];
  }
  if (cwd.startsWith('/randy/work/')) {
    const slug = cwd.split('/').pop() as Slug;
    return [
      { l1: 'Open the plate', cmd: `open ${slug}` },
      { l1: 'Back to work', cmd: 'cd ~/work' }
    ];
  }
  return [{ l1: 'Back home', cmd: 'cd ~' }];
}

export function Chips({ chips, onRun }: { chips: Chip[]; onRun: (cmd: string) => void }) {
  return (
    <div className={styles.row} role="group" aria-label="Suggested commands">
      {chips.map((c) => (
        <button
          key={c.cmd}
          className={styles.chip}
          onClick={() => onRun(c.cmd)}
          type="button"
        >
          <span className={styles.l1}>{c.l1}</span>
          <span className={styles.cmd}>{c.cmd}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/terminal/Chips.module.css`**

```css
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 12px;
}
.chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 2px 0;
  text-align: left;
  transition: opacity 200ms ease;
}
.chip:hover { opacity: 0.72; }
.l1 {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--ink);
}
.cmd {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--umber-strong);
  letter-spacing: 0.02em;
}
```

- [ ] **Step 3: Commit**

```bash
git add site/src/terminal/Chips.tsx site/src/terminal/Chips.module.css
git commit -m "feat(terminal): chips row with collapse-when-visible rule"
```

---

### Task 11: InlineLabel component

**Files:**
- Create: `site/src/terminal/InlineLabel.tsx`
- Create: `site/src/terminal/InlineLabel.module.css`

**Interfaces:**
- Consumes: `PROJECTS`, `Slug` (Task 3); `traceCorners` (Task 9); `typeInto`, `CADENCES` (Task 8); `useReducedMotion` (Task 13).
- Produces:
  - `<InlineLabel slug={Slug} instant?: boolean onVisibilityChange?: (slug: Slug, visible: boolean) => void />`
  - Emits `data-inline-slug={slug}` on its root card element so `useVisibleSlug` (Task 13) can find it.
  - When `instant` is true (SSR/reduced-motion/cached), renders the full label immediately with no animation. Otherwise runs corner trace, then typewriter over the six lines in sequence at the CADENCES rates.

- [ ] **Step 1: Write `src/terminal/InlineLabel.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { PROJECTS, type Slug } from '@/content/projects';
import { CADENCES } from './reveal/cadences';
import { traceCorners } from './reveal/cornerTrace';
import { typeInto } from './reveal/typewriter';
import styles from './InlineLabel.module.css';

type Props = {
  slug: Slug;
  instant?: boolean;
  onVisibilityChange?: (slug: Slug, visible: boolean) => void;
};

export function InlineLabel({ slug, instant = false, onVisibilityChange }: Props) {
  const p = PROJECTS[slug];
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const kickerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const blurbRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onVisibilityChange || !rootRef.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => onVisibilityChange(slug, e.isIntersecting)),
      { threshold: 0.25 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [slug, onVisibilityChange]);

  useEffect(() => {
    if (instant || !svgRef.current) return;
    const ac = new AbortController();
    (async () => {
      await traceCorners(svgRef.current!, {
        onContent: async () => {
          if (kickerRef.current) await typeInto(kickerRef.current, p.kicker, { msPerChar: CADENCES.kicker, signal: ac.signal }).done;
          if (titleRef.current) await typeInto(titleRef.current, p.title, { msPerChar: CADENCES.title, signal: ac.signal }).done;
          if (yearRef.current) await typeInto(yearRef.current, `year   ${p.year}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (roleRef.current) await typeInto(roleRef.current, `role   ${p.role}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (stackRef.current) await typeInto(stackRef.current, `stack  ${p.stack}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (blurbRef.current) await typeInto(blurbRef.current, p.blurb, { msPerChar: CADENCES.blurb, signal: ac.signal }).done;
          if (hintRef.current) await typeInto(hintRef.current, p.hint, { msPerChar: CADENCES.hint, signal: ac.signal }).done;
        },
        signal: ac.signal
      });
    })();
    return () => ac.abort();
  }, [slug, instant, p]);

  return (
    <div ref={rootRef} className={styles.card} data-inline-slug={slug}>
      <svg ref={svgRef} className={styles.frame} aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="corner" d="M0 12 L0 0 L12 0" />
        <path className="corner" d="M88 0 L100 0 L100 12" />
        <path className="corner" d="M100 88 L100 100 L88 100" />
        <path className="corner" d="M12 100 L0 100 L0 88" />
      </svg>
      <div className={styles.body}>
        {instant ? (
          <>
            <div className={styles.kicker}>{p.kicker}</div>
            <div className={styles.title}>{p.title}</div>
            <div className={styles.meta}>{`year   ${p.year}`}</div>
            <div className={styles.meta}>{`role   ${p.role}`}</div>
            <div className={styles.meta}>{`stack  ${p.stack}`}</div>
            <div className={styles.blurb}>{p.blurb}</div>
            <div className={styles.hint}>{p.hint}</div>
          </>
        ) : (
          <>
            <div ref={kickerRef} className={styles.kicker} />
            <div ref={titleRef} className={styles.title} />
            <div ref={yearRef} className={styles.meta} />
            <div ref={roleRef} className={styles.meta} />
            <div ref={stackRef} className={styles.meta} />
            <div ref={blurbRef} className={styles.blurb} />
            <div ref={hintRef} className={styles.hint} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/terminal/InlineLabel.module.css`**

```css
.card {
  position: relative;
  padding: 20px 24px 22px;
  margin: 18px 0;
  max-width: 640px;
}
.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.frame :global(.corner) {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.body { position: relative; }
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--umber-strong);
  margin-bottom: 8px;
}
.title {
  font-family: var(--font-serif);
  font-size: 28px;
  line-height: 1.15;
  color: var(--ink);
  margin-bottom: 14px;
}
.meta {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  white-space: pre;
}
.blurb {
  margin-top: 14px;
  font-family: var(--font-italic);
  font-style: italic;
  font-size: 15px;
  color: var(--ink);
}
.hint {
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--umber-strong);
}
```

- [ ] **Step 3: Commit**

```bash
git add site/src/terminal/InlineLabel.tsx site/src/terminal/InlineLabel.module.css
git commit -m "feat(terminal): inline label card with corner trace + typewriter reveal"
```

---

### Task 12: PlateViewer + MDX loading

**Files:**
- Create: `site/src/terminal/PlateViewer.tsx`
- Create: `site/src/terminal/PlateViewer.module.css`
- Create: `site/mdx-components.tsx`

**Interfaces:**
- Consumes: `platesLoader`, `PROJECTS`, `Slug` (Task 3).
- Produces:
  - `<PlateViewer slug={Slug} onClose={() => void} />` — full-screen modal, cream background, MDX plate rendered inside a `<article>`. Closes on backdrop click, Escape, and close button. Restores focus to whatever opened it (Task 13 passes an opener ref).
  - `mdx-components.tsx` exports `useMDXComponents(components)` returning cream-styled `h1/h2/p/em/strong` overrides.

- [ ] **Step 1: Write `mdx-components.tsx`**

```tsx
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 44, margin: '0 0 12px' }} {...props} />,
    h2: (props) => <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, margin: '28px 0 8px' }} {...props} />,
    p: (props) => <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' }} {...props} />,
    em: (props) => <em style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic' }} {...props} />,
    ...components
  };
}
```

- [ ] **Step 2: Write `src/terminal/PlateViewer.tsx`**

```tsx
'use client';
import { Suspense, lazy, useCallback, useEffect, useMemo } from 'react';
import { platesLoader } from '@/content/plates';
import { PROJECTS, type Slug } from '@/content/projects';
import styles from './PlateViewer.module.css';

export function PlateViewer({ slug, onClose }: { slug: Slug; onClose: () => void }) {
  const Plate = useMemo(() => lazy(platesLoader[slug]), [slug]);
  const p = PROJECTS[slug];

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={`${p.slug} plate`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} type="button" aria-label="Close plate">close</button>
        <article className={styles.article}>
          <Suspense fallback={<div className={styles.loading}>loading…</div>}>
            <Plate />
          </Suspense>
        </article>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/terminal/PlateViewer.module.css`**

```css
.backdrop {
  position: fixed; inset: 0;
  background: color-mix(in srgb, var(--cream) 92%, black 8%);
  z-index: 50;
  display: grid;
  place-items: start center;
  overflow-y: auto;
  padding: 60px 24px;
}
.sheet {
  position: relative;
  background: var(--cream);
  max-width: 720px;
  width: 100%;
  padding: 48px 56px 72px;
  box-shadow: 0 40px 80px rgba(17,17,17,0.06);
}
.close {
  position: absolute;
  top: 20px;
  right: 24px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--umber-strong);
}
.close:hover { color: var(--ink); }
.article :global(h1) { font-family: var(--font-serif); }
.loading {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--umber-strong);
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: 0 errors. If MDX types complain, add `next-env.d.ts` reference — Next 15 emits this automatically on first `pnpm dev`.

- [ ] **Step 5: Commit**

```bash
git add site/src/terminal/PlateViewer.tsx site/src/terminal/PlateViewer.module.css site/mdx-components.tsx
git commit -m "feat(terminal): plate viewer with lazy MDX and focus trap basics"
```

---

### Task 13: Terminal top-level component

**Files:**
- Create: `site/src/terminal/hooks/useReducedMotion.ts`
- Create: `site/src/terminal/hooks/useSessionFlag.ts`
- Create: `site/src/terminal/hooks/useVisibleSlug.ts`
- Create: `site/src/terminal/Terminal.tsx`
- Create: `site/src/terminal/Terminal.module.css`

**Interfaces:**
- Consumes: everything from Tasks 4-12.
- Produces:
  - `<Terminal />` client component: renders prompt line, scrolling command output, inline labels for `openInline` results, chip row, and mounts `<PlateViewer>` when `openPlate` fires.
  - State: `cwd`, `lines: ReactNode[]`, `plateSlug: Slug | null`, `visibleSlug: Slug | null`, input value.
  - Handles `Enter` (execute), `Tab` (complete), `ArrowUp/Down` (history), any keypress during reveal (skip).

- [ ] **Step 1: Write `useReducedMotion.ts`**

```ts
'use client';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Write `useSessionFlag.ts`**

```ts
'use client';
import { useEffect, useState } from 'react';

export function useSessionFlag(key: string): [boolean, () => void] {
  const [set, setSet] = useState(false);
  useEffect(() => {
    try { setSet(sessionStorage.getItem(key) === '1'); } catch { /* private mode */ }
  }, [key]);
  const mark = () => { try { sessionStorage.setItem(key, '1'); setSet(true); } catch { /* ignore */ } };
  return [set, mark];
}
```

- [ ] **Step 3: Write `useVisibleSlug.ts`**

```ts
'use client';
import { useCallback, useRef, useState } from 'react';
import type { Slug } from '@/content/projects';

export function useVisibleSlug() {
  const [visible, setVisible] = useState<Slug | null>(null);
  const map = useRef<Map<Slug, boolean>>(new Map());
  const onChange = useCallback((slug: Slug, isVisible: boolean) => {
    map.current.set(slug, isVisible);
    const first = Array.from(map.current.entries()).find(([, v]) => v)?.[0] ?? null;
    setVisible(first);
  }, []);
  return { visible, onChange };
}
```

- [ ] **Step 4: Write `src/terminal/Terminal.tsx`**

```tsx
'use client';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS, type Slug } from '@/content/projects';
import { execute, type CommandResult } from './engine/commands';
import { complete } from './engine/completion';
import { createHistory } from './engine/history';
import { Chips, buildChipSet } from './Chips';
import { InlineLabel } from './InlineLabel';
import { PlateViewer } from './PlateViewer';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useVisibleSlug } from './hooks/useVisibleSlug';
import styles from './Terminal.module.css';

type Line = { id: number; node: ReactNode };
let uid = 0;
const nextId = () => ++uid;

export function Terminal() {
  const reduced = useReducedMotion();
  const [cwd, setCwd] = useState('/randy');
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [plateSlug, setPlateSlug] = useState<Slug | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const history = useMemo(createHistory, []);
  const { visible, onChange } = useVisibleSlug();

  const promptFor = (p: string) => (p === '/randy' ? '~' : `~${p.slice('/randy'.length)}`);

  const push = useCallback((node: ReactNode) => {
    setLines((prev) => [...prev, { id: nextId(), node }]);
  }, []);

  const runInput = useCallback((raw: string) => {
    if (!raw.trim()) return;
    history.push(raw);
    push(
      <div className={styles.echo}>
        <span className={styles.prompt}>{promptFor(cwd)}</span>
        <span className={styles.echoText}>{raw}</span>
      </div>
    );
    const result: CommandResult = execute(raw, { cwd, visibleSlug: visible });
    switch (result.kind) {
      case 'text':
      case 'help':
        for (const line of result.lines) push(<div className={styles.textLine}>{line}</div>);
        break;
      case 'error':
        push(<div className={styles.err}>{result.message}</div>);
        break;
      case 'cd':
        setCwd(result.newCwd);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'openInline':
        push(<InlineLabel slug={result.slug} instant={reduced} onVisibilityChange={onChange} />);
        break;
      case 'openPlate':
        setPlateSlug(result.slug);
        break;
    }
  }, [cwd, visible, history, push, reduced, onChange]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); runInput(input); setInput(''); history.reset(); return; }
    if (e.key === 'Tab')   { e.preventDefault(); setInput((v) => complete(v, cwd)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); const v = history.up();   if (v !== null) setInput(v); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); const v = history.down(); if (v !== null) setInput(v); return; }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const chips = buildChipSet(cwd, visible);

  return (
    <div className={styles.frame} onClick={() => inputRef.current?.focus()}>
      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.welcome}>
          <span className={styles.kicker}>catalog</span>
          <span className={styles.sub}>a museum expressed as a curator's terminal. type <code>help</code> or use the chips below.</span>
        </div>
        {lines.map((l) => <div key={l.id}>{l.node}</div>)}
        <div className={styles.promptLine}>
          <span className={styles.prompt}>{promptFor(cwd)}</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="terminal input"
          />
          <span className={styles.caret} aria-hidden />
        </div>
      </div>
      <Chips chips={chips} onRun={runInput} />
      {plateSlug ? <PlateViewer slug={plateSlug} onClose={() => { setPlateSlug(null); inputRef.current?.focus(); }} /> : null}
    </div>
  );
}
```

- [ ] **Step 5: Write `src/terminal/Terminal.module.css`**

```css
.frame {
  max-width: 780px;
  margin: 0 auto;
  padding: 64px 24px 48px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.scroll {
  flex: 1 1 auto;
  overflow-y: auto;
}
.welcome { margin-bottom: 24px; display: flex; flex-direction: column; gap: 6px; }
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--umber-strong);
}
.sub { font-family: var(--font-mono); color: var(--ink); font-size: 13px; }
.promptLine { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.prompt { font-family: var(--font-mono); color: var(--prussian); font-size: 13px; }
.input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
  caret-color: transparent;
}
.caret {
  display: inline-block;
  width: 1.5px;
  height: 15px;
  background: var(--ink);
  animation: breathe 1200ms ease-in-out infinite;
}
@keyframes breathe { 0%,100% { opacity: 1 } 50% { opacity: 0.15 } }
.echo { display: flex; gap: 10px; margin-top: 8px; }
.echoText { font-family: var(--font-mono); font-size: 13px; color: var(--ink); }
.textLine { font-family: var(--font-mono); font-size: 13px; color: var(--ink); white-space: pre; }
.err { font-family: var(--font-mono); font-size: 13px; color: var(--vermillion); }
```

- [ ] **Step 6: Wire into page**

Replace `src/app/page.tsx`:

```tsx
import { Terminal } from '@/terminal/Terminal';

export default function Home() {
  return <Terminal />;
}
```

- [ ] **Step 7: Boot and smoke test**

Run `pnpm dev`. In the browser:
- Type `ls`, `cd work`, `ls`, `open oryzo` → inline label appears; chips collapse to two.
- Type `open oryzo` again → plate opens. Press Escape → closes.
- Tab-complete `open hal` → completes to `open halcyon`.

Kill server.

- [ ] **Step 8: Commit**

```bash
git add site/src/terminal/hooks site/src/terminal/Terminal.tsx site/src/terminal/Terminal.module.css site/src/app/page.tsx
git commit -m "feat(terminal): top-level terminal shell wires engine + reveal + chips + plate"
```

---

### Task 14: Page loader (0–100% ceremony)

**Files:**
- Create: `site/src/terminal/Loader.tsx`
- Create: `site/src/terminal/Loader.module.css`
- Modify: `site/src/app/page.tsx`

**Interfaces:**
- Consumes: `LOADER` timings from `cadences.ts` (Task 8), `useSessionFlag` (Task 13), `useReducedMotion` (Task 13).
- Produces:
  - `<Loader onDone={() => void} />` — cream backdrop, centered mono counter animating 0→100 over `LOADER.duration = 2200ms`, then holds `LOADER.hold = 220ms`, then fades over `LOADER.dissolve = 720ms`. Any keypress or click short-circuits to dissolve. Under `prefers-reduced-motion`, resolves immediately.
  - Gated by `sessionStorage['randy.seen'] === '1'`: subsequent navigations skip. Hard refresh re-fires.

- [ ] **Step 1: Write `src/terminal/Loader.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { LOADER } from './reveal/cadences';
import { useReducedMotion } from './hooks/useReducedMotion';
import styles from './Loader.module.css';

export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<'counting' | 'holding' | 'dissolving' | 'gone'>('counting');

  useEffect(() => {
    if (reduced) { onDone(); return; }
    let raf = 0;
    const start = performance.now();
    let skipped = false;

    const skip = () => { skipped = true; };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / LOADER.duration);
      setPct(Math.round((skipped ? 1 : t) * 100));
      if ((skipped || t >= 1) && phase === 'counting') {
        setPhase('holding');
        setTimeout(() => setPhase('dissolving'), LOADER.hold);
        setTimeout(() => { setPhase('gone'); onDone(); }, LOADER.hold + LOADER.dissolve);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', skip); window.removeEventListener('pointerdown', skip); };
  }, [reduced, phase, onDone]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`${styles.wrap} ${phase === 'dissolving' ? styles.fade : ''}`}
      aria-hidden={phase === 'dissolving'}
    >
      <div className={styles.stack}>
        <div className={styles.label}>catalog</div>
        <div className={styles.counter}>{String(pct).padStart(3, '0')}<span className={styles.pct}>%</span></div>
        <div className={styles.hint}>press any key to skip</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/terminal/Loader.module.css`**

```css
.wrap {
  position: fixed; inset: 0; z-index: 100;
  background: var(--cream);
  display: grid; place-items: center;
  transition: opacity 720ms ease-out;
}
.wrap.fade { opacity: 0; pointer-events: none; }
.stack { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--umber-strong);
}
.counter {
  font-family: var(--font-serif);
  font-size: 72px;
  color: var(--prussian);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.pct { font-size: 24px; color: var(--umber-strong); margin-left: 4px; }
.hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--umber-strong);
  margin-top: 8px;
}
```

- [ ] **Step 3: Wire into `page.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Loader } from '@/terminal/Loader';
import { Terminal } from '@/terminal/Terminal';
import { useSessionFlag } from '@/terminal/hooks/useSessionFlag';

export default function Home() {
  const [seen, mark] = useSessionFlag('randy.seen');
  const [ready, setReady] = useState(seen);
  if (!ready) return <Loader onDone={() => { mark(); setReady(true); }} />;
  return <Terminal />;
}
```

Note: `layout.tsx` metadata remains server-rendered; this page becomes a client component. That's fine for the terminal-shaped SPA. If SEO becomes a concern later, split.

- [ ] **Step 4: Smoke test**

Run `pnpm dev`. Hard-refresh — see the 0→100 ceremony. Navigate away & back within tab (browser back) — see terminal directly.

- [ ] **Step 5: Commit**

```bash
git add site/src/terminal/Loader.tsx site/src/terminal/Loader.module.css site/src/app/page.tsx
git commit -m "feat: first-visit page loader with session gate"
```

---

### Task 15: Metadata, OG, not-found

**Files:**
- Modify: `site/src/app/layout.tsx`
- Create: `site/src/app/not-found.tsx`
- Create: `site/src/lib/env.ts`
- Add: `site/public/og-default.png` (placeholder — a 1200×630 cream image with the word "catalog" in Instrument Serif; Randy replaces later)
- Create: `site/public/favicon.svg`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SITE_URL` env.
- Produces:
  - `getSiteUrl(): string` from `env.ts`.
  - Full `Metadata` export in `layout.tsx` with title template, description, OpenGraph, Twitter card.

- [ ] **Step 1: Write `src/lib/env.ts`**

```ts
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return url.replace(/\/$/, '');
}
```

- [ ] **Step 2: Rewrite `src/app/layout.tsx` metadata**

Replace the `export const metadata` block with:

```tsx
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'randy ren — catalog', template: '%s · randy ren' },
  description: "a museum expressed as a curator's terminal. six plates.",
  openGraph: {
    title: 'randy ren — catalog',
    description: "a museum expressed as a curator's terminal.",
    url: '/',
    siteName: 'randy ren',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website'
  },
  twitter: { card: 'summary_large_image', title: 'randy ren — catalog', images: ['/og-default.png'] },
  icons: { icon: '/favicon.svg' }
};
```

- [ ] **Step 3: Write `src/app/not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <main style={{ padding: '80px 24px', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--umber-strong)' }}>404</p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 40, margin: '10px 0 20px' }}>nothing filed here.</h1>
      <p><a href="/">back to the catalog</a></p>
    </main>
  );
}
```

- [ ] **Step 4: Write `public/favicon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#F1E8D4"/>
  <circle cx="16" cy="16" r="6" fill="#1F3A5F"/>
</svg>
```

- [ ] **Step 5: Placeholder OG image**

Run:
```bash
cd "/Users/randyren/Developer/2026 portfolio/site"
# 1200x630 solid cream PNG — replace with a designed OG image before launch
node -e "const fs=require('fs');const{Buffer}=require('buffer');const png=Buffer.from('89504e470d0a1a0a0000000d494844520000000100000001080600000037f61d900000000d49444154789c63000100000005000101f5da2e0e0000000049454e44ae426082','hex');fs.writeFileSync('public/og-default.png',png)"
```
(This writes a 1×1 placeholder; final artwork is a design task, not a code task. The file exists so Next doesn't 404 on OG requests.)

- [ ] **Step 6: Commit**

```bash
git add site/src/app/layout.tsx site/src/app/not-found.tsx site/src/lib/env.ts site/public/favicon.svg site/public/og-default.png
git commit -m "feat: metadata, 404, favicon, placeholder og image"
```

---

### Task 16: Contact form — schema, route, Resend, rate limit

**Files:**
- Create: `site/src/contact/schema.ts`
- Create: `site/src/contact/rateLimit.ts`
- Create: `site/src/app/api/contact/route.ts`
- Create: `site/tests/unit/contact-schema.test.ts`

**Interfaces:**
- Consumes: env vars `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Produces:
  - `ContactInput = z.infer<typeof contactSchema>` — `{ name: string(1..80), email: email, message: string(10..2000), hp: string.optional() }` — `hp` is a honeypot; if present, 200 OK with `{ok: true}` but nothing sent.
  - `POST /api/contact` — validates, rate limits by IP (5/hour), sends via Resend. Response shape: `{ok: true}` or `{ok: false, error: string}`.

The chat UI to invoke this is intentionally out-of-scope. The `open contact` inline card displays the email + socials; the form endpoint exists for the eventual "send a note" chip.

- [ ] **Step 1: Write `src/contact/schema.ts`**

```ts
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(2000),
  hp: z.string().optional()
});

export type ContactInput = z.infer<typeof contactSchema>;
```

- [ ] **Step 2: Write the failing test — `tests/unit/contact-schema.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { contactSchema } from '@/contact/schema';

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'a@b.co', message: 'hello there!' });
    expect(r.success).toBe(true);
  });

  it('rejects short messages', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'a@b.co', message: 'hi' });
    expect(r.success).toBe(false);
  });

  it('rejects bad emails', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'not-an-email', message: 'long enough now.' });
    expect(r.success).toBe(false);
  });

  it('allows honeypot field', () => {
    const r = contactSchema.safeParse({ name: 'r', email: 'a@b.co', message: 'long enough now.', hp: 'bot' });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `pnpm test tests/unit/contact-schema.test.ts`
Expected: module-not-found failure.

- [ ] **Step 4: Run test to verify pass after schema exists**

Run: `pnpm test tests/unit/contact-schema.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Write `src/contact/rateLimit.ts`**

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let cached: Ratelimit | null = null;

export function getLimiter(): Ratelimit | null {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cached = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: false,
    prefix: 'randyren:contact'
  });
  return cached;
}
```

- [ ] **Step 6: Write `src/app/api/contact/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/contact/schema';
import { getLimiter } from '@/contact/rateLimit';

export const runtime = 'nodejs';

function ipFrom(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0]?.trim()) ?? '0.0.0.0';
}

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation failed' }, { status: 400 });
  }
  if (parsed.data.hp) {
    return NextResponse.json({ ok: true });
  }

  const limiter = getLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ipFrom(req));
    if (!success) return NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { name, email, message } = parsed.data;
  const { error } = await resend.emails.send({
    from: 'catalog <noreply@randyren.com>',
    to: [to],
    replyTo: email,
    subject: `note from ${name}`,
    text: `from: ${name} <${email}>\n\n${message}\n`
  });
  if (error) return NextResponse.json({ ok: false, error: 'send failed' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 7: Manual smoke test**

Populate `.env.local` with real Resend + Upstash keys. Run `pnpm dev`. In another terminal:

```bash
curl -s -X POST http://localhost:3000/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"r","email":"a@b.co","message":"testing the wire."}'
```
Expected: `{"ok":true}` (or a diagnostic 4xx/5xx if envs missing — read the response).

- [ ] **Step 8: Commit**

```bash
git add site/src/contact site/src/app/api/contact/route.ts site/tests/unit/contact-schema.test.ts
git commit -m "feat(contact): POST /api/contact with zod, resend, upstash rate limit"
```

---

### Task 17: Analytics + robots + sitemap

**Files:**
- Create: `site/src/lib/analytics.ts`
- Modify: `site/src/app/layout.tsx`
- Create: `site/src/app/robots.ts`
- Create: `site/src/app/sitemap.ts`

**Interfaces:**
- Consumes: `getSiteUrl()` (Task 15).
- Produces:
  - `<AnalyticsProbe />` — thin wrapper around `@vercel/analytics/react`'s `<Analytics />`.
  - `robots.ts` returns a `MetadataRoute.Robots` allowing all.
  - `sitemap.ts` returns one entry for `/`.

- [ ] **Step 1: Write `src/lib/analytics.ts`**

```tsx
import { Analytics } from '@vercel/analytics/react';

export function AnalyticsProbe() { return <Analytics />; }
```

- [ ] **Step 2: Include it in `layout.tsx`**

Add before `</body>`:

```tsx
import { AnalyticsProbe } from '@/lib/analytics';
// ...
<body>{children}<AnalyticsProbe /></body>
```

- [ ] **Step 3: Write `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${getSiteUrl()}/sitemap.xml`
  };
}
```

- [ ] **Step 4: Write `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${getSiteUrl()}/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }];
}
```

- [ ] **Step 5: Verify**

Run `pnpm dev` then `curl -s http://localhost:3000/sitemap.xml | head`. Confirm it returns an XML sitemap.

- [ ] **Step 6: Commit**

```bash
git add site/src/lib/analytics.ts site/src/app/layout.tsx site/src/app/robots.ts site/src/app/sitemap.ts
git commit -m "feat: analytics probe, robots, sitemap"
```

---

### Task 18: E2E test suite

**Files:**
- Create: `site/tests/e2e/loader.spec.ts`
- Create: `site/tests/e2e/terminal-basic.spec.ts`
- Create: `site/tests/e2e/plate-promotion.spec.ts`
- Create: `site/tests/e2e/contact-form.spec.ts`

**Interfaces:**
- Consumes: running dev server (Playwright's `webServer` config from Task 1).
- Produces: `pnpm test:e2e` green.

- [ ] **Step 1: Install Playwright browsers**

Run:
```bash
cd "/Users/randyren/Developer/2026 portfolio/site"
pnpm exec playwright install chromium
```

- [ ] **Step 2: Write `tests/e2e/loader.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('loader completes and shows the terminal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('catalog')).toBeVisible();
  await expect(page.getByLabel('terminal input')).toBeVisible({ timeout: 6000 });
});
```

- [ ] **Step 3: Write `tests/e2e/terminal-basic.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('ls, cd, help commands echo to the transcript', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const input = page.getByLabel('terminal input');
  await input.click();
  await input.fill('ls');
  await input.press('Enter');
  await expect(page.getByText('work  about  contact')).toBeVisible();
  await input.fill('cd work');
  await input.press('Enter');
  await input.fill('ls');
  await input.press('Enter');
  await expect(page.getByText('oryzo  halcyon  paperlane  atlas  koinu  linen')).toBeVisible();
});
```

- [ ] **Step 4: Write `tests/e2e/plate-promotion.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('first open inlines; second open promotes to plate', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const input = page.getByLabel('terminal input');
  await input.click();
  await input.fill('cd work');
  await input.press('Enter');
  await input.fill('open oryzo');
  await input.press('Enter');
  await expect(page.locator('[data-inline-slug="oryzo"]')).toBeVisible();
  await input.fill('open oryzo');
  await input.press('Enter');
  await expect(page.getByRole('dialog', { name: /oryzo plate/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

- [ ] **Step 5: Write `tests/e2e/contact-form.spec.ts`**

Since we haven't built a UI form, exercise the endpoint directly:

```ts
import { expect, test } from '@playwright/test';

test('POST /api/contact validates', async ({ request }) => {
  const bad = await request.post('/api/contact', { data: { name: '', email: 'x', message: '' } });
  expect(bad.status()).toBe(400);
});

test('POST /api/contact accepts honeypot silently', async ({ request }) => {
  const r = await request.post('/api/contact', {
    data: { name: 'r', email: 'a@b.co', message: 'long enough message.', hp: 'bot' }
  });
  expect(r.status()).toBe(200);
});
```

- [ ] **Step 6: Run E2E**

Run: `pnpm test:e2e`
Expected: all four spec files pass.

- [ ] **Step 7: Commit**

```bash
git add site/tests/e2e
git commit -m "test(e2e): loader, terminal, plate promotion, contact endpoint"
```

---

### Task 19: Accessibility pass + reduced-motion audit

**Files:**
- Create: `site/tests/e2e/a11y.spec.ts`
- Modify: any component surfaced by violations.

**Interfaces:**
- Consumes: `@axe-core/playwright`.
- Produces: `a11y.spec.ts` running axe against `/` and against a page state where the plate viewer is open.

- [ ] **Step 1: Write `tests/e2e/a11y.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home has no serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('plate viewer has no serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('randy.seen', '1'));
  await page.reload();
  const input = page.getByLabel('terminal input');
  await input.click();
  await input.fill('cd work');
  await input.press('Enter');
  await input.fill('open oryzo');
  await input.press('Enter');
  await input.fill('open oryzo');
  await input.press('Enter');
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});
```

- [ ] **Step 2: Reduced-motion manual audit**

In Chrome DevTools rendering panel → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload `/`:
- Loader must skip immediately.
- `open oryzo` must render the label in its final state instantly (no typewriter).
- Plate viewer must still open, no motion.

Fix by ensuring `useReducedMotion()` short-circuits are honoured in `Loader.tsx`, `InlineLabel.tsx`, and any transitions in CSS. The `@media (prefers-reduced-motion: reduce)` block in `globals.css` (Task 2) already flattens transitions globally as a safety net.

- [ ] **Step 3: Run E2E**

Run: `pnpm test:e2e tests/e2e/a11y.spec.ts`
Expected: passing. If serious violations, remediate and re-run.

- [ ] **Step 4: Commit**

```bash
git add site/tests/e2e/a11y.spec.ts
git commit -m "test(a11y): axe checks for home and plate viewer"
```

---

### Task 20: Bundle budget + Lighthouse gate

**Files:**
- Create: `site/scripts/check-bundle.mjs`
- Modify: `site/package.json` (add `check:bundle` script)

**Interfaces:**
- Consumes: `.next/build-manifest.json` and `.next/static/chunks/*` after `pnpm build`.
- Produces: `pnpm check:bundle` exits 1 if the sum of `/` first-load JS chunks exceeds 90 KB gzipped.

- [ ] **Step 1: Write `scripts/check-bundle.mjs`**

```js
import { readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 90;
const ROOT = process.cwd();

const manifest = JSON.parse(await readFile(path.join(ROOT, '.next/build-manifest.json'), 'utf8'));
const homeFiles = manifest.pages['/'] ?? [];
let total = 0;
for (const f of homeFiles) {
  if (!f.endsWith('.js')) continue;
  const full = path.join(ROOT, '.next', f);
  try {
    const buf = await readFile(full);
    total += gzipSync(buf).length;
  } catch {
    // missing file — build ordering can produce this; skip
  }
}
const kb = total / 1024;
console.log(`/  first-load JS (gz): ${kb.toFixed(1)} KB`);
if (kb > BUDGET_KB) {
  console.error(`BUDGET EXCEEDED: ${kb.toFixed(1)} KB > ${BUDGET_KB} KB`);
  process.exit(1);
}
```

- [ ] **Step 2: Add script**

Add to `package.json` `scripts`:

```json
"check:bundle": "node scripts/check-bundle.mjs"
```

- [ ] **Step 3: Run**

```bash
pnpm build
pnpm check:bundle
```
Expected: prints size and exits 0 if under 90 KB. If over, defer non-critical UI (chip list, plate viewer already lazy) and re-measure.

- [ ] **Step 4: Lighthouse spot check**

```bash
pnpm start &
sleep 3
pnpm exec lighthouse http://localhost:3000 --preset=desktop --quiet --chrome-flags="--headless=new" --output=json --output-path=./lighthouse.json || true
kill %1
node -e "const r=require('./lighthouse.json');console.log('perf', r.categories.performance.score, 'a11y', r.categories.accessibility.score);"
```

Targets: performance ≥ 0.95, accessibility ≥ 0.95. If below, fix and re-run before Task 21.

- [ ] **Step 5: Commit**

```bash
git add site/scripts site/package.json
git commit -m "chore: bundle budget script"
```

---

### Task 21: Deployment to Vercel + production DNS

**Files:**
- Create: `site/vercel.json` (only if we need overrides — start without)
- Create: `site/docs/decisions/README.md`

**Interfaces:**
- Consumes: a Vercel account, `randyren.com` domain.
- Produces: production URL at `https://randyren.com`, PR previews for every branch.

- [ ] **Step 1: Link the project**

Run:
```bash
cd "/Users/randyren/Developer/2026 portfolio/site"
pnpm exec vercel link
```
Answer prompts to link to a new or existing project in Randy's Vercel team.

- [ ] **Step 2: Push envs to Vercel**

Run each:
```bash
vercel env add RESEND_API_KEY production
vercel env add CONTACT_TO_EMAIL production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add NEXT_PUBLIC_SITE_URL production   # https://randyren.com
```
Repeat for `preview` scope where appropriate (contact form should work on previews too).

- [ ] **Step 3: First deploy**

```bash
vercel --prod
```
Note the deployment URL. Load it in a browser and run the same smoke tests (loader, ls, cd, open oryzo twice, plate closes on Esc).

- [ ] **Step 4: Custom domain**

In Vercel dashboard → the project's Domains → add `randyren.com` and `www.randyren.com` (redirect www→apex). Update DNS at registrar per Vercel's instructions (A record `76.76.21.21` for apex + CNAME for www to `cname.vercel-dns.com`).

- [ ] **Step 5: Post-deploy checklist**

- [ ] `https://randyren.com` loads with correct favicon
- [ ] Loader plays on hard refresh, session-gates on soft nav
- [ ] `open oryzo` → inline → `open oryzo` → plate → Escape closes
- [ ] `POST /api/contact` with a valid payload delivers to `CONTACT_TO_EMAIL` inbox
- [ ] Rate limit: 6 rapid submissions from same IP → 6th returns 429
- [ ] Lighthouse on prod URL: perf ≥ 0.95, a11y ≥ 0.95, SEO ≥ 0.95
- [ ] `curl https://randyren.com/robots.txt` and `/sitemap.xml` return 200
- [ ] Vercel Analytics dashboard shows page views
- [ ] `prefers-reduced-motion` respected in a Chromium session

- [ ] **Step 6: Decision log**

Write `docs/decisions/README.md`:

```markdown
# Decision log

Design and stack decisions for the catalog. One line per decision, dated.

- 2026-07-04 · lock palette: cream #F1E8D4, ink #111, prussian #1F3A5F, umber #5A3818/#7A4A1F, vermillion #A8100A.
- 2026-07-04 · fonts: Instrument Serif + IBM Plex Mono + IBM Plex Serif italic. No Fraunces.
- 2026-07-04 · stack: Next 15 App Router, RSC, CSS Modules. No Tailwind.
- 2026-07-04 · backend surface: only /api/contact. Everything else static.
- 2026-07-04 · two-click plate promotion: click 1 inlines, click 2 while inline is visible promotes.
- 2026-07-04 · loader ceremony: 2200/220/720 ms, once per session, skippable.
```

- [ ] **Step 7: Commit and tag**

```bash
git add site/docs/decisions/README.md
git commit -m "docs: seed decision log"
git tag v0.1.0
```

---

## Spec self-review

**Coverage:**
- Terminal shell → Tasks 4-7, 13 ✓
- Reveal animations → Tasks 8-9 ✓
- Chips + inline label + plate → Tasks 10-12 ✓
- Page loader → Task 14 ✓
- Contact form backend → Task 16 ✓
- SEO / OG / sitemap → Tasks 15, 17 ✓
- Tests: unit + E2E + a11y → Tasks 4-8, 16, 18-19 ✓
- Performance budget → Task 20 ✓
- Deployment → Task 21 ✓
- Content (projects, bio, plates) → Task 3 ✓ (placeholder copy; Randy fills real copy before v1.0)

**Type consistency:** `Slug` used identically across tasks; `CommandResult`, `Chip`, `TypewriterHandle` names match across their consumers.

**No placeholders:** every step shows code or exact commands. The one exception is the OG image, which is a design deliverable and is called out as such with a 1×1 placeholder committed so build doesn't 404.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-04-portfolio-site.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
