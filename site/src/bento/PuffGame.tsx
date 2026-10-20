'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './puff-game.css';

export default function PuffGame({
  trigger,
  onClose,
}: { trigger: HTMLButtonElement; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    let dispose: (() => void) | undefined;
    const source = '/puff-up/entry.js';
    import(/* webpackIgnore: true */ source)
      .then(({ mountGame }) => {
        if (!live || !root.current) return;
        dispose = mountGame(root.current, {
          portfolio: document.querySelector('.bento-page'),
          trigger,
          onClose,
        });
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
      dispose?.();
    };
  }, [trigger, onClose]);

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
          <button type="button" onClick={onClose}>
            Back to portfolio
          </button>
        </dialog>
      )}
    </div>,
    document.body,
  );
}
