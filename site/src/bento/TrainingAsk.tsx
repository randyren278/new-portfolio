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
import type { TrainingSummary } from './cells/StravaCell';

function loadPreviewFonts() {
  return Promise.all([
    document.fonts.load('26px "Instrument Serif"'),
    document.fonts.load('italic 30px "Instrument Serif"'),
  ]);
}

// The numbers come from the cell's request, made when the home page mounts,
// not when the plate opens: a cold summary costs a function start and a
// Postgres read, and fetched on click that wait showed as "…" every time.
export function TrainingAsk({
  open,
  onClose,
  numbers,
  stravaUrl,
}: {
  open: boolean;
  onClose: () => void;
  numbers: TrainingSummary | null | 'error';
  stravaUrl: string | null;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [fallbackFonts, setFallbackFonts] = useState(false);
  const plate = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    router.prefetch('/training');
    void loadPreviewFonts().catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!open) {
      setShown(false);
      setFallbackFonts(false);
      return;
    }
    let cancelled = false;
    let revealed = false;
    let raf = 0;
    const reveal = (fallback: boolean) => {
      if (cancelled || revealed) return;
      revealed = true;
      clearTimeout(fontDeadline);
      raf = requestAnimationFrame(() => {
        setFallbackFonts(fallback);
        setShown(true);
      });
    };
    // The heading and numbers must use their final fonts before the plate
    // appears: a fallback-font swap can resize and re-centre it.
    const fontDeadline = window.setTimeout(() => reveal(true), 250);
    loadPreviewFonts().then(
      () => reveal(false),
      () => reveal(true),
    );
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the plate itself, not its primary button: Safari treats a
    // scripted focus on a button as keyboard focus and draws the ring, so the
    // plate opened with "View training log" already highlighted.
    plate.current?.focus({ preventScroll: true });
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
      cancelled = true;
      clearTimeout(fontDeadline);
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
    <div className={`training-ask${shown ? ' open' : ''}${fallbackFonts ? ' font-fallback' : ''}`}>
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
