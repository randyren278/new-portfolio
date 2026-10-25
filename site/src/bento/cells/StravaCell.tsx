'use client';

/**
 * Strava cell — middle-right of the bento.
 *
 * Optional live data loads independently of the entrance and portfolio.
 * The run is /training's run cell (the latest outdoor run over 6 km with a
 * public route), read through /api/training/summary from the same view the
 * training page renders. Until it loads, or if it can't, we render a
 * hand-drawn fallback polyline in the same visual language as the mockup,
 * plus a muted caption.
 */

import { clock, km1, pace } from '@/training/derive';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TrainingAsk } from '../TrainingAsk';

export type TrainingSummary = {
  status: string | null;
  recoveryPct: number | null;
  km7: number;
  // route: SVG path in a 160×110 box, as /training draws it
  run: { km: number; sec: number; route: string; stravaId: number | null } | null;
};

// Hand-authored fallback polyline. Same one used in the mockup — starts
// upper-left, meanders down, loops, returns. Not random — needs to look
// like a plausible route, not a scribble.
const FALLBACK_PATH = `M 34 46
  C 52 40, 74 44, 90 58
  S 118 92, 138 96
  C 158 100, 176 84, 196 82
  C 218 80, 236 96, 252 108
  C 268 120, 282 128, 300 124
  C 316 120, 326 106, 322 92
  C 318 78, 300 72, 286 82
  C 272 92, 268 112, 276 128
  C 284 144, 302 156, 296 168
  C 290 178, 268 178, 250 168
  C 232 158, 212 148, 190 152
  C 168 156, 148 168, 128 164
  C 108 160, 92 146, 78 130
  C 62 112, 54 92, 44 74
  C 38 64, 34 54, 34 46 Z`;

export function StravaCell() {
  // One request feeds the card and the plate; null while it loads.
  const [summary, setSummary] = useState<TrainingSummary | null | 'error'>(null);
  const request = useRef<AbortController | null>(null);
  const load = useCallback(() => {
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch('/api/training/summary', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((s: TrainingSummary) => {
        if (request.current === controller) setSummary(s);
      })
      .catch(() => {
        // A failed re-read keeps what the card already shows.
        if (request.current === controller) setSummary((s) => s ?? 'error');
      })
      .finally(() => {
        clearTimeout(timer);
        if (request.current === controller) request.current = null;
      });
  }, []);
  useEffect(() => {
    load();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [load]);
  const run = summary && summary !== 'error' ? summary.run : null;
  const loading = summary === null;
  // The whole cell is the doorway to /training: one real button laid over
  // it, asking first (TrainingAsk) rather than navigating on a stray tap.
  const [asking, setAsking] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setAsking(false);
    opener.current?.focus();
  }, []);

  return (
    <section className="cell cell-strava" aria-label="Latest activity">
      <h2 className="kicker">§ LATEST ACTIVITY</h2>
      <div className="strava-body">
        <svg
          viewBox={run ? '0 0 160 110' : '0 0 360 200'}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="strava-svg-title"
        >
          <title id="strava-svg-title">
            {run ? 'Latest activity trace' : 'Fallback activity trace'}
          </title>
          <path
            d={run ? run.route : FALLBACK_PATH}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="strava-foot">
        {run ? (
          <div>
            <div className="strava-cap">
              {km1(run.km)} KM · {clock(run.sec)} · RUN
            </div>
            <div className="strava-sub">{pace(run.sec / run.km)} /KM</div>
          </div>
        ) : (
          <div>
            <div className="strava-cap">
              {loading ? '— LATEST ACTIVITY —' : '— NO RECENT ACTIVITY —'}
            </div>
            <div className="strava-sub">
              {loading ? 'loading activity' : 'strava not connected'}
            </div>
          </div>
        )}
        {/* Holds the pill's place on the rail: where the caption and the pill
            don't fit side by side, this wraps below and the caption stands
            clear above the real pill (laid over the cell, below). */}
        <span className="glass-pill strava-pill-ghost" aria-hidden="true">
          Training status <span>→</span>
        </span>
      </div>
      <button
        ref={opener}
        className="strava-open"
        type="button"
        aria-haspopup="dialog"
        aria-label="Training status — see how Randy’s training is going"
        onClick={() => {
          setAsking(true);
          // Read again unless a read is under way: this visit may have set
          // off the refresh that brings in a new run, and the plate leads
          // straight to /training.
          if (!request.current) load();
        }}
      >
        <span className="glass-pill strava-pill" aria-hidden="true">
          Training status <span>→</span>
        </span>
      </button>
      <TrainingAsk
        open={asking}
        onClose={close}
        numbers={summary}
        stravaUrl={run?.stravaId ? `https://www.strava.com/activities/${run.stravaId}` : null}
      />
    </section>
  );
}
