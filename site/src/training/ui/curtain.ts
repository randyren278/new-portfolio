'use client';

import { useEffect } from 'react';

/**
 * The home plate fades the bento out under a `.bento-departure` curtain
 * before routing to /training. Whatever paints first on arrival — the
 * loading state or the page — lifts it, so the visitor is never left
 * looking at a blank screen while data loads.
 */
export function useLiftCurtain() {
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
}
