'use client';

import { markReturnToHome } from '@/training/returnFlag';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './puff-game.css';

export default function PuffGame({
  trigger,
  onClose,
  onEntered,
  direct,
  directPage,
}: {
  trigger: HTMLButtonElement | null;
  onClose: () => void;
  onEntered: () => void;
  direct: boolean;
  directPage: boolean;
}) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    let controller: { dispose: () => void; returnToPortfolio: () => void } | undefined;
    const returnUrl =
      location.pathname === '/game'
        ? (history.state?.puffReturnUrl ?? '/')
        : location.pathname + location.search + location.hash;
    // Push during the trusted Play click so Safari includes it in Back/Forward.
    const entering = () => {
      if (location.pathname !== '/game')
        history.pushState({ puffGame: true, puffReturnUrl: returnUrl }, '', '/game');
    };
    const entered = () => {
      document.title = 'Puff Up · Randy Ren';
      onEntered();
    };
    const returned = () => {
      document.title = 'Randy Ren';
      if (location.pathname === '/game') {
        if (directPage) {
          markReturnToHome();
          router.replace('/');
        } else if (history.state?.puffGame) history.back();
        else history.replaceState(null, '', returnUrl);
      }
      onClose();
    };
    const pop = () => {
      if (location.pathname === '/game') return;
      if (controller) controller.returnToPortfolio();
      else {
        live = false;
        onClose();
      }
    };
    addEventListener('popstate', pop);
    const source = '/puff-up/entry.js';
    import(/* webpackIgnore: true */ source)
      .then(({ mountGame }) => {
        if (!live || !root.current) return;
        controller = mountGame(root.current, {
          portfolio: document.querySelector('.bento-page'),
          trigger,
          onClose,
          direct,
          onEntering: entering,
          onEntered: entered,
          onReturned: returned,
        });
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
      removeEventListener('popstate', pop);
      controller?.dispose();
    };
  }, [trigger, onClose, onEntered, direct, directPage, router]);

  return createPortal(
    <div className="puff-game" ref={root} data-modality="pointer">
      <div id="space-layer" aria-hidden="true" />
      <div id="game-wrap" hidden />
      <button id="back" type="button" hidden>
        ← Back to portfolio
      </button>
      <dialog id="invite" aria-labelledby="invite-title">
        <button id="close" type="button" aria-label="Close invitation">
          ×
        </button>
        <span aria-hidden="true">
          <canvas id="portrait" width="38" height="32" />
        </span>
        <h2 id="invite-title" tabIndex={-1}>
          Want to play?
        </h2>
        <div className="puff-game-actions">
          <button id="decline" type="button">
            Maybe later
          </button>
          <button id="play" type="button">
            Let’s play <span aria-hidden="true">↑</span>
          </button>
        </div>
      </dialog>
      <div id="veil" hidden aria-hidden="true" />
      <div id="hero" hidden aria-hidden="true">
        <canvas id="hero-art" width="104" height="112" />
      </div>
      <output id="loading" hidden>
        Opening the climb…
      </output>
      {error && (
        <dialog open className="puff-game-error" aria-labelledby="game-error-title">
          <h2 id="game-error-title">The climb couldn’t open.</h2>
          <button
            type="button"
            onClick={() => {
              if (location.pathname === '/game') {
                markReturnToHome();
                router.replace(history.state?.puffReturnUrl ?? '/');
              }
              onClose();
            }}
          >
            Back to portfolio
          </button>
        </dialog>
      )}
    </div>,
    document.body,
  );
}
