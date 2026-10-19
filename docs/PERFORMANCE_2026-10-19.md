# Whole-site performance audit — 2026-10-19

The measured intro bottleneck is fixed locally. The final production build
passes the desktop/mobile user paths, route checks, asset parity checks and
data/cache tests. Measurements apply to local production builds; deployment and
field performance require separate verification.

## Measured result

| Metric | Baseline | Final candidate |
| --- | ---: | ---: |
| Desktop intro ready, warm median | 1,190 ms | 134 ms |
| Desktop range, 5 samples | 1,087–1,507 ms | 108–229 ms |
| Mobile viewport intro ready, warm median | 1,073 ms | 84 ms |
| Mobile viewport range, 5 samples | 1,011–1,183 ms | 81–110 ms |
| Next build homepage first-load JS estimate | 163 kB | 114 kB |
| Résumé preview | 264,213 bytes | 58,934 bytes |

Desktop readiness improved 88.7%; mobile viewport readiness improved 92.2%.
The résumé preview is 77.7% smaller. These are local laboratory results,
not deployed field measurements or Core Web Vitals scores.

The timing boundary is navigation start to the iframe receiving `is-ready`
after its load event. The probe also records the next animation-frame
opportunity. The existing 300 ms iframe fade and authored 2.46–3.05 second
Explore transition remain unchanged; readiness is not transition completion.

The final comparison alternated A/B and B/A order for six navigations per
arm at each viewport. Navigation zero warmed each arm and is retained in
the raw data; the table uses the next five navigations. All three naturally
random intro modes appear in the samples. Mode mixes are recorded rather
than treated as identical per-pair inputs.

Environment: the same Apple Silicon Mac, Node v22.22.2, Next 15.5.20,
Umbra 0.2.0/WebKit, localhost production servers, 1440×900 desktop and
390×844 mobile viewport/user agent. No network or CPU throttling was used.
The mobile figures are not measurements on physical phone hardware.
Training used the repository fixtures; Strava used synthetic public activity
data with a 2,000 ms cold upstream delay, never live credentials. Server caches
were warm for the primary paired comparison. Independent work and builds
were stopped during timing runs.

An identical streaming proxy instrumented both arms with MutationObserver
timestamps and start/end performance marks around intro scripts. The proxy
requests identity encoding, so its resource bytes are not CDN transfer sizes.
Sub-millisecond script work rounds to 0–1 ms in WebKit; those values do not
mean zero work. The raw observations, variation and warmup samples are kept.

## Causes and changes

1. `puff-pixels.js` synchronously rasterized 795 sprite frames and 49 kite
   parts before the intro could load. Its final matched baseline samples
   spent 927–1,358 ms executing this script. Lazy array entries now rasterize
   only frames that the renderer displays, caching each result. Startup
   script execution measures 0–1 ms, with small frame generation occurring
   during the animation. All 795 frames, 48 body canvases, the sail and 288
   blink/look variants match baseline SHA-256 hashes. Hello's array
   slice/map/restore behavior also passes parity checks.
2. The homepage awaited optional Strava data before returning the bento,
   which then waited for hydration before creating the intro iframe.
   The homepage now returns its local content immediately. The activity
   cell fetches `/api/strava/latest` independently, preserving the existing
   60-second server cache, public-activity filtering, SVG projection and
   fallback. An attempted Suspense slot reduced TTFB but still delayed
   parent hydration; it was rejected after measurement.
3. Two JPEG fallbacks were encoded in JavaScript and repeated in HTML.
   They are now exact-byte static JPEGs outside the photo import directory.
   Their data URLs no longer travel in the client bundle. Initial full-size
   photo loading starts after intro readiness, with low fetch priority.
   Returning from training latches that eligibility before intro replay.
4. The résumé stamp now uses a 480×621 WebP, while view/download still use
   the original PDF. The download endpoint returns byte-identical PDF data.
5. The site serves its six existing Latin font faces locally, eliminating
   the external Google stylesheet dependency. The intro's existing TTFs
   were losslessly repackaged as WOFF2. Glyph outlines, metrics and shaping
   tables were checked; license texts and provenance are included.
6. Simultaneous training page/summary calls could duplicate a cold cache
   population. Same-process callers now share the complete pending cache
   operation. Existing durable stale serving and database refresh claims
   remain unchanged. The regression harness fails the two relevant
   assertions against baseline and passes all 11 against the candidate.

## Coverage and verification

Three bounded audit workers covered intro/rendering, server routes/data,
and assets/client code. Material findings were reproduced or tested before
integration. Independent sprite, asset and final code reviews passed.

The final build passes **97 end-to-end and HTTP checks** through
`scripts/verify-site-umbra.mjs`:

- Desktop and mobile: Orbit, Pool and Kite, lighting, Puff interaction,
  native trusted Explore clicks, release/unmount and controls during landing.
- All nine project plates, Escape close, photo verso and pair shuffle,
  decoded images, local fonts and no horizontal overflow.
- Training dialog/summary, navigation, charts, direct entry, return without
  intro, and replay after returning while photos remain usable.
- `/preview` intro/portfolio and noindex, `/training`, both data APIs,
  résumé view/download/preview, sitemap, robots, favicon and unknown-route 404.
- No browser console errors on the tested home/training paths. Desktop and
  mobile portfolio/training screenshots were captured and visually inspected.

Separate fault injection returned HTTP 503 or held the activity response
for 12 seconds. Intro readiness remained 248 ms and 417 ms respectively;
both activity cells reached their fallback. The browser's 8-second activity
deadline does not cancel the server's upstream request.

Production build/type validation and Biome pass. The existing training
parser/derivation suite passes 9/9; the new cache suite passes 11/11. Browser
work used isolated Umbra profiles, not the repository's older Playwright
drivers. OAuth entry/callback implementation was inspected without initiating
authorization flows. No live COROS fetch or production cache mutation was used.

## Remaining limits and opportunities

- Production latency, real mobile CPU/network behavior, field LCP/INP/CLS,
  and a system reduced-motion browser run are not established by this pass.
- Same-process cache deduplication does not serialize cold misses across
  multiple server instances. Warm durable refreshes retain their existing
  database claim. Database outages and genuinely cold COROS data can still
  delay training content; its loading UI remains in place.
- Full-resolution photo variants and training tooltip rerender reduction
  are source-level opportunities, not verified additional speedups. The
  current responsive layout and photo originals were preserved.
- The local font set preserves current Latin content. Additional scripts or
  extended-Latin copy may need additional subsets; the browser can fall back.

## Evidence and reproduction

Baseline revision: `63b4678b925f80bb8e699250f7d8b336eac70a0d`.
Candidate identity, build IDs and every changed/new product/tool file digest
are in [revision.json](performance-2026-10-19/revision.json).
The commit containing this report records the candidate patch on that baseline.
The identity file describes the exact source/tool files used for verification.

- [Final raw desktop samples](performance-2026-10-19/verified-paired-desktop.json)
- [Final raw mobile samples](performance-2026-10-19/verified-paired-mobile.json)
- [Summary](performance-2026-10-19/summary.json)
- [End-to-end checks](performance-2026-10-19/e2e/checks.json)
- [Sprite parity](performance-2026-10-19/sprite-parity-report.md)
- [Asset review](performance-2026-10-19/assets-review.md)
- [Final code review](performance-2026-10-19/final-code-review.md)
- [Training cache regression evidence](performance-2026-10-19/training-cache-review.md)

From `site/`, run the focused checks:

```sh
pnpm lint
pnpm test:training
node --test scripts/training-cache.test.cjs
pnpm build
```

Start an isolated production build with `TRAINING_FIXTURE=1` and synthetic
Strava tokens/mock transport from `docs/performance-2026-10-19/`. Build and start
must use the same `PORTFOLIO_BUILD_DIR`. Use `node
node_modules/next/dist/bin/next` directly when symlinking dependencies into
a detached baseline worktree; pnpm's dependency auto-check rejected that
temporary symlink layout in this run.

```sh
node scripts/verify-site-umbra.mjs http://127.0.0.1:4321 /absolute/evidence/e2e
node scripts/performance-umbra.mjs http://127.0.0.1:4317 /absolute/evidence/desktop.json 6 desktop http://127.0.0.1:4321
node scripts/performance-umbra.mjs http://127.0.0.1:4317 /absolute/evidence/mobile.json 6 mobile http://127.0.0.1:4321
PERF_ACTIVITY_FAULT=timeout node scripts/performance-umbra.mjs http://127.0.0.1:4321 /absolute/evidence/timeout.json 1 desktop
```

Temporary task servers/profiles/worktrees/build directories were removed
after verification. Existing exploration and output files were preserved;
the evidence directory above remains available.
