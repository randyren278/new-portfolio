/**
 * Training status — pure derivation.
 *
 * Takes what the loader fetched (Coros text already parsed, Strava runs
 * already reduced to a route) and produces the exact view model the page
 * renders. No I/O and no runtime imports, so scripts/training.test.cjs
 * can run it against the captured fixtures with nothing but Node.
 *
 * Dates are athlete-local `YYYY-MM-DD` strings throughout; `today` is
 * supplied by the caller (America/Vancouver), never read from the clock.
 */

import type {
  CorosActivityDetail,
  CorosFitness,
  CorosLap,
  CorosLoadDay,
  CorosNightHrv,
  CorosRecord,
  CorosRecovery,
  CorosSleep,
} from './coros/parse';

// ---------------------------------------------------------------- sources

export type StravaRun = {
  id: number;
  start: number; // unix seconds
  date: string;
  sport: Sport;
  indoor: boolean;
  km: number;
  sec: number;
  avgHr: number | null;
  route: string | null; // SVG path in a 160×110 box; public activities only
};

export type Sources = {
  today: string;
  asOf: string; // ISO timestamp of the fetch
  records: CorosRecord[] | null;
  strava: StravaRun[] | null;
  load: CorosLoadDay[] | null;
  fitness: CorosFitness | null;
  recovery: CorosRecovery | null;
  restingHr: { date: string; bpm: number }[] | null;
  hrv: CorosNightHrv[] | null;
  sleep: CorosSleep[] | null;
  details: Record<string, CorosActivityDetail>;
  session: { labelId: string; laps: CorosLap[] } | null;
};

// ------------------------------------------------------------- view model

export type Sport = 'run' | 'ride' | 'walk' | 'other';

export type Activity = {
  id: string;
  date: string;
  start: number;
  sport: Sport;
  indoor: boolean;
  km: number;
  sec: number;
  avgHr: number | null;
  focus: string | null;
  route: string | null;
};

export type Week = {
  start: string;
  runKm: number;
  runSec: number;
  runs: number;
  rideKm: number;
  partial: boolean;
};

export type WeekDay = {
  date: string;
  state: 'run' | 'ride' | 'rest' | 'future';
  title: string;
  km: number;
  sec: number;
  quality: boolean;
};

export type Vital = { value: number; baseline: number | null; series: number[] };

export type Night = {
  date: string;
  hrv: number | null;
  baseline: number | null;
  hrvStatus: string | null;
  rhr: number | null;
  sleep: number | null;
};

export type LapPart = 'warmup' | 'rep' | 'rest' | 'cooldown';

export type Session = {
  date: string;
  title: string;
  focus: string | null;
  km: number;
  sec: number;
  repKm: number;
  repPace: number;
  trainingLoad: number | null;
  laps: (CorosLap & { part: LapPart })[];
  reps: {
    n: number;
    km: number;
    sec: number;
    pace: number;
    hr: number | null;
    watts: number | null;
  }[];
  fastest: number; // index into reps
};

export type TrainingView = {
  asOf: string;
  today: string;
  source: 'coros' | 'strava';
  status: {
    word: string;
    ratio: number;
    shortTerm: number;
    longTerm: number;
    longTermChange: number | null; // fraction over 14 days
    essay: string;
  } | null;
  metrics: { km7: number; km7prev: number; km28: number; streak: number; longest: number };
  readiness: {
    pct: number;
    level: string | null;
    fullRecoveryHours: number | null;
    hrv: Vital | null;
    rhr: Vital | null;
    sleep: Vital | null;
  } | null;
  load: CorosLoadDay[] | null;
  week: { start: string; days: WeekDay[]; km: number; vsLastWeek: number };
  session: Session | null;
  notes: { when: string; text: string }[];
  volume: Week[];
  nights: Night[] | null;
  focus: { label: string; sec: number; rank: number }[] | null;
  heat: { start: string; days: { date: string; km: number; tip: string }[] };
  consistency: {
    daysRun: number;
    daysTotal: number;
    streak: number;
    longest: number;
    avgWeekKm: number;
  };
  predictor: CorosFitness | null;
  lines: Activity[];
  odometer: {
    since: string;
    km: number;
    sec: number;
    runs: number;
    longestKm: number;
    rideKm: number;
  };
};

// ----------------------------------------------------------------- format

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const pad = (n: number) => String(n).padStart(2, '0');

const toDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};
const fromDate = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const shift = (s: string, days: number) => {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDate(d);
};
export const weekday = (s: string) => DOW[toDate(s).getUTCDay()];
export const mondayOf = (s: string) => shift(s, -((toDate(s).getUTCDay() + 6) % 7));
export const fmtDay = (s: string) => {
  const d = toDate(s);
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
export const fmtDow = (s: string) => `${weekday(s)} ${fmtDay(s)}`;
export const monthOf = (s: string) => MON[toDate(s).getUTCMonth()];

/** seconds per km → "3:14" */
export const pace = (secPerKm: number) => {
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};
/** seconds → "1:26:08" or "5:54" */
export const clock = (sec: number) => {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
};
/** seconds → "1h 26m" */
export const hm = (sec: number) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${pad(m % 60)}m` : `${m}m`;
};
export const km1 = (km: number) => km.toFixed(1);

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ----------------------------------------------------------- activities

const QUALITY = /threshold|vo2|anaerobic|sprint|speed|tempo/i;
export const isQuality = (focus: string | null) => !!focus && QUALITY.test(focus);

const FOCUS_ORDER = [
  'Recovery',
  'Base',
  'Aerobic Endurance',
  'Endurance',
  'Threshold',
  'VO2 Max',
  'Anaerobic',
  'Sprint',
];

/** Coros focus → the short title a day gets in the week list. */
export function runTitle(a: Pick<Activity, 'focus' | 'indoor'>): string {
  const f = a.focus;
  const kind = f === 'Base' ? 'Aerobic base' : f === 'VO2 Max' ? 'VO2 max' : f || 'Run';
  return a.indoor ? `Treadmill · ${kind.toLowerCase()}` : kind;
}

function sportOfCoros(kind: string): { sport: Sport; indoor: boolean } {
  if (/run/i.test(kind)) return { sport: 'run', indoor: /indoor|treadmill/i.test(kind) };
  if (/cycl|bike|ride/i.test(kind)) return { sport: 'ride', indoor: /indoor/i.test(kind) };
  if (/walk|hike/i.test(kind)) return { sport: 'walk', indoor: false };
  return { sport: 'other', indoor: /indoor|gym/i.test(kind) };
}

function activitiesOf(src: Sources): Activity[] {
  const strava = src.strava ?? [];
  // Coros records and Strava uploads of the same session start within a
  // few seconds of each other; five minutes absorbs any clock skew.
  const routeFor = (start: number) =>
    strava.find((s) => Math.abs(s.start - start) <= 300 && s.route)?.route ?? null;

  if (src.records) {
    return src.records
      .map((r) => {
        const { sport, indoor } = sportOfCoros(r.kind);
        return {
          id: r.labelId,
          date: r.date,
          start: r.start,
          sport,
          indoor,
          km: r.km ?? 0,
          sec: r.durationSec,
          avgHr: r.avgHr,
          focus: src.details[r.labelId]?.focus ?? null,
          route: indoor ? null : routeFor(r.start),
        };
      })
      .sort((a, b) => a.start - b.start);
  }
  return strava
    .map((s) => ({
      id: String(s.id),
      date: s.date,
      start: s.start,
      sport: s.sport,
      indoor: s.indoor,
      km: s.km,
      sec: s.sec,
      avgHr: s.avgHr,
      focus: null,
      route: s.route,
    }))
    .sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------- session

const NAMED: [number, string][] = [
  [0.2, '200 m'],
  [0.3, '300 m'],
  [0.4, '400 m'],
  [0.5, '500 m'],
  [0.6, '600 m'],
  [0.8, '800 m'],
  [1, '1 km'],
  [1.2, '1.2 km'],
  [1.5, '1.5 km'],
  [1.609344, '1 mi'],
  [2, '2 km'],
  [3, '3 km'],
  [3.218688, '2 mi'],
  [4, '4 km'],
  [4.828032, '3 mi'],
  [5, '5 km'],
  [6, '6 km'],
  [8, '8 km'],
  [10, '10 km'],
];

function repLabel(km: number, sec: number): string {
  const named = NAMED.find(([d]) => Math.abs(km - d) / d <= 0.04);
  if (named) return named[1];
  const round = Math.round(sec / 15) * 15;
  if (Math.abs(sec - round) <= 4) return clock(round);
  return `${km1(km)} km`;
}

/** "2 × 1 mi, 2 mi, 3 × 1 mi" — consecutive equal reps collapse. */
export function describeReps(reps: { km: number; sec: number }[]): string {
  const groups: { label: string; n: number }[] = [];
  for (const r of reps) {
    const label = repLabel(r.km, r.sec);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.n++;
    else groups.push({ label, n: 1 });
  }
  if (groups.length > 4) return `${reps.length} reps`;
  return groups.map((g) => (g.n > 1 ? `${g.n} × ${g.label}` : g.label)).join(', ');
}

/**
 * Split laps into warm-up / reps / recoveries / cool-down. Reps are the
 * fast cluster: sort the paces of every lap long enough to have one and
 * cut at the widest gap. A gap under 12% means a steady run — no reps.
 */
export function classifyLaps(laps: CorosLap[]): LapPart[] | null {
  const moving = laps
    .map((l, i) => ({ i, pace: l.km >= 0.2 && l.sec > 0 ? l.sec / l.km : Number.NaN }))
    .filter((l) => Number.isFinite(l.pace));
  if (moving.length < 3) return null;
  const sorted = [...moving].sort((a, b) => a.pace - b.pace);
  let cut = -1;
  let widest = 1;
  for (let k = 0; k < sorted.length - 1; k++) {
    const ratio = sorted[k + 1].pace / sorted[k].pace;
    if (ratio > widest) {
      widest = ratio;
      cut = k;
    }
  }
  if (widest < 1.12 || cut < 0) return null;
  const limit = sorted[cut].pace;
  const isRep = new Set(moving.filter((l) => l.pace <= limit).map((l) => l.i));
  const repIdx = [...isRep].sort((a, b) => a - b);
  const first = repIdx[0];
  const last = repIdx[repIdx.length - 1];
  return laps.map((_, i) =>
    isRep.has(i)
      ? 'rep'
      : laps[i].km < 0.2
        ? 'rest' // a few seconds' lap — standing, or a late button press
        : i < first
          ? 'warmup'
          : i > last
            ? 'cooldown'
            : 'rest',
  );
}

function deriveSession(src: Sources, acts: Activity[]): Session | null {
  if (!src.session) return null;
  const act = acts.find((a) => a.id === src.session?.labelId);
  const parts = classifyLaps(src.session.laps);
  if (!act || !parts) return null;
  const laps = src.session.laps.map((l, i) => ({ ...l, part: parts[i] }));
  const reps = laps
    .filter((l) => l.part === 'rep')
    .map((l, n) => ({
      n: n + 1,
      km: l.km,
      sec: l.sec,
      pace: l.sec / l.km,
      hr: l.hr,
      watts: l.watts,
    }));
  const repKm = reps.reduce((s, r) => s + r.km, 0);
  const repSec = reps.reduce((s, r) => s + r.sec, 0);
  let fastest = 0;
  reps.forEach((r, i) => {
    if (r.pace < reps[fastest].pace) fastest = i;
  });
  return {
    date: act.date,
    title: describeReps(reps),
    focus: act.focus,
    km: laps.reduce((s, l) => s + l.km, 0),
    sec: laps.reduce((s, l) => s + l.sec, 0),
    repKm,
    repPace: repSec / repKm,
    trainingLoad: src.details[act.id]?.trainingLoad ?? null,
    laps,
    reps,
    fastest,
  };
}

// ------------------------------------------------------------------ view

export function deriveView(src: Sources): TrainingView {
  const { today } = src;
  const acts = activitiesOf(src);
  const runs = acts.filter((a) => a.sport === 'run');

  // Day index over a 26-week window ending this Sunday.
  const heatStart = shift(mondayOf(today), -7 * 25);
  const byDay = new Map<string, Activity[]>();
  for (const a of acts) {
    if (a.date < heatStart || a.date > today) continue;
    const list = byDay.get(a.date) ?? [];
    list.push(a);
    byDay.set(a.date, list);
  }
  const runKmOn = (d: string) =>
    (byDay.get(d) ?? []).filter((a) => a.sport === 'run').reduce((s, a) => s + a.km, 0);
  const sumRunKm = (from: string, to: string) => {
    let s = 0;
    for (let d = from; d <= to; d = shift(d, 1)) s += runKmOn(d);
    return s;
  };

  // Weeks.
  const weeks: Week[] = [];
  for (let w = heatStart; w <= today; w = shift(w, 7)) {
    const week: Week = {
      start: w,
      runKm: 0,
      runSec: 0,
      runs: 0,
      rideKm: 0,
      partial: shift(w, 6) >= today,
    };
    for (let d = w; d <= shift(w, 6) && d <= today; d = shift(d, 1)) {
      for (const a of byDay.get(d) ?? []) {
        if (a.sport === 'run') {
          week.runKm += a.km;
          week.runSec += a.sec;
          week.runs++;
        } else if (a.sport === 'ride') week.rideKm += a.km;
      }
    }
    weeks.push(week);
  }
  const fullWeeks = weeks.filter((w) => !w.partial);
  const lastFull = fullWeeks[fullWeeks.length - 1];
  const biggest = fullWeeks.reduce<Week | null>((b, w) => (!b || w.runKm > b.runKm ? w : b), null);

  // Streaks (days with a run).
  let streak = 0;
  for (let d = today; d >= heatStart && runKmOn(d) > 0; d = shift(d, -1)) streak++;
  // A rest day *today* shouldn't zero a streak that ran through yesterday.
  if (streak === 0)
    for (let d = shift(today, -1); d >= heatStart && runKmOn(d) > 0; d = shift(d, -1)) streak++;
  let longest = 0;
  let run = 0;
  for (let d = heatStart; d <= today; d = shift(d, 1)) {
    run = runKmOn(d) > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // This week.
  const wkStart = mondayOf(today);
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = shift(wkStart, i);
    const list = byDay.get(date) ?? [];
    const dayRuns = list.filter((a) => a.sport === 'run');
    if (date > today) {
      days.push({ date, state: 'future', title: '', km: 0, sec: 0, quality: false });
    } else if (dayRuns.length) {
      const main = dayRuns.reduce((m, a) => (a.km > m.km ? a : m));
      days.push({
        date,
        state: 'run',
        title: runTitle(main),
        km: dayRuns.reduce((s, a) => s + a.km, 0),
        sec: dayRuns.reduce((s, a) => s + a.sec, 0),
        quality: dayRuns.some((a) => isQuality(a.focus)),
      });
    } else if (list.some((a) => a.sport === 'ride')) {
      const rides = list.filter((a) => a.sport === 'ride');
      days.push({
        date,
        state: 'ride',
        title: 'Ride',
        km: rides.reduce((s, a) => s + a.km, 0),
        sec: rides.reduce((s, a) => s + a.sec, 0),
        quality: false,
      });
    } else days.push({ date, state: 'rest', title: 'Rest', km: 0, sec: 0, quality: false });
  }
  const weekKm = sumRunKm(wkStart, today);
  const daysIn = days.filter((d) => d.state !== 'future').length;
  const lastWeekSame = sumRunKm(shift(wkStart, -7), shift(wkStart, -7 + daysIn - 1));

  // Session + Coros-only panels.
  const session = deriveSession(src, acts);
  const nights = deriveNights(src, today);
  const readiness = deriveReadiness(src, today);
  const focus = deriveFocus(src, runs, today);

  const km7 = sumRunKm(shift(today, -6), today);
  const km7prev = sumRunKm(shift(today, -13), shift(today, -7));
  const km28 = sumRunKm(shift(today, -27), today);

  const status = deriveStatus(src, { biggest, lastFull, session, nights });

  const notes = deriveNotes(src, {
    session,
    biggest,
    lastFull,
    nights,
    streak,
    longest,
    acts,
    today,
  });

  // Heatmap + consistency.
  const heatDays: { date: string; km: number; tip: string }[] = [];
  for (let d = heatStart; d <= shift(mondayOf(today), 6); d = shift(d, 1)) {
    const list = (byDay.get(d) ?? []).filter((a) => a.sport === 'run' || a.sport === 'ride');
    const tip = list.length
      ? list
          .map((a) =>
            a.sport === 'ride'
              ? `${km1(a.km)} km ride`
              : `${km1(a.km)} km · ${runTitle(a).toLowerCase()}`,
          )
          .join(' + ')
      : 'Rest';
    heatDays.push({ date: d, km: runKmOn(d), tip });
  }
  const pastDays = heatDays.filter((d) => d.date <= today);
  const daysRun = pastDays.filter((d) => d.km > 0).length;
  const windowKm = pastDays.reduce((s, d) => s + d.km, 0);

  const windowActs = acts.filter((a) => a.date >= heatStart && a.date <= today);
  const windowRuns = windowActs.filter((a) => a.sport === 'run');

  return {
    asOf: src.asOf,
    today,
    source: src.records ? 'coros' : 'strava',
    status,
    metrics: { km7, km7prev, km28, streak, longest },
    readiness,
    load: src.load?.length ? src.load : null,
    week: { start: wkStart, days, km: weekKm, vsLastWeek: weekKm - lastWeekSame },
    session,
    notes,
    volume: weeks.slice(-12),
    nights,
    focus,
    heat: { start: heatStart, days: heatDays },
    consistency: {
      daysRun,
      daysTotal: pastDays.length,
      streak,
      longest,
      avgWeekKm: windowKm / (pastDays.length / 7),
    },
    predictor: src.fitness?.predictions.length ? src.fitness : null,
    lines: windowActs
      .filter((a) => a.sport === 'run' || a.sport === 'ride')
      .slice(-8)
      .reverse(),
    odometer: {
      since: heatStart,
      km: windowRuns.reduce((s, a) => s + a.km, 0),
      sec: windowRuns.reduce((s, a) => s + a.sec, 0),
      runs: windowRuns.length,
      longestKm: windowRuns.reduce((m, a) => Math.max(m, a.km), 0),
      rideKm: windowActs.filter((a) => a.sport === 'ride').reduce((s, a) => s + a.km, 0),
    },
  };
}

function deriveNights(src: Sources, today: string): Night[] | null {
  if (!src.hrv && !src.restingHr && !src.sleep) return null;
  const from = shift(today, -20);
  const out: Night[] = [];
  for (let d = from; d <= today; d = shift(d, 1)) {
    const h = src.hrv?.find((x) => x.date === d);
    out.push({
      date: d,
      hrv: h?.hrv ?? null,
      baseline: h?.baseline ?? null,
      hrvStatus: h?.status ?? null,
      rhr: src.restingHr?.find((x) => x.date === d)?.bpm ?? null,
      sleep: src.sleep?.find((x) => x.date === d)?.score ?? null,
    });
  }
  return out.some((n) => n.hrv != null || n.rhr != null || n.sleep != null) ? out : null;
}

function deriveReadiness(src: Sources, today: string): TrainingView['readiness'] {
  if (!src.recovery) return null;
  const last = <T extends { date: string }>(xs: T[] | null) =>
    xs?.filter((x) => x.date <= today).slice(-14) ?? [];
  const hrv = last(src.hrv);
  const rhr = last(src.restingHr);
  const sleep = last(src.sleep);
  const lastHrv = hrv[hrv.length - 1];
  const lastRhr = rhr[rhr.length - 1];
  const lastSleep = sleep[sleep.length - 1];
  return {
    pct: src.recovery.pct,
    level: src.recovery.level,
    fullRecoveryHours: src.recovery.fullRecoveryHours,
    hrv: lastHrv
      ? { value: lastHrv.hrv, baseline: lastHrv.baseline, series: hrv.map((x) => x.hrv) }
      : null,
    rhr: lastRhr
      ? {
          value: lastRhr.bpm,
          // Baseline = median of the preceding nights, never the night itself.
          baseline: median(
            (src.restingHr ?? [])
              .filter((x) => x.date < lastRhr.date && x.date >= shift(lastRhr.date, -21))
              .map((x) => x.bpm),
          ),
          series: rhr.map((x) => x.bpm),
        }
      : null,
    sleep: lastSleep
      ? {
          value: lastSleep.score,
          baseline: median(sleep.slice(0, -1).map((x) => x.score)),
          series: sleep.map((x) => x.score),
        }
      : null,
  };
}

function deriveFocus(src: Sources, runs: Activity[], today: string): TrainingView['focus'] {
  const recent = runs.filter((a) => a.date > shift(today, -28) && a.date <= today);
  if (!recent.length || !recent.some((a) => a.focus)) return null;
  const sec = new Map<string, number>();
  for (const a of recent) {
    const label = a.focus ?? 'Unclassified';
    sec.set(label, (sec.get(label) ?? 0) + a.sec);
  }
  const rank = (label: string) => {
    const i = FOCUS_ORDER.indexOf(label);
    return i < 0 ? FOCUS_ORDER.length : i;
  };
  return [...sec.entries()]
    .map(([label, s]) => ({ label, sec: s, rank: label === 'Unclassified' ? -1 : rank(label) }))
    .sort((a, b) => a.rank - b.rank);
}

function deriveStatus(
  src: Sources,
  ctx: {
    biggest: Week | null;
    lastFull: Week | undefined;
    session: Session | null;
    nights: Night[] | null;
  },
): TrainingView['status'] {
  const load = src.load;
  if (!load?.length) return null;
  const now = load[load.length - 1];
  const before = load.find((d) => d.date === shift(now.date, -14)) ?? load[0];
  const longTermChange =
    before && before !== now ? (now.longTerm - before.longTerm) / before.longTerm : null;

  const parts: string[] = [];
  if (longTermChange != null) {
    const pct = Math.round(Math.abs(longTermChange) * 100);
    parts.push(
      longTermChange > 0.02
        ? `Long-term load is up ${pct}% in two weeks`
        : longTermChange < -0.02
          ? `Long-term load is down ${pct}% in two weeks`
          : 'Long-term load is holding steady',
    );
  }
  // Coros grades each night against its own normal range; count its verdicts.
  const graded = (ctx.nights ?? []).filter((n) => n.hrvStatus).slice(-10);
  if (graded.length >= 5) {
    const ok = graded.filter((n) => !/low/i.test(n.hrvStatus ?? '')).length;
    parts.push(`HRV has read normal or better ${ok} of the last ${graded.length} nights`);
  }
  let essay = parts.length ? `${parts.join(', and ')}.` : '';
  if (ctx.biggest && ctx.biggest === ctx.lastFull) {
    essay += ` Last week was the biggest in six months at ${km1(ctx.biggest.runKm)} km.`;
  }
  if (ctx.session) {
    const fast = ctx.session.reps[ctx.session.fastest];
    essay += ` The latest session, ${ctx.session.title}, peaked at ${pace(fast.pace)} per kilometre.`;
  }
  return {
    word: now.comment ?? 'Training',
    ratio: now.ratio,
    shortTerm: now.shortTerm,
    longTerm: now.longTerm,
    longTermChange,
    essay: essay.trim(),
  };
}

function deriveNotes(
  src: Sources,
  ctx: {
    session: Session | null;
    biggest: Week | null;
    lastFull: Week | undefined;
    nights: Night[] | null;
    streak: number;
    longest: number;
    acts: Activity[];
    today: string;
  },
): { when: string; text: string }[] {
  const notes: { when: string; text: string }[] = [];
  const s = ctx.session;
  if (s) {
    const fast = s.reps[s.fastest];
    const lastIsFastest = s.fastest === s.reps.length - 1;
    const maxHr = Math.max(...s.reps.map((r) => r.hr ?? 0));
    notes.push({
      when: fmtDow(s.date),
      text: `${s.reps.length} reps at ${pace(s.repPace)} /km on average, ${
        lastIsFastest
          ? `the last one quickest at ${pace(fast.pace)}.`
          : `quickest on rep ${fast.n} at ${pace(fast.pace)}.`
      }${maxHr ? ` Heart rate topped out at ${maxHr}.` : ''}`,
    });
  }
  if (ctx.biggest && ctx.biggest === ctx.lastFull) {
    notes.push({
      when: `${fmtDay(ctx.biggest.start)} – ${fmtDay(shift(ctx.biggest.start, 6))}`,
      text: `Biggest week in the last six months: ${km1(ctx.biggest.runKm)} km of running${ctx.biggest.rideKm > 5 ? `, plus ${km1(ctx.biggest.rideKm)} km on the bike.` : '.'}`,
    });
  }
  // Nights Coros flagged Low, with what came before and after.
  const nights = ctx.nights ?? [];
  nights.forEach((n, i) => {
    if (n.hrvStatus?.toLowerCase() !== 'low' || n.hrv == null) return;
    const prev = ctx.acts.filter((a) => a.date === shift(n.date, -1) && a.sport === 'run');
    const prevKm = prev.reduce((t, a) => t + a.km, 0);
    const why = prevKm
      ? `the night after ${km1(prevKm)} km${prev.some((a) => isQuality(a.focus)) ? ' of hard running' : ''}`
      : n.sleep != null
        ? `on a sleep score of ${n.sleep}`
        : 'overnight';
    const next = nights[i + 1];
    notes.push({
      when: fmtDow(n.date),
      text: `HRV dropped to ${n.hrv} ms ${why}${next?.hrv != null ? `, then came back to ${next.hrv} the next night.` : '.'}`,
    });
  });
  const excessive = [...(src.load ?? [])].reverse().find((d) => /excessive/i.test(d.comment ?? ''));
  if (excessive) {
    notes.push({
      when: fmtDow(excessive.date),
      text: `Load ratio reached ${excessive.ratio.toFixed(2)} — Coros called it ${excessive.comment?.toLowerCase()}.`,
    });
  }
  if (ctx.streak >= 3) {
    notes.push({
      when: 'Today',
      text: `${ctx.streak} days in a row with a run${ctx.streak >= ctx.longest ? ', the longest streak in six months.' : '.'}`,
    });
  }
  return notes.slice(0, 6);
}
