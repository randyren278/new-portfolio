/**
 * Unit tests for the training status data layer: Coros parsers and the
 * pure derivation. Runs against real Coros responses captured into
 * src/training/fixtures (coordinates stripped).
 *
 *   pnpm test:training
 */

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const FX = join(__dirname, '../src/training/fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');

let P;
let D;
test.before(async () => {
  P = await import('../src/training/coros/parse.ts');
  D = await import('../src/training/derive.ts');
});

function sources(overrides = {}) {
  const details = Object.fromEntries(
    Object.entries(JSON.parse(fx('activity-details.json'))).map(([k, v]) => [
      k,
      P.parseActivityDetail(v),
    ]),
  );
  return {
    today: '2026-10-10',
    asOf: '2026-10-10T19:00:00.000Z',
    records: P.parseSportRecords(fx('sport-records.txt')),
    strava: null,
    load: P.parseTrainingLoad(fx('training-load.txt')),
    fitness: P.parseFitness(fx('fitness.txt')),
    recovery: P.parseRecovery(fx('recovery.txt')),
    restingHr: P.parseRestingHr(fx('resting-hr.txt')),
    hrv: P.parseSleepHrv(fx('sleep-hrv.txt')),
    sleep: P.parseSleepOverview(fx('sleep-overview.txt')),
    details,
    session: {
      labelId: '480944039976271974',
      laps: P.parseLaps(fx('laps-480944039976271974.json')).laps,
    },
    ...overrides,
  };
}

test('unwrapText decodes a JSON string literal and passes plain text through', () => {
  assert.equal(P.unwrapText('"a\\nb"'), 'a\nb');
  assert.equal(P.unwrapText('plain'), 'plain');
});

test('sport records parse every block, with optional fields', () => {
  const r = P.parseSportRecords(fx('sport-records.txt'));
  assert.equal(r.length, 117);
  assert.deepEqual(r[0], {
    labelId: '480944039976271974',
    sportType: 100,
    kind: 'Outdoor Run',
    date: '2026-10-10',
    start: 1791648846,
    durationSec: 4156,
    km: 15.41,
  });
  const ride = r.find((x) => x.kind === 'Cycling');
  assert.ok(ride && ride.km > 0, 'cycling keeps its distance');
});

test('training load, fitness, recovery, resting HR, HRV and sleep parse', () => {
  const load = P.parseTrainingLoad(fx('training-load.txt'));
  assert.equal(load.length, 31);
  assert.deepEqual(load.at(-1), {
    date: '2026-10-10',
    comment: 'Optimized',
    shortTerm: 128,
    longTerm: 100,
    ratio: 1.28,
  });
  assert.ok(load[0].date < load.at(-1).date, 'load is ascending');

  const fit = P.parseFitness(fx('fitness.txt'));
  assert.equal(fit.vo2max, 64);
  assert.equal(fit.thresholdPace, 190);
  assert.deepEqual(
    fit.predictions.map((p) => [p.label, p.sec]),
    [
      ['5K', 900],
      ['10K', 1852],
      ['Half', 4035],
      ['Marathon', 8263],
    ],
  );

  assert.deepEqual(P.parseRecovery(fx('recovery.txt')), {
    pct: 79,
    level: 'Moderate training recommended',
    fullRecoveryHours: 28,
  });
  assert.equal(P.parseRecovery('nothing here'), null);

  const rhr = P.parseRestingHr(fx('resting-hr.txt'));
  assert.deepEqual(rhr.at(-1), { date: '2026-10-10', bpm: 53 });
  assert.ok(rhr[0].date < rhr.at(-1).date, 'resting HR is ascending');

  const hrv = P.parseSleepHrv(fx('sleep-hrv.txt'));
  assert.equal(hrv.length, 33);
  assert.deepEqual(
    hrv.find((n) => n.date === '2026-09-28'),
    { date: '2026-09-28', hrv: 39, status: 'Low', low: 67, high: 97, baseline: 82 },
  );

  const sleep = P.parseSleepOverview(fx('sleep-overview.txt'));
  assert.deepEqual(sleep.at(-1), { date: '2026-10-10', score: 85, asleepMin: 486 });
});

test('laps prefer the manual group and convert centimetres', () => {
  const l = P.parseLaps(fx('laps-480944039976271974.json'));
  assert.equal(l.source, 'manual');
  assert.equal(l.laps.length, 19);
  assert.ok(Math.abs(l.laps[2].km - 1.00845) < 1e-9);
  assert.equal(P.parseLaps('not json'), null);
});

test('reps are found at the widest pace gap and named', () => {
  const vo2 = P.parseLaps(fx('laps-480944039976271974.json')).laps;
  const parts = D.classifyLaps(vo2);
  assert.equal(parts.filter((p) => p === 'rep').length, 8);
  assert.equal(parts[0], 'warmup');
  assert.equal(parts.at(-1), 'cooldown');
  assert.equal(parts[3], 'rest');
  assert.equal(parts[17], 'rest', 'a 12-second lap after the last rep is not a cool-down');
  assert.equal(parts[18], 'cooldown');

  const tempo = P.parseLaps(fx('laps-480857205141176320.json')).laps;
  const tParts = D.classifyLaps(tempo);
  const reps = tempo.filter((_, i) => tParts[i] === 'rep');
  assert.equal(reps.length, 6);
  assert.equal(D.describeReps(reps), '2 × 1 mi, 2 mi, 3 × 1 mi');
  assert.equal(D.describeReps(vo2.filter((_, i) => parts[i] === 'rep')), '8 × 1 km');

  const steady = [1, 1, 1, 1, 1].map((km, i) => ({ km, sec: 290 + i * 3, hr: 140, watts: 230 }));
  assert.equal(D.classifyLaps(steady), null, 'an even run has no reps');
  assert.equal(
    D.describeReps([
      { km: 0.93, sec: 180 },
      { km: 0.95, sec: 181 },
    ]),
    '2 × 3:00',
  );
});

test('last month of real laps preserves work, strides and continuous runs', () => {
  const month = JSON.parse(fx('laps-2026-09-21-to-10-20.json'));
  for (const run of month) {
    const parts = D.classifyLaps(run.laps);
    const indices = run.laps.flatMap((_, i) => (parts?.[i] === 'rep' ? [i] : []));
    assert.deepEqual(indices, run.expectedReps, `${run.date} ${run.labelId}: work laps`);
    if (run.expectedTitle) {
      assert.equal(
        D.describeReps(run.laps.filter((_, i) => indices.includes(i))),
        run.expectedTitle,
        `${run.date}: session title`,
      );
    }
  }
});

test('unseen interval distances with jogging recoveries retain their work laps', () => {
  const lap = (km, sec) => ({ km, sec, watts: null });
  const laps = [
    lap(3, 900),
    lap(1, 190),
    lap(0.4, 150),
    lap(1, 193),
    lap(0.4, 148),
    lap(1, 188),
    lap(2, 640),
  ];
  assert.deepEqual(D.classifyLaps(laps), [
    'warmup',
    'rep',
    'rest',
    'rep',
    'rest',
    'rep',
    'cooldown',
  ]);
});

test('consistent distance evidence wins when mile reps also land near whole minutes', () => {
  assert.equal(
    D.describeReps([
      { km: 1.61, sec: 300 },
      { km: 1.6, sec: 302 },
      { km: 1.62, sec: 298 },
    ]),
    '3 × 1 mi',
  );
});

test('deriveView builds the full page from Coros', () => {
  const v = D.deriveView(sources());
  assert.equal(v.source, 'coros');
  assert.equal(v.status.word, 'Optimized');
  assert.equal(v.status.ratio, 1.28);
  assert.equal(v.readiness.pct, 79);
  assert.equal(v.readiness.hrv.value, 81);
  assert.equal(v.readiness.rhr.value, 53);
  assert.equal(v.readiness.rhr.series.length, 14);
  assert.ok(v.readiness.rhr.baseline > 40 && v.readiness.rhr.baseline < 70);
  assert.equal(v.session.title, '8 × 1 km');
  assert.equal(v.session.focus, 'VO2 Max');
  assert.equal(v.session.reps.length, 8);
  assert.equal(v.week.start, '2026-10-05');
  assert.equal(v.week.days.length, 7);
  assert.equal(v.week.days[5].state, 'run', 'Saturday (today) ran');
  assert.equal(v.week.days[6].state, 'future');
  assert.equal(v.heat.days.length, 26 * 7);
  assert.equal(v.volume.length, 12);
  assert.ok(v.volume.at(-1).partial);
  assert.ok(v.metrics.km7 > 0 && v.metrics.km28 > v.metrics.km7);
  assert.equal(v.nights.length, 21);
  assert.ok(v.focus.some((f) => f.label === 'Base'));
  assert.equal(v.predictor.vo2max, 64);
  assert.equal(v.lines.length, 8);
  assert.equal(v.lines[0].date, '2026-10-10', 'line studies run newest first');
  const hrvNote = v.notes.find((n) => n.text.startsWith('HRV dropped to 39'));
  assert.ok(
    hrvNote,
    `a note calls out the Sep 28 HRV dip (${v.notes.map((n) => n.text).join(' / ')})`,
  );
  assert.ok(v.status.essay.length > 40);
});

test('resting HR reaches the page only in readiness', () => {
  // Randy shows resting HR in the readiness cell and nowhere else; in-session
  // HR never reaches the page. HRV is fine.
  const v = D.deriveView(sources());
  assert.deepEqual(Object.keys(v.readiness.rhr).sort(), ['baseline', 'series', 'value']);
  const json = JSON.stringify({ ...v, readiness: { ...v.readiness, rhr: null } });
  assert.doesNotMatch(json, /"(hr|avgHr|restingHr|maxHr|bpm)"\s*:/);
  assert.equal(json.match(/"rhr"\s*:/g)?.length, 1, 'rhr appears once, nulled above');
  assert.doesNotMatch(json, /heart rate|resting hr|\bbpm\b/i);
  const laps = P.parseLaps(fx('laps-480944039976271974.json')).laps;
  assert.deepEqual(Object.keys(laps[0]).sort(), ['km', 'sec', 'watts']);
});

test('without Coros, Strava carries the activity panels alone', () => {
  const strava = [
    {
      id: 1,
      start: 1791648846,
      date: '2026-10-10',
      sport: 'run',
      indoor: false,
      km: 15.4,
      sec: 4156,
      route: 'M0,0L1,1',
    },
    {
      id: 2,
      start: 1791573777,
      date: '2026-10-09',
      sport: 'run',
      indoor: true,
      km: 13.2,
      sec: 3601,
      route: null,
    },
  ];
  const v = D.deriveView({
    ...sources(),
    records: null,
    strava,
    load: null,
    fitness: null,
    recovery: null,
    restingHr: null,
    hrv: null,
    sleep: null,
    details: {},
    session: null,
  });
  assert.equal(v.source, 'strava');
  assert.equal(v.status, null);
  assert.equal(v.readiness, null);
  assert.equal(v.nights, null);
  assert.equal(v.focus, null);
  assert.equal(v.metrics.streak, 2);
  assert.equal(v.lines[0].route, 'M0,0L1,1');
});

test('Coros activities pick up the matching Strava route', () => {
  const s = sources();
  const v = D.deriveView({
    ...s,
    strava: [
      {
        id: 9,
        start: 1791648850,
        date: '2026-10-10',
        sport: 'run',
        indoor: false,
        km: 15.4,
        sec: 4156,
        route: 'M1,1',
      },
    ],
  });
  assert.equal(v.lines[0].route, 'M1,1');
});

test('the status map is the latest outdoor run over 6 km with a public route', () => {
  const run = (id, date, extra) => ({
    id,
    start: Date.parse(`${date}T15:00:00Z`) / 1000,
    date,
    sport: 'run',
    indoor: false,
    km: 10,
    sec: 2700,
    route: `M${id},${id}`,
    ...extra,
  });
  const view = (strava) =>
    D.deriveView({
      ...sources(),
      records: null,
      strava,
      load: null,
      fitness: null,
      recovery: null,
      restingHr: null,
      hrv: null,
      sleep: null,
      details: {},
      session: null,
    });
  const v = view([
    run(1, '2026-10-02'),
    run(2, '2026-10-04', { km: 8.2 }),
    run(3, '2026-10-05', { sport: 'ride', km: 30 }),
    run(4, '2026-10-06', { km: 5.9 }),
    run(5, '2026-10-07', { km: 12, route: null }),
    run(6, '2026-10-08', { indoor: true, km: 13, route: null }),
  ]);
  assert.equal(v.outdoor.id, '2', 'skips the indoor run, the private route, the short run and the ride');
  assert.equal(v.outdoor.route, 'M2,2');
  assert.equal(view([run(1, '2026-10-08', { km: 4 })]).outdoor, null);
});
