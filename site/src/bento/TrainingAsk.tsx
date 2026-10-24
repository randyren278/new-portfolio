'use client';

/**
 * "Want to see Randy's training log?" — the plate that opens from the
 * Latest Activity cell. Same glass plate as a project, Puff asks. Shows
 * three headline numbers; leaving fades the page out with the same curtain
 * the intro replay uses, then routes.
 */

import { markReturnToHome } from '@/training/returnFlag';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PuffArt } from './PuffEntrance';

type Summary = { status: string | null; recoveryPct: number | null; km7: number };

// The numbers are requested when the home page mounts, not when the plate
// opens: a cold summary costs a function start and a Postgres read, and
// fetched on click that wait showed as "…" in the plate every time.
// Reused for five minutes, the CDN's own freshness for the route.
let summary: { at: number; request: Promise<Summary> } | null = null;

export function prefetchTrainingSummary(): Promise<Summary> {
  if (summary && Date.now() - summary.at < 300_000) return summary.request;
  const entry: NonNullable<typeof summary> = {
    at: Date.now(),
    request: fetch('/api/training/summary')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch((err) => {
        if (summary === entry) summary = null;
        throw err;
      }),
  };
  summary = entry;
  return entry.request;
}

export function TrainingAsk({
  open,
  onClose,
  stravaUrl,
}: {
  open: boolean;
  onClose: () => void;
  stravaUrl: string | null;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [numbers, setNumbers] = useState<Summary | null | 'error'>(null);
  const plate = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    router.prefetch('/training');
    let live = true;
    prefetchTrainingSummary()
      .then((s) => live && setNumbers(s))
      .catch(() => live && setNumbers('error'));
    return () => {
      live = false;
    };
  }, [open, router]);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the plate itself, not its primary button: Safari treats a
    // scripted focus on a button as keyboard focus and draws the ring, so the
    // plate opened with "View training log" already highlighted.
    plate.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !plate.current) return;
      const f = [...plate.current.querySelectorAll<HTMLElement>('button, a[href]')];
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function view() {
    markReturnToHome();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      const curtain = document.createElement('div');
      curtain.className = 'bento-departure';
      curtain.setAttribute('aria-hidden', 'true');
      document.body.append(curtain);
      await curtain
        .animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 260,
          easing: 'ease-in-out',
          fill: 'forwards',
        })
        .finished.catch(() => {});
    }
    router.push('/training');
  }

  const s = numbers && numbers !== 'error' ? numbers : null;
  return createPortal(
    <div className={`training-ask${shown ? ' open' : ''}`}>
      <div
        className="training-ask-overlay"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-hidden="true"
      />
      <dialog
        open
        className="training-ask-plate"
        aria-modal="true"
        aria-labelledby="training-ask-title"
        tabIndex={-1}
        ref={plate}
      >
        <button className="training-ask-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="training-ask-head">
          <span className="training-ask-puff" aria-hidden="true">
            <PuffArt />
          </span>
          <div className="kicker">§ TRAINING STATUS</div>
        </div>
        <h2 className="training-ask-title" id="training-ask-title">
          Want to see Randy’s training log?
        </h2>
        {numbers !== 'error' && (
          <dl className="training-ask-preview" aria-busy={!s}>
            <div>
              <dt>Status</dt>
              <dd>{s ? (s.status ?? '—') : '…'}</dd>
            </div>
            <div>
              <dt>Recovery</dt>
              <dd>{s ? (s.recoveryPct != null ? `${s.recoveryPct}%` : '—') : '…'}</dd>
            </div>
            <div>
              <dt>Last 7 days</dt>
              <dd>{s ? `${s.km7.toFixed(1)} km` : '…'}</dd>
            </div>
          </dl>
        )}
        <div className="training-ask-actions">
          <button className="glass-pill training-ask-go" type="button" onClick={view}>
            View training log <span aria-hidden="true">→</span>
          </button>
          <button className="glass-pill" type="button" onClick={onClose}>
            Not now
          </button>
          {stravaUrl && (
            <a
              className="bento-text-button training-ask-strava"
              href={stravaUrl}
              target="_blank"
              rel="noreferrer"
            >
              This run on Strava <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </dialog>
    </div>,
    document.body,
  );
}
