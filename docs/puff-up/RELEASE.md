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

Red crumble platforms return in their original position after 3 seconds in the first
zone, 1 second longer per zone above (real time), while still visible. This uses simulation time: pause freezes the countdown,
restart clears pending repairs, and the initial launch pad never regenerates.

Mobile touch input uses the screen midpoint. Pointer capture supports sliding
across halves; the newest held finger takes precedence, and lifting it restores
another held finger. Release/cancel/lost capture, pause and blur clear movement.
Desktop keyboard and button steering remain available.

The star field retains the approved density, twinkles and 5–8 second shooting
stars. No planets remain. A fourth consecutive streak in the same direction is
prevented, including after resize. Pause/results surfaces are neutral #181818.
Puff continues falling until the rising line catches him or his entire sprite passes
the real viewport bottom, whichever comes first.

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

## Zones

Every 200 m is a step up, driven by the one `ZONES` table in `game/climb.js`; past
the table the last zone repeats. Per zone: the rising line's speed (2.5 → 12 m per
game second), the game speed (1.0× → 1.4× real time), the solid/crumble/moving/spring
mix (stone 40% → 10%), ledge widths, and mover swing and period (peak 70 → 234 px
per game second). The line trails 460 px below the peak while Puff outclimbs it;
touching it ends the climb.

Every generated ledge carries a certificate (`witness`): takeoff states Puff really
reaches on it, each replayable from a state on its source ledge with one steering
switch. Movers are certified on the band they cover at every phase, so no certified
hop depends on arrival time, and a clean climb outpaces the fastest line by more
than 30%. A ledge that cannot be certified is moved, then made a plain stone.

Validation:

- `pnpm test:puff`: 27 tests passed, including a replay of 56,922 certified hops
  (41 seeds to 1400 m, eight phases per mover) under the real physics, per-zone
  rebuild times, the line catching an idle Puff, and the search bot clearing every
  zone of the default course.
- `pnpm test:puff:bot`: the search bot plays the real `stepRun`; 140/140 seeds
  cleared 1200 m (zones 0–5).
- Umbra, local dev at 1440×1000 and 390×844: the line renders and rises, zone 0
  runs at 1.000× real time, an idle Puff is caught at 14.47 s of game time, and the
  results screen shows. Zones above 0 were not reached in the browser.
