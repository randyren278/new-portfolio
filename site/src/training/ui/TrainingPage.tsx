'use client';

/**
 * /training — Randy's training status, in the bento's language: the same
 * palette, hairline cells, § kickers and Plex Mono / Newsreader /
 * Instrument Serif, and the home page's 3×3 of slots fitted to one screen
 * on desktop. Numbers and charts only; no prose. Every cell is optional; a
 * source that didn't answer removes its cells rather than leaving a broken one.
 */

import '@/bento/bento.css';
import '@/bento/puff.css';
import '../training.css';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { type TrainingView, fmtDay, fmtDow, hm, km1, pace } from '../derive';
import { markReturnToHome } from '../returnFlag';
import { LoadChart, RecoveryChart, Ring, Sparkline, VolumeChart, WeekBars } from './charts';
import { useLiftCurtain } from './curtain';
import { TipLayer } from './tip';
import { useTrainingRefresh } from './useTrainingRefresh';

const markReturn = markReturnToHome;

const FOCUS_COLOR: Record<string, string> = {
  Recovery: 'var(--ramp-1)',
  Base: 'var(--ramp-2)',
  'Aerobic Endurance': 'var(--ramp-2)',
  Endurance: 'var(--ramp-2)',
  Threshold: 'var(--ramp-3)',
  'VO2 Max': 'var(--ramp-4)',
  Anaerobic: 'var(--ramp-5)',
  Sprint: 'var(--ramp-5)',
};
const focusColor = (label: string) => FOCUS_COLOR[label] ?? 'rgba(var(--ink-rgb) / 0.14)';
const focusName = (label: string) =>
  label === 'VO2 Max' ? 'VO2 max' : label === 'Base' ? 'Aerobic base' : label;

const signed = (v: number, digits = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}`;

function syncedLabel(view: TrainingView) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(view.asOf));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  return `Synced from ${view.source === 'coros' ? 'Coros' : 'Strava'} · ${fmtDow(date)} · ${part('hour')}:${part('minute')} PT`;
}

export function TrainingPage({ view }: { view: TrainingView | null }) {
  useLiftCurtain();
  useTrainingRefresh();
  return (
    <TipLayer>
      <div className="bento-page training-page">
        <header className="bento-topbar">
          <Link className="brand" href="/" onClick={markReturn}>
            RANDY REN · TRAINING STATUS
          </Link>
          <Link className="bento-text-button" href="/" onClick={markReturn}>
            <span aria-hidden="true">←</span>&nbsp;Back to portfolio
          </Link>
        </header>
        <h1 className="tr-sr-only">Randy Ren — training status</h1>
        {view ? <Cells view={view} /> : <Unavailable />}
        <footer className="bento-topbar">
          <span>randyren.org / training</span>
          <span>{view ? syncedLabel(view) : 'Not synced'}</span>
        </footer>
      </div>
    </TipLayer>
  );
}

function Unavailable() {
  return (
    <main className="tr-grid">
      <section className="cell span-3" aria-labelledby="k-off">
        <h2 className="kicker" id="k-off">
          § TRAINING STATUS
        </h2>
        <p className="tr-essay tr-status-essay">
          The watch data isn’t coming through right now. Check back in a few minutes.
        </p>
      </section>
    </main>
  );
}

function Cells({ view }: { view: TrainingView }) {
  const dayTips = new Map(view.heat.days.map((d) => [d.date, d.tip]));
  const r = view.readiness;
  return (
    <main className="tr-grid">
      <StatusCell view={view} />

      {r && (
        <section className="cell tr-ready" aria-labelledby="k-ready">
          <div className="tr-cell-head">
            <h2 className="kicker" id="k-ready">
              § READINESS
            </h2>
            <span className="tr-chip">
              <i />
              {r.level ?? (r.pct >= 80 ? 'Ready for quality' : 'Take it easy')}
            </span>
          </div>
          <div className="tr-ready-body">
            <div className="tr-ready-ring">
              <Ring pct={r.pct} />
              {r.fullRecoveryHours != null && (
                <span className="tr-sub">
                  {r.fullRecoveryHours > 0 ? `100% in ${r.fullRecoveryHours} h` : 'fully recovered'}
                </span>
              )}
            </div>
            <div className="tr-vitals">
              {r.hrv && (
                <Vital
                  label="HRV"
                  value={r.hrv.value}
                  unit="ms"
                  note={r.hrv.baseline ? `base ${r.hrv.baseline}` : ''}
                  series={r.hrv.series}
                  base={r.hrv.baseline}
                />
              )}
              {r.rhr && (
                <Vital
                  label="Resting HR"
                  value={r.rhr.value}
                  unit="bpm"
                  note={
                    r.rhr.baseline != null
                      ? `${signed(r.rhr.value - r.rhr.baseline, 0)} vs ${Math.round(r.rhr.baseline)}`
                      : ''
                  }
                  series={r.rhr.series}
                  base={r.rhr.baseline}
                />
              )}
              {r.sleep && (
                <Vital
                  label="Sleep"
                  value={r.sleep.value}
                  unit="/100"
                  note={r.sleep.baseline != null ? `typical ${Math.round(r.sleep.baseline)}` : ''}
                  series={r.sleep.series}
                  base={r.sleep.baseline}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {view.load && (
        <section className="cell span-2 tr-load" aria-labelledby="k-load">
          <div className="tr-cell-head">
            <h2 className="kicker" id="k-load">
              § TRAINING LOAD · 30 DAYS
            </h2>
            <div className="tr-legend">
              <span>
                <i className="tr-key-line" style={{ background: 'var(--ink)' }} />
                Long-term
              </span>
              <span>
                <i className="tr-key-line" style={{ background: 'var(--accent)' }} />
                Short-term
              </span>
              <span>
                <i className="tr-key-sq" style={{ background: 'var(--data-dim)' }} />
                Ratio, optimized
              </span>
              {view.load.some((d) => /excessive|over/i.test(d.comment ?? '')) && (
                <span>
                  <i className="tr-key-sq" style={{ background: 'var(--accent)' }} />
                  Ratio, excessive
                </span>
              )}
            </div>
          </div>
          <LoadChart days={view.load} dayTips={dayTips} />
        </section>
      )}

      <WeekCell view={view} />

      <section className="cell tr-volume" aria-labelledby="k-volume">
        <h2 className="kicker" id="k-volume">
          § WEEKLY VOLUME · 12 WK
        </h2>
        <VolumeChart weeks={view.volume} />
      </section>

      {view.nights && (
        <section className="cell tr-recovery" aria-labelledby="k-recovery">
          <h2 className="kicker" id="k-recovery">
            § RECOVERY · 3 WK
          </h2>
          <RecoveryChart
            nights={view.nights}
            sleepBase={view.readiness?.sleep?.baseline ?? null}
            dayTips={dayTips}
          />
        </section>
      )}

      {view.focus && <FocusCell focus={view.focus} />}
    </main>
  );
}

function StatusCell({ view }: { view: TrainingView }) {
  const m = view.metrics;
  const run = view.outdoor;
  return (
    <section className="cell span-2 tr-status" aria-labelledby="k-status">
      <h2 className="kicker" id="k-status">
        § STATUS · {fmtDow(view.today)}
      </h2>
      <div className={`tr-status-body${run?.route ? '' : ' no-map'}`}>
        {run?.route && (
          <figure className="tr-route">
            <svg
              viewBox="0 0 160 110"
              preserveAspectRatio="xMinYMid meet"
              role="img"
              aria-label={`Route of the ${km1(run.km)} km run on ${fmtDow(run.date)}`}
            >
              <path
                d={run.route}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <figcaption className="tr-lab">
              Last outdoor run · {fmtDow(run.date)} · {km1(run.km)} km · {pace(run.sec / run.km)}{' '}
              /km
            </figcaption>
          </figure>
        )}
        <div className="tr-metrics">
          <Metric
            label="Last 7 days"
            value={km1(m.km7)}
            unit="km"
            sub={`${signed(m.km7 - m.km7prev)} vs prior 7`}
          />
          <Metric
            label="Last 28 days"
            value={String(Math.round(m.km28))}
            unit="km"
            sub={`${Math.round(m.km28 / 4)} km / wk avg`}
          />
          <Metric
            label="Run streak"
            value={String(m.streak)}
            unit={m.streak === 1 ? 'day' : 'days'}
            sub={m.streak >= m.longest ? 'longest in six months' : `longest ${m.longest}`}
          />
          {view.predictor?.vo2max ? (
            <Metric
              label="VO2max"
              value={String(view.predictor.vo2max)}
              unit=""
              sub={
                view.predictor.thresholdPace
                  ? `threshold ${pace(view.predictor.thresholdPace)} /km`
                  : ''
              }
            />
          ) : (
            <Metric label="This week" value={km1(view.week.km)} unit="km" sub="so far" />
          )}
        </div>
      </div>
    </section>
  );
}

function WeekCell({ view }: { view: TrainingView }) {
  const w = view.week;
  return (
    <section className="cell tr-week" aria-labelledby="k-week">
      <h2 className="kicker" id="k-week">
        § THIS WEEK · {fmtDay(w.start)} – {fmtDay(w.days[6].date).replace(/^[A-Z]+ /, '')}
      </h2>
      <div className="tr-week-total">
        <span className="tr-serif">{km1(w.km)}</span>
        <span className="tr-unit">km</span>
        <span className="tr-cmp">{signed(w.vsLastWeek)} vs last week</span>
      </div>
      <WeekBars days={w.days} today={view.today} />
    </section>
  );
}

function FocusCell({ focus }: { focus: NonNullable<TrainingView['focus']> }) {
  const total = focus.reduce((s, f) => s + f.sec, 0);
  const pct = (sec: number) => Math.round((sec / total) * 100);
  return (
    <section className="cell tr-focus" aria-labelledby="k-focus">
      <h2 className="kicker" id="k-focus">
        § TRAINING FOCUS · 28 DAYS
      </h2>
      <div className="tr-focus-bar">
        {focus.map((f) => (
          <span
            key={f.label}
            style={{ flexGrow: f.sec, background: focusColor(f.label) } as CSSProperties}
            data-tip={`${focusName(f.label)}|${pct(f.sec)}% · ${hm(f.sec)}`}
          />
        ))}
      </div>
      <div className="tr-focus-rows">
        {focus.map((f) => (
          <div className="tr-focus-row" key={f.label}>
            <i className="tr-key-sq" style={{ background: focusColor(f.label) }} />
            <span>{focusName(f.label)}</span>
            <span className="tr-num">{pct(f.sec)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Vital(p: {
  label: string;
  value: number;
  unit: string;
  note: string;
  series: number[];
  base: number | null;
}) {
  return (
    <div className="tr-vital">
      <div>
        <div className="tr-lab">{p.label}</div>
        <span className="tr-base">{p.note}</span>
      </div>
      <div className="tr-v">
        {p.value}
        <small>{p.unit}</small>
      </div>
      <Sparkline values={p.series} base={p.base} />
    </div>
  );
}

function Metric(p: { label: string; value: string; unit: string; sub: string }) {
  return (
    <div>
      <div className="tr-lab">{p.label}</div>
      <span className="tr-serif">
        {p.value}
        {p.unit && <span className="tr-unit">{p.unit}</span>}
      </span>
      <div className="tr-sub">{p.sub}</div>
    </div>
  );
}
