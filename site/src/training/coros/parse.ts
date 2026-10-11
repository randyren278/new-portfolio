/**
 * Parsers for the Coros MCP's tool output.
 *
 * Most Coros tools answer with formatted text, not JSON (lap data is the
 * exception). The formats are stable and line-oriented, so each parser
 * reads the fields it needs with anchored regexes and skips anything it
 * does not recognise — a new line in the output never breaks a parse.
 *
 * Pure functions, no imports: scripts/training.test.cjs runs them
 * directly against real captured responses in ../fixtures.
 *
 * Heart rate is deliberately never parsed (Randy keeps HR off the site),
 * so it can't reach the page by accident.
 */

export type CorosRecord = {
  labelId: string;
  sportType: number;
  kind: string; // "Outdoor Run", "Indoor Run", "Cycling", "Gym Cardio", …
  date: string; // YYYY-MM-DD, local to the athlete
  start: number; // unix seconds
  durationSec: number;
  km: number | null;
};

export type CorosLoadDay = {
  date: string;
  comment: string | null;
  shortTerm: number;
  longTerm: number;
  ratio: number;
};

export type CorosFitness = {
  vo2max: number | null;
  runningLevel: number | null;
  thresholdPace: number | null; // sec / km
  predictions: { label: string; km: number; sec: number }[];
};

export type CorosRecovery = {
  pct: number;
  level: string | null;
  fullRecoveryHours: number | null;
};

export type CorosNightHrv = {
  date: string;
  hrv: number;
  status: string | null;
  low: number | null;
  high: number | null;
  baseline: number | null;
};

export type CorosSleep = { date: string; score: number; asleepMin: number | null };

export type CorosActivityDetail = {
  trainingLoad: number | null;
  aerobicTE: number | null;
  anaerobicTE: number | null;
  focus: string | null;
  avgPower: number | null;
};

export type CorosLap = { km: number; sec: number; watts: number | null };

/** MCP text content sometimes arrives as a JSON string literal; unwrap it. */
export function unwrapText(text: string): string {
  const t = text.trim();
  if (t.startsWith('"') && t.endsWith('"')) {
    try {
      return JSON.parse(t) as string;
    } catch {
      return t;
    }
  }
  return t;
}

/** "1:09:16" | "50:02" | "15:00" → seconds. */
export function clockToSec(s: string): number | null {
  const parts = s.trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** "7h 47min" | "49 min" | "8h" → minutes. */
function durationToMin(s: string): number | null {
  const h = /(\d+)\s*h/.exec(s);
  const m = /(\d+)\s*min/.exec(s);
  if (!h && !m) return null;
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

const num = (re: RegExp, s: string): number | null => {
  const m = re.exec(s);
  return m ? Number(m[1]) : null;
};

/** Split "YYYY-MM-DD"-headed blocks: returns [date, body] pairs. */
function dateBlocks(text: string, header: RegExp): [string, string][] {
  const out: [string, string][] = [];
  const marks = [...text.matchAll(header)];
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? text.length) : text.length;
    out.push([m[1], text.slice((m.index ?? 0) + m[0].length, end)]);
  });
  return out;
}

export function parseSportRecords(raw: string): CorosRecord[] {
  const text = unwrapText(raw);
  const records: CorosRecord[] = [];
  const blocks = text.split(/\n(?=\d+\.\s)/);
  for (const block of blocks) {
    const head = /^\d+\.\s+(.+?)\s+—\s+(\d{4}-\d{2}-\d{2})/m.exec(block);
    const label = /LabelId:\s*(\d+)\s*\|\s*SportType:\s*(\d+)/.exec(block);
    const start = /startTimestamp=(\d+)/.exec(block);
    const dur = /Duration:\s*([\d:]+)/.exec(block);
    if (!head || !label || !start || !dur) continue;
    records.push({
      labelId: label[1],
      sportType: Number(label[2]),
      kind: head[1],
      date: head[2],
      start: Number(start[1]),
      durationSec: clockToSec(dur[1]) ?? 0,
      km: num(/Distance:\s*([\d.]+)\s*km/, block),
    });
  }
  return records;
}

export function parseTrainingLoad(raw: string): CorosLoadDay[] {
  const text = unwrapText(raw);
  return dateBlocks(text, /^(\d{4}-\d{2}-\d{2})\s*$/gm)
    .map(([date, body]) => ({
      date,
      comment: /Comment:\s*(.+)/.exec(body)?.[1].trim() ?? null,
      shortTerm: num(/Short-Term Load:\s*([\d.]+)/, body) ?? Number.NaN,
      longTerm: num(/Long-Term Load:\s*([\d.]+)/, body) ?? Number.NaN,
      ratio: num(/Load Ratio:\s*([\d.]+)/, body) ?? Number.NaN,
    }))
    .filter((d) => Number.isFinite(d.shortTerm) && Number.isFinite(d.longTerm))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

const PREDICTIONS: [RegExp, string, number][] = [
  [/^5 km Prediction:\s*([\d:]+)/m, '5K', 5],
  [/^10 km Prediction:\s*([\d:]+)/m, '10K', 10],
  [/^Half Marathon Prediction:\s*([\d:]+)/m, 'Half', 21.0975],
  [/^Marathon Prediction:\s*([\d:]+)/m, 'Marathon', 42.195],
];

export function parseFitness(raw: string): CorosFitness {
  const text = unwrapText(raw);
  const threshold = /Threshold Pace:\s*([\d:]+)\s*\/km/.exec(text);
  return {
    vo2max: num(/VO2max:\s*([\d.]+)/, text),
    runningLevel: num(/Running Level:\s*([\d.]+)/, text),
    thresholdPace: threshold ? clockToSec(threshold[1]) : null,
    predictions: PREDICTIONS.flatMap(([re, label, km]) => {
      const m = re.exec(text);
      const sec = m ? clockToSec(m[1]) : null;
      return sec ? [{ label, km, sec }] : [];
    }),
  };
}

export function parseRecovery(raw: string): CorosRecovery | null {
  const text = unwrapText(raw);
  const pct = num(/Recovery:\s*(\d+)\s*%/, text);
  if (pct == null) return null;
  return {
    pct,
    level: /Level:\s*(.+)/.exec(text)?.[1].trim() ?? null,
    fullRecoveryHours: num(/Estimated Full Recovery:\s*([\d.]+)\s*h/, text),
  };
}

/** Only the daily assessment section; the raw per-sample series is ignored. */
export function parseSleepHrv(raw: string): CorosNightHrv[] {
  const text = unwrapText(raw);
  return [
    ...text.matchAll(
      /^(\d{4}-\d{2}-\d{2}):\s*\n\s*HRV Avg:\s*(\d+)\s*ms(?:\s*—\s*([^\n]+))?\n(?:\s*Normal Range:\s*(\d+)\s*-\s*(\d+)\s*ms\n)?(?:\s*Baseline:\s*(\d+)\s*ms)?/gm,
    ),
  ]
    .map((m) => ({
      date: m[1],
      hrv: Number(m[2]),
      status: m[3]?.trim() ?? null,
      low: m[4] ? Number(m[4]) : null,
      high: m[5] ? Number(m[5]) : null,
      baseline: m[6] ? Number(m[6]) : null,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function parseSleepOverview(raw: string): CorosSleep[] {
  const text = unwrapText(raw);
  return dateBlocks(text, /^(\d{4}-\d{2}-\d{2})\s*\nSleep Score:/gm)
    .map(([date, body]) => {
      const score = num(/^\s*(\d+)/, body);
      const asleep = /Main Sleep \(asleep\):\s*([^\n]+)/.exec(body);
      return {
        date,
        score: score ?? Number.NaN,
        asleepMin: asleep ? durationToMin(asleep[1]) : null,
      };
    })
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function parseActivityDetail(raw: string): CorosActivityDetail {
  const text = unwrapText(raw);
  return {
    trainingLoad: num(/Training Load:\s*([\d.]+)/, text),
    aerobicTE: num(/Aerobic TE:\s*([\d.]+)/, text),
    anaerobicTE: num(/Anaerobic TE:\s*([\d.]+)/, text),
    focus: /Training Focus:\s*(.+)/.exec(text)?.[1].trim() ?? null,
    avgPower: num(/Average Power:\s*(\d+)\s*W/, text),
  };
}

type RawLap = { distance?: number; time?: number; avgPower?: number };
type RawLapGroup = { type?: number; laps?: RawLap[] };

/**
 * Lap JSON. Group type 2 holds the laps pressed on the watch (or a
 * structured workout's steps); type 10 is the automatic 1 km split.
 * Distances are centimetres.
 */
export function parseLaps(raw: string): { source: 'manual' | 'auto'; laps: CorosLap[] } | null {
  let data: { lapGroups?: RawLapGroup[] };
  try {
    data = JSON.parse(unwrapText(raw));
  } catch {
    return null;
  }
  const groups = data.lapGroups ?? [];
  const pick = (type: number) => groups.find((g) => g.type === type && (g.laps?.length ?? 0) > 1);
  const manual = pick(2);
  const group = manual ?? pick(10);
  if (!group?.laps) return null;
  return {
    source: manual ? 'manual' : 'auto',
    laps: group.laps.map((l) => ({
      km: (l.distance ?? 0) / 100000,
      sec: l.time ?? 0,
      watts: l.avgPower || null,
    })),
  };
}
