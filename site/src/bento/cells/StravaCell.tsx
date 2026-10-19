'use client';

/**
 * Strava cell — middle-right of the bento.
 *
 * Optional live data loads independently of the entrance and portfolio.
 * The API projects the activity; null means no tokens / fetch error. When strava
 * is null we render a hand-drawn fallback polyline in the same visual
 * language as the mockup, plus a muted "not connected" caption.
 *
 * The real path is already projected to a 360×200 SVG viewBox by the
 * route handler; this cell just drops it into <path d={...}>.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TrainingAsk } from '../TrainingAsk';

export type StravaData = {
  id: number;
  name: string;
  distanceM: number;
  movingTimeS: number;
  activityType: string;
  polylinePath: string;
};

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(1)} KM`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Run-family activities (Run, TrailRun, VirtualRun) are reported as pace
// (min/km) — the convention runners actually read. Everything else
// (Ride, Hike, Swim, EBikeRide, etc.) gets speed in km/h.
function formatSpeed(meters: number, seconds: number, activityType: string): string {
  if (meters <= 0 || seconds <= 0) return '';
  if (/run/i.test(activityType)) {
    const secPerKm = seconds / (meters / 1000);
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60);
    return `${m}:${s.toString().padStart(2, '0')} /KM`;
  }
  const kmh = meters / 1000 / (seconds / 3600);
  return `${kmh.toFixed(1)} KM/H`;
}

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

export function StravaCell({
  strava: initial,
  live = false,
}: { strava: StravaData | null; live?: boolean }) {
  const [strava, setStrava] = useState(initial);
  const [loading, setLoading] = useState(live);
  useEffect(() => {
    if (!live) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch('/api/strava/latest', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((activity: StravaData | null) => {
        if (!controller.signal.aborted) setStrava(activity);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [live]);
  const usingFallback = strava === null;
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
          viewBox="0 0 360 200"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="strava-svg-title"
        >
          <title id="strava-svg-title">
            {usingFallback ? 'Fallback activity trace' : 'Latest activity trace'}
          </title>
          <path
            d={usingFallback ? FALLBACK_PATH : strava.polylinePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="strava-foot">
        {usingFallback ? (
          <div>
            <div className="strava-cap">
              {loading ? '— LATEST ACTIVITY —' : '— NO RECENT ACTIVITY —'}
            </div>
            <div className="strava-sub">
              {loading ? 'loading activity' : 'strava not connected'}
            </div>
          </div>
        ) : (
          <div>
            <div className="strava-cap">
              {formatDistance(strava.distanceM)} · {formatDuration(strava.movingTimeS)} ·{' '}
              {strava.activityType.toUpperCase()}
            </div>
            <div className="strava-sub">
              {formatSpeed(strava.distanceM, strava.movingTimeS, strava.activityType)}
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
        onClick={() => setAsking(true)}
      >
        <span className="glass-pill strava-pill" aria-hidden="true">
          Training status <span>→</span>
        </span>
      </button>
      <TrainingAsk
        open={asking}
        onClose={close}
        stravaUrl={strava ? `https://www.strava.com/activities/${strava.id}` : null}
      />
    </section>
  );
}
