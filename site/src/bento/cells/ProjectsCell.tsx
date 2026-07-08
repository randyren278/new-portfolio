'use client';

import type { MediumEntry, PlateEntry } from '@/content/types';
import { useState } from 'react';

/**
 * Projects card — bottom-left, spans two rows.
 *
 * Renders as a six-row monospace-aligned list (plate # / title / blurb).
 * Clicking a row expands the plate essay in place — the list swaps out
 * for a full plate view within the same cell. `× close` returns to the
 * list.
 *
 * The rest of the bento does not resize when a plate opens; the cell
 * itself overflows scroll internally if the essay is long.
 */
type Props = {
  order: string[];
  mediums: Record<string, MediumEntry>;
  plates: Record<string, PlateEntry>;
};

export function ProjectsCell({ order, mediums, plates }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const expanded = expandedId ? plates[expandedId] : null;

  return (
    <section className="cell cell-projects" aria-label="Projects">
      <div className="kicker">§ INDEX / SIX PLATES</div>

      <div className="projects-list" aria-hidden={expanded ? 'true' : 'false'}>
        {order.map((id, i) => {
          const m = mediums[id];
          if (!m) return null;
          const num = String(i + 1).padStart(2, '0');
          return (
            <button
              key={id}
              type="button"
              className="projects-row"
              onClick={() => setExpandedId(id)}
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

      {expanded && expandedId && (
        <section
          id={`plate-${expandedId}`}
          className="projects-plate"
          aria-label={`${expanded.title} plate`}
        >
          <button
            type="button"
            className="projects-plate-close"
            onClick={() => setExpandedId(null)}
            aria-label="Close plate"
          >
            × close
          </button>
          {expanded.number && <div className="projects-plate-number">{expanded.number}</div>}
          <div className="projects-plate-title">{expanded.title}</div>
          <div className="projects-plate-meta">
            {expanded.meta?.map((m: { lab: string; val: string }) => (
              <div key={m.lab}>
                {m.lab} · {m.val}
              </div>
            ))}
          </div>
          {Array.isArray(expanded.essay) &&
            expanded.essay.map((para: string, idx: number) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: essay paragraphs are stable per plate
              <p key={idx} className="projects-plate-essay">
                {para}
              </p>
            ))}
          {expanded.plateCap && <div className="projects-plate-cap">{expanded.plateCap}</div>}
        </section>
      )}
    </section>
  );
}
