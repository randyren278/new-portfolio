'use client';

import type { MediumEntry, PlateEntry } from '@/content/types';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Projects card — bottom-left, spans four rows.
 *
 * Renders a six-row monospace-aligned list (plate # / title / medium·year).
 * Clicking a row grows that row's tile out of its place in the list into a
 * large viewport-centered card (FLIP-style geometry animation), then fades
 * the detail in. The card is `position: fixed` so it escapes the Projects
 * cell entirely — no longer boxed into the bottom-left third of the grid.
 *
 * The detail is a two-column layout: a "Particulars" rail (meta) on the
 * left, the essay on the right, with prev/next paging through ORDER along
 * the bottom. Closes on the × button, Esc, or a click outside (on the
 * dimmed scrim).
 *
 * Origin + final geometry are computed in px in JS (see openPlate /
 * computeFinal) because a FLIP animation transitions top/left/width/height;
 * bento.css owns the chrome and the responsive interior. computeFinal is
 * the single place the desktop-vs-mobile card sizing lives.
 */
type Props = {
  order: string[];
  mediums: Record<string, MediumEntry>;
  plates: Record<string, PlateEntry>;
};

type Rect = { top: number; left: number; width: number; height: number };

/** Card geometry for the open state — mobile fills the viewport with a
 *  small inset; desktop/tablet is a centered card capped in both axes. */
function computeFinal(): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw <= 720) {
    const m = 12;
    return { top: m, left: m, width: vw - 2 * m, height: vh - 2 * m };
  }
  const width = Math.min(1040, vw * 0.92);
  const height = Math.min(vh * 0.86, 780);
  return { top: (vh - height) / 2, left: (vw - width) / 2, width, height };
}

export function ProjectsCell({ order, mediums, plates }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false); // false = origin geometry, true = final
  const [finalRect, setFinalRect] = useState<Rect | null>(null);

  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const originRef = useRef<Rect | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measureRow = (id: string): Rect => {
    const r = rowRefs.current[id]?.getBoundingClientRect();
    return r ? { top: r.top, left: r.left, width: r.width, height: r.height } : computeFinal();
  };

  const openPlate = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    originRef.current = measureRow(id);
    setFinalRect(computeFinal());
    setExpandedId(id);
    setOpen(false);
  };

  const closePlate = useCallback(() => {
    setOpen(false); // animate geometry back to the origin row
    closeTimer.current = setTimeout(() => {
      const id = expandedId;
      setExpandedId(null);
      // restore focus to the row that opened the plate
      if (id) rowRefs.current[id]?.focus();
    }, 300);
  }, [expandedId]);

  // Page to an adjacent plate without re-running the grow animation: the
  // card stays put, content swaps, and the origin updates so a later close
  // animates back to the now-current row.
  const navTo = (id: string) => {
    originRef.current = measureRow(id);
    setExpandedId(id);
  };

  // Grow: paint once at the origin rect, then next frame switch to final.
  useLayoutEffect(() => {
    if (!expandedId) return;
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, [expandedId]);

  // While open: Esc closes, background scroll locks, focus lands on close.
  useEffect(() => {
    if (!expandedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePlate();
    };
    const onResize = () => setFinalRect(computeFinal());
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [expandedId, closePlate]);

  const expanded = expandedId ? plates[expandedId] : null;
  const geo = (open ? finalRect : originRef.current) ?? originRef.current;
  const idx = expandedId ? order.indexOf(expandedId) : -1;
  const prevId = idx > 0 ? order[idx - 1] : null;
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  return (
    <section className="cell cell-projects" aria-label="Projects">
      <div className="kicker">§ INDEX / SIX PLATES</div>

      <div className="projects-list">
        {order.map((id, i) => {
          const m = mediums[id];
          if (!m) return null;
          const num = String(i + 1).padStart(2, '0');
          return (
            <button
              key={id}
              type="button"
              className="projects-row"
              ref={(el) => {
                rowRefs.current[id] = el;
              }}
              onClick={() => openPlate(id)}
              aria-expanded={expandedId === id}
              aria-controls={`plate-${id}`}
            >
              <span className="projects-num">{num}</span>
              <span className="projects-ttl">{m.title}</span>
              <span className="projects-blb">
                {m.medium} · {m.year}
              </span>
            </button>
          );
        })}
      </div>

      {expanded && expandedId && geo && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc is handled on document; the scrim is a redundant pointer affordance and the × button is the keyboard-accessible close. */}
          <div className="projects-plate-overlay" onClick={closePlate} aria-hidden="true" />
          <section
            id={`plate-${expandedId}`}
            className={`projects-plate ${open ? 'open' : ''}`}
            style={{ top: geo.top, left: geo.left, width: geo.width, height: geo.height }}
            // biome-ignore lint/a11y/useSemanticElements: native <dialog> promotes to the top layer, which breaks the FLIP animation from the row's in-flow position; role="dialog" keeps the ARIA semantics without the top-layer behavior.
            role="dialog"
            aria-modal="true"
            aria-label={`${expanded.title} plate`}
          >
            <button
              type="button"
              className="projects-plate-close"
              ref={closeBtnRef}
              onClick={closePlate}
              aria-label="Close plate"
            >
              × close
            </button>
            <div className="projects-plate-body">
              {expanded.number && <div className="projects-plate-number">{expanded.number}</div>}
              <div className="projects-plate-title">{expanded.title}</div>

              <div className="projects-plate-cols">
                <div className="projects-plate-rail">
                  <div className="projects-plate-railhead">Particulars</div>
                  <div className="projects-plate-meta">
                    {expanded.meta?.map((m: { lab: string; val: string }) => (
                      <div key={m.lab}>
                        {m.lab} · {m.val}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="projects-plate-essaycol">
                  {Array.isArray(expanded.essay) &&
                    expanded.essay.map((para: string, i: number) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: essay paragraphs are stable per plate
                      <p key={i} className="projects-plate-essay">
                        {para}
                      </p>
                    ))}
                </div>
              </div>

              {expanded.plateCap && <div className="projects-plate-cap">{expanded.plateCap}</div>}

              <div className="projects-plate-nav">
                <button type="button" disabled={!prevId} onClick={() => prevId && navTo(prevId)}>
                  {prevId ? (
                    <>
                      ← PREV
                      <span className="np">{plates[prevId]?.title}</span>
                    </>
                  ) : (
                    '← PREV'
                  )}
                </button>
                <button type="button" disabled={!nextId} onClick={() => nextId && navTo(nextId)}>
                  {nextId ? (
                    <>
                      NEXT →<span className="np">{plates[nextId]?.title}</span>
                    </>
                  ) : (
                    'NEXT →'
                  )}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
