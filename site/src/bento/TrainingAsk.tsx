'use client';

/**
 * "Do you want to view Randy's training status?" — the plate that opens
 * from the Latest Activity cell. Same glass plate as a project, Puff asks.
 * Fetches three headline numbers while it's open; leaving fades the page
 * out with the same curtain the intro replay uses, then routes.
 */

import { markReturnToHome } from '@/training/returnFlag';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PuffArt } from './PuffEntrance';

type Summary = { status: string | null; recoveryPct: number | null; km7: number };

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
  const [summary, setSummary] = useState<Summary | null | 'error'>(null);
  const plate = useRef<HTMLDialogElement>(null);
  const go = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    router.prefetch('/training');
    let live = true;
    fetch('/api/training/summary')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s: Summary) => live && setSummary(s))
      .catch(() => live && setSummary('error'));
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
    go.current?.focus();
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

  const s = summary && summary !== 'error' ? summary : null;
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
        ref={plate}
      >
        <button className="training-ask-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="training-ask-head">
          <span className="training-ask-puff" aria-hidden="true">
            <PuffArt />
          </span>
          <div>
            <div className="kicker">§ TRAINING STATUS</div>
            <div className="training-ask-bubble">Puff has been keeping the log.</div>
          </div>
        </div>
        <h2 className="training-ask-title" id="training-ask-title">
          Do you want to view Randy’s training status?
        </h2>
        <p className="training-ask-copy">
          How ready the body is today, what the last month of load has built, the latest session rep
          by rep, and how the weeks are stacking up. Live from Coros and Strava, not typed in by
          hand.
        </p>
        {summary !== 'error' && (
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
          <button
            ref={go}
            className="resume-action resume-action-primary"
            type="button"
            onClick={view}
          >
            View training status <span aria-hidden="true">→</span>
          </button>
          <button className="resume-action" type="button" onClick={onClose}>
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
