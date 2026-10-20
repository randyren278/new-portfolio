# Puff Up production integration

Puff's second click within five seconds opens the invitation. Keyboard activation
opens it directly. The game and animation code are loaded on demand; no game
assets are requested on a normal portfolio visit.

The approved zoom/boost and charcoal-curtain transition runs over the real mounted
portfolio. Returning restores its scroll, focus, photo state, overflow and input.
Entry cancellation, component cleanup and pagehide cancel pending work and restore
the portfolio. The game iframe uses an explicit Next public asset index path. Playing changes
the address to `/game`, which also supports shared links and refreshes without
replaying the portfolio intro. Normal entry keeps the portfolio mounted underneath.
Browser Back/Forward, including reversing an in-progress return, follows the latest
navigation. The history entry is pushed in the trusted Play click for WebKit.

Red crumble platforms return in their original position five seconds after impact
while still visible. This uses simulation time: pause freezes the countdown,
restart clears pending repairs, and the initial launch pad never regenerates.

Mobile touch input uses the screen midpoint. Pointer capture supports sliding
across halves; the newest held finger takes precedence, and lifting it restores
another held finger. Release/cancel/lost capture, pause and blur clear movement.
Desktop keyboard and button steering remain available.

The star field retains the approved density, twinkles and 5–8 second shooting
stars. No planets remain. A fourth consecutive streak in the same direction is
prevented, including after resize. Pause/results surfaces are neutral #181818.
Puff continues falling until his entire sprite passes the real viewport bottom.

Validation before release:

- `pnpm lint` and production build/type checking passed.
- `pnpm test:puff`: 23 tests passed, including course generation, spring skips,
  viewport fall limits, bounded star-direction runs, touch-pointer lifecycle and
  timed visible-platform restoration.
- `node scripts/verify-puff-up.mjs BASE OUTPUT`: 39 native Umbra/HTTP checks
  passed on local production at 1440×1000 and 390×844, including mobile canvas
  pointer steering, lazy discovery, neutral cards, repeat entry/cancellation,
  real photo/project interactions, scroll/focus restoration and browser Back.
- Independent source review found two integration issues (directory URL and
  pagehide restoration); both were fixed and independently rechecked.

`node scripts/verify-game-route.mjs BASE OUTPUT`: 22 checks passed on local
production, covering desktop/mobile entry, direct links, refresh, browser
Back/Forward, interrupted returns, cancellation and the original portfolio URL.
The neutral-surface suite also passed all 65 checks.

Evidence is written under `output/puff-up-release/`. Hardware multi-touch is
covered by event-boundary tests; Umbra checks use WebKit viewport emulation and
trusted pointer clicks, not a physical iPhone. Reduced-motion code is preserved;
OS preference emulation and long endurance were not exercised for this release.
