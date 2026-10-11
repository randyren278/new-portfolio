'use client';

import '@/bento/bento.css';
import '@/bento/puff.css';
import '../training.css';
import Link from 'next/link';
import { markReturnToHome } from '../returnFlag';
import { useLiftCurtain } from './curtain';

/** Shown the instant /training is requested, while Coros and Strava answer. */
export function TrainingLoading() {
  useLiftCurtain();
  return (
    <div className="bento-page training-page" aria-busy="true">
      <header className="bento-topbar">
        <Link className="brand" href="/" onClick={markReturnToHome}>
          RANDY REN · TRAINING STATUS
        </Link>
        <Link className="bento-text-button" href="/" onClick={markReturnToHome}>
          <span aria-hidden="true">←</span>&nbsp;Back to portfolio
        </Link>
      </header>
      <main className="tr-grid">
        <section className="cell span-2 tr-loading" aria-labelledby="k-loading">
          <h2 className="kicker" id="k-loading">
            § STATUS
          </h2>
          <p className="tr-status-word tr-loading-word">
            Loading<span className="dot">.</span>
          </p>
          <p className="tr-essay tr-status-essay">Asking the watch how training is going…</p>
        </section>
      </main>
      <footer className="bento-topbar">
        <span>randyren.org / training</span>
      </footer>
    </div>
  );
}
