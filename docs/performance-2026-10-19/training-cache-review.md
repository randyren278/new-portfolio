# Training cache single-flight implementation and verification

Result: **PASS** for the requested same-process behavior; **cross-instance cold population remains outside this patch**.

Baseline: `63b4678b925f80bb8e699250f7d8b336eac70a0d`.
Isolated detached worktree: `/tmp/portfolio-perf-training-20261019` (macOS canonical path `/private/tmp/portfolio-perf-training-20261019`).
Changed paths only:

- `site/src/training/cache.ts`
- `site/scripts/training-cache.test.cjs` (new)

No shared application source edits, commit, deployment, live database/API calls, credential reads, or auth mutations. `site/node_modules` is an ignored symlink to the existing dependency installation. Tests compile the actual cache module with the installed TypeScript compiler and run it in a fresh VM per case. Its module loader allows only fake `pg` and fake `next/server`; application `process.env` is replaced with an empty object or a fixed stub URL. No real pool or Next request context is instantiated.

## Change

A module-level pending-promise map deduplicates the complete existing `cached` operation by key. Concurrent same-key callers share the database read, optional upstream fetch, populate write and result. Independent keys remain concurrent. Returning the cleanup-wrapped `finally` promise releases the entry on success or failure without creating an ignored rejecting child promise. The original implementation is otherwise unchanged in private `readCached`.

Durable rows still serve fresh or stale values as before; stale refresh is scheduled through `after` and still uses the existing database claim. No-DB and read-failure cases retain existing local caching/expiry behavior. Write failures remain best effort. This does not implement cross-instance cold locks, stale in-memory fallback during DB outage, or upstream deadlines.

## Behavior regression proof

The new test suite was also run against the exact baseline `cache.ts` source, substituted only in the test process using an intercepted source read. Baseline results: **9 passed, 2 failed**. Both failures were relevant sharing assertions: concurrent cold fetch and shared-source rejection each observed **2 upstream calls where 1 was required**. The implementation passes all **11** checks. No benchmark speedup is claimed from test runtime.

Covered checks: cold same-key upstream/write sharing; independent-key parallelism; shared failure and retry; fresh durable read; immediate stale read and deferred refresh; existing refresh claim; failed refresh retains last good data; local cold/warm/TTL; local failure retry; DB read-failure fallback; best-effort write-failure cleanup.

## Reviewable artifact

Patch: `output/performance-2026-10-19/training-cache.patch`
Patch SHA-256: `bc76b1b667a9cf9d5c6540847850a41be537ba85ad3dc094596387e69ebfe1cb`
Apply from the repository root after review: `git apply output/performance-2026-10-19/training-cache.patch`.

Exact tested file hashes:

- `site/src/training/cache.ts`: `29e2bb5709c802766fa6eb24b011bec4924ae34033415b6eb18f5e7f1b9d8371`
- `site/scripts/training-cache.test.cjs`: `3829f1c71a017a19674f2c9132a979d54513d050cd964720d9557087059ea3fb`

## Final checks

### cache behaviors

Command: `node --test scripts/training-cache.test.cjs`

Exit: 0

```text
✔ concurrent cold requests share one source fetch and populate write (3.958542ms)
✔ independent keys start their source fetches concurrently (0.774375ms)
✔ failed shared source rejects both callers and a later call retries (0.861833ms)
✔ fresh durable data is served without fetching upstream (0.5385ms)
✔ stale durable data returns immediately and refreshes after response (0.683375ms)
✔ existing stale refresh claim prevents a competing source fetch (0.525ms)
✔ failed durable refresh retains last good data (0.924083ms)
✔ local cache shares cold work, serves warm data, and expires at its existing TTL (0.924416ms)
✔ failed local fetch does not poison the next request (1.09075ms)
✔ database read failure still uses the existing local cache fallback (0.82275ms)
✔ durable write failure remains best effort and releases the pending entry (0.725417ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 361.055791
```

### existing training behaviors

Command: `node --experimental-strip-types --no-warnings --test scripts/training.test.cjs`

Exit: 0

```text
✔ unwrapText decodes a JSON string literal and passes plain text through (10.251792ms)
✔ sport records parse every block, with optional fields (3.45925ms)
✔ training load, fitness, recovery, resting HR, HRV and sleep parse (4.840958ms)
✔ laps prefer the manual group and convert centimetres (0.592583ms)
✔ reps are found at the widest pace gap and named (0.996916ms)
✔ deriveView builds the full page from Coros (6.664292ms)
✔ resting HR reaches the page only in readiness (3.149833ms)
✔ without Coros, Strava carries the activity panels alone (2.578209ms)
✔ Coros activities pick up the matching Strava route (2.381209ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 235.727417
```

### scoped lint and formatting

Command: `./node_modules/.bin/biome check src/training/cache.ts scripts/training-cache.test.cjs`

Exit: 0

```text
Checked 2 files in 22ms. No fixes applied.
```

### scoped type check

Command: `./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --esModuleInterop --module commonjs --target ES2022 --moduleResolution node src/training/cache.ts`

Exit: 0

```text
```

### diff whitespace

Command: `git diff --check`

Exit: 0

```text
```
