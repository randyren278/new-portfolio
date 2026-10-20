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
zone and 1 second longer per zone above, while still visible. The game never runs
faster than real time, so these are real seconds of play; pause freezes the countdown,
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

Every 200 m is a step up, driven by the `ZONES` and `SEGMENTS` tables in
`game/climb.js`; past the table the last zone remixes every signature. The game
speed never changes. Per zone: the rising line's speed (2.5 → 12 m/s), the
solid/crumble/moving/spring/kicker mix, ledge widths, and mover swing and period.

Each zone is an arc. A gate (two wide stones, the line slowed to 40%) names the
zone; its signature is taught on wider ledges, then alternates with mixed stretches
(line ×1.05), and a twist combines it with another mechanic near the top (×1.1).
Signatures: crumble runs, mover chains, kickers (fling Puff sideways at full speed),
switchbacks. From zone 1 a fork can open: a narrow crumble lane beside the path
with a spark that pauses the line for 2.5 s, merging on wide stone. Springs keep
their skip inside the run they start in, and gaps vary from 112 to 134 px.

Every generated ledge carries a certificate (`witness`): takeoff states Puff really
reaches on it, each replayable from a state on its source ledge with one steering
switch, using the same `launch()` rule as the game and the bot. Movers are certified
on the band they cover at every phase, so no hop depends on arrival time. A fork's
merge is certified from the lane too, or the lane is withdrawn before it is
visible. A clean climb gains at least 20% on the fastest line.

Feel: synthesized sound. An original generative space track (`game/music.js`: soft
pads and a mid drone in C major / A minor colours, a felt piano that comes and goes in
8-bar waves, rare bells, long reverb) starts with the climb, pauses with it and fades
when Puff is caught. It was tuned against a reference by measurement: about 64 BPM,
brightness 750–860 Hz, almost nothing under 130 Hz. Effects: a faint bounce note
taken from the chord the music is on, rising with a climbing streak, plus crack,
boing, kick, spark, zone chime, new best and a drone as the line nears. M or SOUND
mutes everything and persists. Also zone title cards below Puff, a dashed best-height line, an off-screen
line gauge, landing squash and dust, shake for springs, kicks and breaks only, and
a 700 ms hit beat before the results (none of the motion under reduced motion).

Frames: the simulation stays fixed-step and drawing blends the last two steps, so
motion is even at any refresh rate; Puff redraws into one reused canvas.

Validation:

- `pnpm test:puff`: 34 tests passed. They include a replay of every certified hop
  (41 seeds to 1400 m, 53,299 hops, 177 fork merges, eight phases per mover, with
  the other ledge of a fork row present) under the real physics, gates/teach/runs per zone, forks, sparks, kickers, cue
  mapping, rebuild times, and the bot clearing the default course.
- `node scripts/puff-bot.mjs 100 1250`: 100/100 seeds cleared 1250 m (zones 0–6)
  through `stepRun`. `pnpm test:puff:bot` runs the same sweep on 40 seeds.
- Frame pacing (WebKit, virtual 60/120/144 Hz, paced, two seeds to 1000 m): 0
  frames off smooth after warm-up in every zone; 0 canvases created after warm-up.
  Per-frame JS p99 0.3–0.6 ms below 600 m and 1.0–2.2 ms above. Occasional 5–20 ms
  frames appeared equally in builds without the new drawing under a host load of
  5–8, so the 6 ms ceiling is not proven on this machine.
- Umbra at 1280×900 and 390×844: banners, gate labels, kickers, sparks, rebuild
  ghosts, gauge, best line, death beat, results and mute checked with no console
  errors. Not checked: a physical 120 Hz display, Chrome/Firefox, real iOS.
