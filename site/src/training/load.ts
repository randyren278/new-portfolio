/**
 * Training status loader (server only).
 *
 * Coros (via its hosted MCP server) is the source of truth for activities,
 * load, recovery, HRV, sleep, fitness and laps. Strava supplies route
 * shapes, and stands in for the activity list if Coros is unavailable.
 * Each source is cached for 15 minutes; per-activity Coros details and
 * laps never change, so they are cached for good.
 *
 * TRAINING_FIXTURE=1 swaps both sources for the captured responses in
 * ./fixtures — the local smoke runs against that, never a live account.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchActivitiesSince } from '@/strava/client';
import { decodePolyline, projectToSvgPath } from '@/strava/polyline';
import { unstable_cache } from 'next/cache';
import { getCorosToken } from './coros/auth';
import { type CorosClient, connectCoros } from './coros/mcp';
import * as P from './coros/parse';
import {
  type Sources,
  type StravaRun,
  type TrainingView,
  classifyLaps,
  deriveView,
  isQuality,
  mondayOf,
  shift,
} from './derive';

const TZ = 'America/Vancouver';
const FIXTURE_TODAY = '2026-10-10';

type CorosBundle = Omit<Sources, 'today' | 'strava'>;

/** Today's date in Vancouver as YYYY-MM-DD. */
export function todayLocal(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const ymd = (d: string) => d.replaceAll('-', '');
const windowStart = (today: string) => shift(mondayOf(today), -7 * 25);

async function settle<T>(label: string, p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    console.error(`[training] ${label}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Run `fn` over `items`, at most `n` at a time. */
async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

// --------------------------------------------------------------- Coros

type CorosCore = Omit<CorosBundle, 'details' | 'session'>;

/** The day-level calls. Cached as one unit for 15 minutes. */
async function fetchCorosCore(today: string): Promise<CorosCore> {
  const coros: CorosClient = await connectCoros(await getCorosToken());
  const from = windowStart(today);
  const from28 = shift(today, -27);

  // At most two calls in flight: Coros has blocked parallel bursts from
  // this account before (12 at once tripped an anomaly check; 2 was fine).
  const records = await coros
    .call('querySportRecords', {
      startDate: ymd(from),
      endDate: ymd(today),
      sportTypeCodes: [65535],
      minDistanceKm: 0,
      maxDistanceKm: 10000,
      minDurationMinutes: 0,
      maxDurationMinutes: 100000,
      maxAveragePace: '',
      locationKeyword: '',
      limit: 400,
    })
    .then(P.parseSportRecords);
  const [load, fitness] = await Promise.all([
    settle(
      'load',
      coros.call('queryTrainingLoadAssessment', { days: 31 }).then(P.parseTrainingLoad),
    ),
    settle('fitness', coros.call('queryFitnessAssessmentOverview').then(P.parseFitness)),
  ]);
  const [recovery, restingHr] = await Promise.all([
    settle('recovery', coros.call('queryRecoveryStatus').then(P.parseRecovery)),
    settle('resting hr', coros.call('queryRestingHeartRate', { days: 28 }).then(P.parseRestingHr)),
  ]);
  const [hrv, sleep] = await Promise.all([
    settle(
      'hrv',
      coros
        .call('querySleepHrv', { startDate: ymd(from28), endDate: ymd(today), days: 28 })
        .then(P.parseSleepHrv),
    ),
    settle(
      'sleep',
      coros
        .call('querySleepOverview', { startDate: ymd(from28), endDate: ymd(today) })
        .then(P.parseSleepOverview),
    ),
  ]);
  return {
    asOf: new Date().toISOString(),
    records,
    load,
    fitness,
    recovery,
    restingHr,
    hrv,
    sleep,
  };
}

const corosCoreCached = unstable_cache(fetchCorosCore, ['coros-core-v1'], { revalidate: 900 });

/**
 * Per-activity detail and laps never change, so each is cached for good
 * under its own key. These caches must sit outside corosCoreCached: Next
 * bypasses an unstable_cache nested inside another one. A Coros session
 * is only opened if something actually misses.
 */
async function corosPerActivity(
  core: CorosCore,
  today: string,
): Promise<Pick<CorosBundle, 'details' | 'session'>> {
  let client: Promise<CorosClient> | null = null;
  const coros = () => {
    client ??= getCorosToken().then(connectCoros);
    return client;
  };
  const once = (tool: string, r: P.CorosRecord) =>
    unstable_cache(
      async () => (await coros()).call(tool, { labelId: r.labelId, sportType: r.sportType }),
      [`coros-${tool}`, r.labelId],
      { revalidate: false },
    )();

  // Details (training focus, load) for the last four weeks of runs.
  const from28 = shift(today, -27);
  const recentRuns = (core.records ?? []).filter((r) => /run/i.test(r.kind) && r.date >= from28);
  const texts = await pool(recentRuns, 2, (r) => settle('detail', once('getActivityDetail', r)));
  const details: Record<string, P.CorosActivityDetail> = {};
  recentRuns.forEach((r, i) => {
    const text = texts[i];
    if (text) details[r.labelId] = P.parseActivityDetail(text);
  });

  // Latest session: the newest hard run in two weeks whose laps show reps.
  const candidates = recentRuns
    .filter((r) => r.date >= shift(today, -13))
    .filter(
      (r) =>
        isQuality(details[r.labelId]?.focus ?? null) || (details[r.labelId]?.anaerobicTE ?? 0) >= 2,
    )
    .sort((a, b) => b.start - a.start)
    .slice(0, 3);
  for (const r of candidates) {
    const text = await settle('laps', once('queryActivityLapData', r));
    const laps = text ? P.parseLaps(text) : null;
    if (laps && classifyLaps(laps.laps))
      return { details, session: { labelId: r.labelId, laps: laps.laps } };
  }
  return { details, session: null };
}

async function fetchCoros(today: string): Promise<CorosBundle> {
  const core = await corosCoreCached(today);
  return { ...core, ...(await corosPerActivity(core, today)) };
}

// -------------------------------------------------------------- Strava

const RIDE = /ride|cycl/i;
const WALK = /walk|hike/i;

async function fetchStrava(today: string): Promise<StravaRun[]> {
  const after = Math.floor(Date.parse(`${windowStart(today)}T00:00:00-08:00`) / 1000);
  const list = await fetchActivitiesSince(after);
  return list.map((a) => {
    const type = a.sport_type ?? a.type;
    const isPublic = (a.visibility ?? 'everyone') === 'everyone';
    const poly = a.map?.summary_polyline;
    return {
      id: a.id,
      start: Math.floor(Date.parse(a.start_date) / 1000),
      date: (a.start_date_local ?? a.start_date).slice(0, 10),
      sport: /run/i.test(type)
        ? 'run'
        : RIDE.test(type)
          ? 'ride'
          : WALK.test(type)
            ? 'walk'
            : 'other',
      indoor: !!a.trainer || /virtual/i.test(type),
      km: a.distance / 1000,
      sec: a.moving_time,
      avgHr: a.average_heartrate ?? null,
      // Routes only for activities Randy has made public on Strava.
      route: isPublic && poly ? projectToSvgPath(decodePolyline(poly), 160, 110, 10) : null,
    };
  });
}

const stravaCached = unstable_cache(fetchStrava, ['strava-runs-v1'], { revalidate: 900 });

// ------------------------------------------------------------ fixtures

async function fixtureSources(): Promise<Sources> {
  const dir = path.join(process.cwd(), 'src/training/fixtures');
  const fx = (f: string) => readFile(path.join(dir, f), 'utf8');
  const details = JSON.parse(await fx('activity-details.json')) as Record<string, string>;
  const routes = JSON.parse(await fx('strava-routes.synthetic.json')) as { runs: StravaRun[] };
  const laps = P.parseLaps(await fx('laps-480944039976271974.json'));
  return {
    today: FIXTURE_TODAY,
    asOf: '2026-10-10T19:00:00.000Z',
    records: P.parseSportRecords(await fx('sport-records.txt')),
    strava: routes.runs,
    load: P.parseTrainingLoad(await fx('training-load.txt')),
    fitness: P.parseFitness(await fx('fitness.txt')),
    recovery: P.parseRecovery(await fx('recovery.txt')),
    restingHr: P.parseRestingHr(await fx('resting-hr.txt')),
    hrv: P.parseSleepHrv(await fx('sleep-hrv.txt')),
    sleep: P.parseSleepOverview(await fx('sleep-overview.txt')),
    details: Object.fromEntries(
      Object.entries(details).map(([k, v]) => [k, P.parseActivityDetail(v)]),
    ),
    session: laps ? { labelId: '480944039976271974', laps: laps.laps } : null,
  };
}

// ---------------------------------------------------------------- main

export async function loadTrainingView(): Promise<TrainingView | null> {
  if (process.env.TRAINING_FIXTURE === '1') return deriveView(await fixtureSources());
  const today = todayLocal();
  const [coros, strava] = await Promise.all([
    settle('coros', fetchCoros(today)),
    settle('strava', stravaCached(today)),
  ]);
  if (!coros && !strava) return null;
  return deriveView({
    today,
    asOf: coros?.asOf ?? new Date().toISOString(),
    records: coros?.records ?? null,
    strava,
    load: coros?.load ?? null,
    fitness: coros?.fitness ?? null,
    recovery: coros?.recovery ?? null,
    restingHr: coros?.restingHr ?? null,
    hrv: coros?.hrv ?? null,
    sleep: coros?.sleep ?? null,
    details: coros?.details ?? {},
    session: coros?.session ?? null,
  });
}
