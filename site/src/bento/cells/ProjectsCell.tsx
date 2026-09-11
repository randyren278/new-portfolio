'use client';

import type { MediumEntry, PlateEntry } from '@/content/types';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Projects card — bottom-left, spans four rows.
 *
 * Renders the project catalog and opens a viewport-centered reading surface.
 * The surface is portaled to the body so card reflow transforms cannot
 * change its fixed positioning. The background is inert while reading.
 *
 * The detail is a two-column layout: a "Particulars" rail (meta) on the
 * left, the essay on the right, with prev/next paging through ORDER along
 * the bottom. Closes on the × button, Esc, or a click outside (on the
 * dimmed scrim).
 *
 * computeFinal owns responsive geometry; CSS animates only a short lift
 * and fade, with an immediate reduced-motion path.
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
  const [open, setOpen] = useState(false);
  const [finalRect, setFinalRect] = useState<Rect | null>(null);

  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const openPlate = (id: string) => {
    openerRef.current = rowRefs.current[id];
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFinalRect(computeFinal());
    setExpandedId(id);
    setOpen(false);
  };

  const closePlate = useCallback(() => {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(
      () => {
        setExpandedId(null);
      },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180,
    );
  }, []);

  // Adjacent projects share the reading surface.
  const navTo = (id: string) => {
    setExpandedId(id);
  };

  // Fade and lift the reading surface without resizing its text.
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
      if (e.key === 'Tab') {
        const controls = closeBtnRef.current
          ?.closest('.projects-plate')
          ?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onResize = () => setFinalRect(computeFinal());
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const prevOverflow = document.body.style.overflow;
    const background = document.querySelector<HTMLElement>('.bento-page');
    if (background) background.inert = true;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prevOverflow;
      if (background) background.inert = false;
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [expandedId, closePlate]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const expanded = expandedId ? plates[expandedId] : null;
  const geo = finalRect;
  const idx = expandedId ? order.indexOf(expandedId) : -1;
  const prevId = idx > 0 ? order[idx - 1] : null;
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  return (
    <section className="cell cell-projects" aria-label="Projects">
      <h2 className="kicker">§ PROJECTS</h2>

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

      {expanded &&
        expandedId &&
        geo &&
        createPortal(
          <>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc is handled on document; the scrim is a redundant pointer affordance and the × button is the keyboard-accessible close. */}
            <div className="projects-plate-overlay" onClick={closePlate} aria-hidden="true" />
            <section
              id={`plate-${expandedId}`}
              className={`projects-plate ${open ? 'open' : ''}`}
              style={{ top: geo.top, left: geo.left, width: geo.width, height: geo.height }}
              // biome-ignore lint/a11y/useSemanticElements: portaled dialog provides focus containment, inert background and a controlled exit transition.
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
                {(() => {
                  // Derive the plate number from ORDER position so it always
                  // matches the list row (both 1-indexed, zero-padded). Falls
                  // back to the stored number for plates not in ORDER.
                  const displayNum = idx >= 0 ? String(idx + 1).padStart(2, '0') : expanded.number;
                  return displayNum ? (
                    <div className="projects-plate-number">{displayNum}</div>
                  ) : null;
                })()}
                <div className="projects-plate-title">{expanded.title}</div>

                <div className="projects-plate-cols">
                  <div className="projects-plate-rail">
                    <div className="projects-plate-meta">
                      {expanded.meta?.map((m: { lab: string; val: string }) => (
                        <div key={m.lab}>
                          {m.lab} · {m.val}
                        </div>
                      ))}
                    </div>
                    {Array.isArray(expanded.links) && expanded.links.length > 0 && (
                      <div className="projects-plate-links">
                        {expanded.links.map((l: { lab: string; href: string }) => (
                          <a
                            key={l.href}
                            className="projects-plate-link"
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {l.lab} {'↗︎'}
                          </a>
                        ))}
                      </div>
                    )}
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

                <div className="projects-plate-nav">
                  <button type="button" disabled={!prevId} onClick={() => prevId && navTo(prevId)}>
                    {prevId ? (
                      <>
                        {'←︎'} PREV
                        <span className="np">{plates[prevId]?.title}</span>
                      </>
                    ) : (
                      '←︎ PREV'
                    )}
                  </button>
                  <button type="button" disabled={!nextId} onClick={() => nextId && navTo(nextId)}>
                    {nextId ? (
                      <>
                        NEXT {'→︎'}
                        <span className="np">{plates[nextId]?.title}</span>
                      </>
                    ) : (
                      'NEXT →︎'
                    )}
                  </button>
                </div>
              </div>
            </section>
          </>,
          document.body,
        )}
    </section>
  );
}
