'use client';

/**
 * /training — Randy's training status, in the bento's language: the same
 * palette, hairline cells, § kickers and Plex Mono / Newsreader /
 * Instrument Serif. Every cell is optional; a source that didn't answer
 * removes its cells rather than leaving a broken one.
 */

import '@/bento/bento.css';
import '@/bento/puff.css';
import '../training.css';
import Link from 'next/link';
import { type CSSProperties, useEffect } from 'react';
import { type TrainingView, clock, fmtDay, fmtDow, hm, km1, pace, runTitle } from '../derive';
import { markReturnToHome } from '../returnFlag';
import {
  LoadChart,
  RecoveryChart,
  Ring,
  SessionChart,
  Sparkline,
  VolumeChart,
  WeekBars,
} from './charts';
import { TipLayer } from './tip';

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
  const t = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(view.asOf));
  return `Synced from ${view.source === 'coros' ? 'Coros' : 'Strava'} · ${fmtDow(view.today)} · ${t} PT`;
}

export function TrainingPage({ view }: { view: TrainingView | null }) {
  // The home plate fades the bento out under a curtain before routing here;
  // lift it once this page has painted.
  useEffect(() => {
    for (const el of document.querySelectorAll<HTMLElement>('.bento-departure')) {
      el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 260,
        easing: 'ease-in-out',
        fill: 'forwards',
      })
        .finished.catch(() => {})
        .then(() => el.remove());
    }
  }, []);
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
          <h2 className="kicker" id="k-ready">
            § READINESS · TODAY
          </h2>
          <div className="tr-ready-top">
            <Ring pct={r.pct} />
            <div className="tr-ready-state">
              <span className="tr-chip">
                <i />
                {r.level ?? (r.pct >= 80 ? 'Ready for quality' : 'Take it easy')}
              </span>
              {r.fullRecoveryHours != null && (
                <p className="tr-essay">
                  {r.fullRecoveryHours > 0
                    ? `Fully recovered in about ${r.fullRecoveryHours} hours.`
                    : 'Fully recovered.'}
                </p>
              )}
            </div>
          </div>
          <div className="tr-vitals">
            {r.hrv && (
              <Vital
                label="HRV"
                value={r.hrv.value}
                unit="ms"
                note={r.hrv.baseline ? `baseline ${r.hrv.baseline}` : ''}
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
        </section>
      )}

      {view.load && (
        <section className="cell span-2" aria-labelledby="k-load">
          <h2 className="kicker" id="k-load">
            § TRAINING LOAD · 30 DAYS
          </h2>
          <div className="tr-legend">
            <span>
              <i className="tr-key-line" style={{ background: 'var(--ink)' }} />
              Long-term load
            </span>
            <span>
              <i className="tr-key-line" style={{ background: 'var(--accent)' }} />
              Short-term load
            </span>
            <span>
              <i className="tr-key-sq" style={{ background: 'var(--data-dim)' }} />
              Ratio, Coros: optimized
            </span>
            {view.load.some((d) => /excessive|over/i.test(d.comment ?? '')) && (
              <span>
                <i className="tr-key-sq" style={{ background: 'var(--accent)' }} />
                Ratio, Coros: excessive
              </span>
            )}
          </div>
          <LoadChart days={view.load} dayTips={dayTips} />
          <p className="tr-explain">
            Coros scores every session for load. Long-term load is the slow average — fitness being
            built; short-term is the last week or so. The ratio between them is what Coros grades: a
            little above 1 is the body being asked to adapt, too far above for too long is how
            injuries start.
          </p>
        </section>
      )}

      <WeekCell view={view} />

      {view.session && (
        <section className="cell span-2" aria-labelledby="k-session">
          <h2 className="kicker" id="k-session">
            § LATEST SESSION · {fmtDow(view.session.date)}
          </h2>
          <h3 className="tr-session-title">{view.session.title}</h3>
          <div className="tr-session-meta">
            {km1(view.session.km)} km · {clock(view.session.sec)} · {km1(view.session.repKm)} km of
            reps at {pace(view.session.repPace)} /km
            {view.session.focus ? ` · ${focusName(view.session.focus).toLowerCase()}` : ''}
            {view.session.trainingLoad ? ` · load ${view.session.trainingLoad}` : ''}
          </div>
          <div className="tr-session-cols">
            <div>
              <div className="tr-legend">
                <span>
                  <i className="tr-key-sq" style={{ background: 'var(--accent)' }} />
                  Rep
                </span>
                <span>
                  <i className="tr-key-sq" style={{ background: 'var(--data-dim)' }} />
                  Warm-up / cool-down
                </span>
                <span>Gaps are recoveries</span>
              </div>
              <SessionChart
                session={view.session}
                threshold={view.predictor?.thresholdPace ?? null}
              />
            </div>
            <div>
              <table className="tr-reps">
                <thead>
                  <tr>
                    <th scope="col">Rep</th>
                    <th scope="col">Dist</th>
                    <th scope="col">Time</th>
                    <th scope="col">Pace</th>
                    <th scope="col">Watts</th>
                  </tr>
                </thead>
                <tbody>
                  {view.session.reps.map((rep, i) => (
                    <tr key={rep.n} className={i === view.session?.fastest ? 'best' : undefined}>
                      <td>{rep.n}</td>
                      <td>{rep.km.toFixed(2)}</td>
                      <td>{clock(rep.sec)}</td>
                      <td className="pace">
                        {i === view.session?.fastest && (
                          <span className="tr-sr-only">fastest </span>
                        )}
                        {pace(rep.pace)}
                      </td>
                      <td>{rep.watts ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view.notes.length > 0 && (
        <section className="cell" aria-labelledby="k-notes">
          <h2 className="kicker" id="k-notes">
            § NOTES FROM THE LOG
          </h2>
          <ul className="tr-notes">
            {view.notes.map((n) => (
              <li key={n.text}>
                <span className="tr-when">{n.when}</span>
                <p className="tr-essay">{n.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cell" aria-labelledby="k-volume">
        <h2 className="kicker" id="k-volume">
          § WEEKLY VOLUME · 12 WK
        </h2>
        <VolumeChart weeks={view.volume} />
        <div className="tr-legend tr-legend-below">
          <span>
            <i className="tr-key-sq" style={{ background: 'var(--accent)' }} />
            Last full week
          </span>
          <span>
            <i className="tr-key-sq" style={{ background: 'rgba(var(--ink-rgb) / 0.32)' }} />
            Earlier
          </span>
        </div>
      </section>

      {view.nights && (
        <section className="cell" aria-labelledby="k-recovery">
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

      <section className="cell span-3" aria-labelledby="k-lines">
        <div className="tr-cell-head">
          <h2 className="kicker" id="k-lines">
            § LINE STUDIES · LAST EIGHT
          </h2>
          <span className="tr-lab">Each route drawn to its own scale</span>
        </div>
        <div className="tr-lines">
          {view.lines.map((a, i) => {
            const title = a.sport === 'ride' ? 'Ride' : runTitle(a);
            const sub =
              a.sport === 'ride'
                ? `${(a.km / (a.sec / 3600)).toFixed(1)} km/h`
                : `${pace(a.sec / a.km)} /km`;
            return (
              <div
                key={a.id}
                className={`tr-study${i === 0 ? ' is-latest' : ''}`}
                data-tip={`${fmtDow(a.date)}|${title} · ${km1(a.km)} km|${clock(a.sec)} · ${sub}`}
              >
                <RouteArt route={a.route} indoor={a.indoor} ride={a.sport === 'ride'} />
                <div className="tr-study-cap">
                  {fmtDay(a.date)} · {km1(a.km)} km
                </div>
                <div className="tr-study-sub">
                  {title} · {sub}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cell" aria-labelledby="k-odo">
        <h2 className="kicker" id="k-odo">
          § ODOMETER · SINCE {fmtDay(view.odometer.since)}
        </h2>
        <div className="tr-odo-big">
          <span className="tr-serif">{Math.round(view.odometer.km).toLocaleString('en-CA')}</span>
          <span className="tr-unit">km run</span>
        </div>
        <p className="tr-essay tr-odo-line">
          About {Math.round(view.odometer.km / 10)} laps of Stanley Park, or Vancouver to Calgary{' '}
          {(view.odometer.km / 970).toFixed(1)} times.
        </p>
        <div className="tr-odo-grid">
          <div>
            <div className="tr-lab">Time on feet</div>
            <span>{hm(view.odometer.sec)}</span>
          </div>
          <div>
            <div className="tr-lab">Runs</div>
            <span>{view.odometer.runs}</span>
          </div>
          <div>
            <div className="tr-lab">Longest</div>
            <span>{km1(view.odometer.longestKm)} km</span>
          </div>
          <div>
            <div className="tr-lab">On the bike</div>
            <span>{Math.round(view.odometer.rideKm)} km</span>
          </div>
        </div>
      </section>

      <section className="cell span-2" aria-labelledby="k-about">
        <h2 className="kicker" id="k-about">
          § HOW THIS WORKS
        </h2>
        <p className="tr-essay tr-about">
          Coros supplies the body; Strava supplies the map. The server asks both every fifteen
          minutes and this page redraws itself. Nothing here is typed by hand.
        </p>
        <div className="tr-src">
          <span className="tr-lab">Coros</span>
          <span>
            Activities, training load and its grade, recovery, HRV, sleep, laps, fitness assessment
          </span>
        </div>
        <div className="tr-src">
          <span className="tr-lab">Strava</span>
          <span>Route shapes, for activities that are public there</span>
        </div>
        <div className="tr-src">
          <span className="tr-lab">Derived</span>
          <span>Weeks, streaks, rep detection, the notes, and everything worded on this page</span>
        </div>
      </section>
    </main>
  );
}

function StatusCell({ view }: { view: TrainingView }) {
  const s = view.status;
  const m = view.metrics;
  return (
    <section className="cell span-2" aria-labelledby="k-status">
      <h2 className="kicker" id="k-status">
        § STATUS · {fmtDow(view.today)}
      </h2>
      <div className="tr-status-row">
        <p className="tr-status-word">
          {s ? s.word : 'Logging'}
          <span className="dot">.</span>
        </p>
        {s && (
          <div className="tr-status-why">
            Coros’ verdict on load ratio {s.ratio.toFixed(2)} — short-term {s.shortTerm} against
            long-term {s.longTerm}
            {s.longTermChange != null
              ? `, long-term ${signed(s.longTermChange * 100, 0)}% in two weeks`
              : ''}
            .
          </div>
        )}
      </div>
      <p className="tr-essay tr-status-essay">
        {s?.essay ||
          'Coros isn’t answering right now, so this is the activity log alone, from Strava.'}
      </p>
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
    </section>
  );
}

function WeekCell({ view }: { view: TrainingView }) {
  const w = view.week;
  return (
    <section className="cell" aria-labelledby="k-week">
      <h2 className="kicker" id="k-week">
        § THIS WEEK · {fmtDay(w.start)} – {fmtDay(w.days[6].date).replace(/^[A-Z]+ /, '')}
      </h2>
      <div className="tr-week-total">
        <span className="tr-serif">{km1(w.km)}</span>
        <span className="tr-unit">km so far</span>
        <span className="tr-cmp">{signed(w.vsLastWeek)} vs this point last week</span>
      </div>
      <WeekBars days={w.days} today={view.today} />
      <ul className="tr-week-list">
        {w.days.map((d) => (
          <li key={d.date}>
            <span className="tr-d">{fmtDow(d.date).slice(0, 3)}</span>
            {d.state === 'run' || d.state === 'ride' ? (
              <>
                <span className="tr-what">
                  {d.title}
                  <small>
                    {d.state === 'run' ? `${pace(d.sec / d.km)} /km · ` : ''}
                    {hm(d.sec)}
                  </small>
                </span>
                <span className="tr-num">{km1(d.km)} km</span>
              </>
            ) : (
              <>
                <span className="tr-what tr-rest">{d.state === 'rest' ? 'Rest' : '—'}</span>
                <span />
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FocusCell({ focus }: { focus: NonNullable<TrainingView['focus']> }) {
  const total = focus.reduce((s, f) => s + f.sec, 0);
  const pct = (sec: number) => Math.round((sec / total) * 100);
  const easy = focus
    .filter((f) => f.label === 'Recovery' || f.label === 'Base')
    .reduce((s, f) => s + f.sec, 0);
  return (
    <section className="cell" aria-labelledby="k-focus">
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
            <span className="tr-t">{hm(f.sec)}</span>
          </div>
        ))}
      </div>
      <p className="tr-essay tr-focus-note">
        {pct(easy)}% of the running time was recovery or aerobic base, as Coros classifies each run.
      </p>
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

function RouteArt({
  route,
  indoor,
  ride,
}: { route: string | null; indoor: boolean; ride: boolean }) {
  if (route) {
    return (
      <svg viewBox="0 0 160 110" aria-hidden="true">
        <path
          d={route}
          fill="none"
          stroke={ride ? 'var(--ink)' : 'var(--accent)'}
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 110" aria-hidden="true">
      {indoor ? (
        <>
          <rect
            x={22}
            y={44}
            width={116}
            height={22}
            rx={11}
            fill="none"
            stroke="var(--data-dim)"
            strokeWidth={1.5}
          />
          <line
            x1={34}
            x2={126}
            y1={55}
            y2={55}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      ) : (
        <circle
          cx={80}
          cy={52}
          r={22}
          fill="none"
          stroke="var(--data-dim)"
          strokeWidth={1.5}
          strokeDasharray="3 4"
        />
      )}
      <text x={80} y={92} textAnchor="middle" fontSize={9} letterSpacing={1} fill="var(--muted)">
        {indoor ? 'NO GPS · INDOOR' : 'ROUTE NOT PUBLIC'}
      </text>
    </svg>
  );
}
