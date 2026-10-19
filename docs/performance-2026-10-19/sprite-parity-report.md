# Lazy sprite parity verification

PASS. Browser-observed SHA-256 hashes match baseline for all 795 palette-index sprite frames across Space, Pool, legacy Kite, Walk, Skate, Scooter, Bike, and Car. Sheet dimensions, fps, palettes, and animation metadata also match. All 48 kite body canvases, the kite sail, and 288 `bodyFor` variants (48 indices × blink false/true × look -1/0/1) produce matching RGBA hashes. Zero mismatches across 795 frame comparisons and 337 canvas comparisons.

Verified via Umbra WebKit using a dedicated `scratch-portfolio-sprite-audit` profile against:

- Baseline: `http://127.0.0.1:4317/puff-intro/index.html?scene=space`
- Candidate: `http://127.0.0.1:4319/puff-intro/index.html?scene=space`

The scene was stopped at the beginning of each evaluation to avoid concurrent frame mutation. Before forcing frame reads, descriptors were inspected without invoking getters. Baseline had 795 initialized sprite frames, 48 initialized kite body canvases, and an initialized sail. Candidate had 41 initialized Space frames with 90 remaining getters, zero initialized frames for every other sprite sheet, 48 uninvoked kite body getters, and an uninvoked sail getter. This is the state after normal navigation and some elapsed scene runtime, not a measurement at first paint. All candidate frame/part descriptors became values after the exhaustive comparison, as intended.

The exact Space hello protocol was exercised: `savedFrames = frames.slice()`, cache clear, `frames.map(...)` replacing indices 30–97 with the saved wave sequence, and restoration through `savedFrames.slice()`. Both builds preserve full arrays of length 131, the expected object references, and the original frame sequence. Repeated `bodyFor` requests return the same cached canvas identity.

Identity evidence:

- Baseline served `puff-pixels.js` SHA-256: `7f9ad7bf8c519f83f9167038569577b5bd7556d09d7a7bc7084b9ec9bf1fc6f6`
- Candidate served SHA-256: `ae2c0ed8bbb27797c4bdc20a328a2b5407ede1b4ee99b8cf8cb1db53c6306133`
- Current filesystem candidate SHA-256 matches the candidate served source.

Evidence files:

- `sprite-parity-eval.js`: browser evaluation source and coverage logic.
- `sprite-parity-baseline.json`: individual baseline frame/canvas hashes, descriptors and array checks.
- `sprite-parity-candidate.json`: individual candidate hashes, descriptors and array checks.
- `sprite-parity-summary.json`: aggregate comparison with zero mismatches and source identities.

The dedicated Umbra profile was stopped successfully after verification. No product source or scene code was changed. This verifies sprite pixel/array parity; it does not establish full animation/transit visual parity, production deployment state, or a performance measurement.
