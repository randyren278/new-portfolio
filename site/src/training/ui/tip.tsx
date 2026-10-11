'use client';

/**
 * One tooltip for the whole page — the site's glass label, small.
 * Any element with `data-tip="Header|line|line"` gets it on hover/tap;
 * crosshair charts drive it directly through `useTip()`.
 */

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

type Tip = { lines: string[]; x: number; y: number } | null;
type Api = { show: (lines: string[], x: number, y: number) => void; hide: () => void };

const Ctx = createContext<Api>({ show: () => {}, hide: () => {} });
export const useTip = () => useContext(Ctx);

export function TipLayer({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip>(null);
  const show = useCallback((lines: string[], x: number, y: number) => setTip({ lines, x, y }), []);
  const hide = useCallback(() => setTip(null), []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('[data-tip]') as HTMLElement | SVGElement | null;
      if (el?.dataset.tip) show(el.dataset.tip.split('|'), e.clientX, e.clientY);
      else if (!target?.closest?.('[data-crosshair]')) hide();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerdown', move);
    window.addEventListener('scroll', hide, { passive: true });
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', move);
      window.removeEventListener('scroll', hide);
    };
  }, [show, hide]);

  // Keep the label on screen: above-right of the pointer, flipped at edges.
  const style = tip
    ? {
        transform: `translate(${Math.round(
          tip.x + 300 > (typeof window === 'undefined' ? 9999 : window.innerWidth)
            ? Math.max(8, tip.x - 294)
            : tip.x + 14,
        )}px, ${Math.round(tip.y < 110 ? tip.y + 18 : tip.y - 14)}px)`,
      }
    : undefined;

  return (
    <Ctx.Provider value={{ show, hide }}>
      {children}
      {tip && (
        <output className={`tr-tip${tip.y < 110 ? '' : ' above'}`} style={style}>
          {tip.lines.map((l, i) =>
            i === 0 ? <b key={l}>{l}</b> : <span key={`${i}-${l}`}>{l}</span>,
          )}
        </output>
      )}
    </Ctx.Provider>
  );
}
