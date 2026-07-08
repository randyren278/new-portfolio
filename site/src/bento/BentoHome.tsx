'use client';

import type { ShellContent } from '@/content/types';
import { useEffect, useState } from 'react';
import './bento.css';
import { ContactCell } from './cells/ContactCell';
import { HoursCell } from './cells/HoursCell';
import { NameCell } from './cells/NameCell';
import { PhotoCell } from './cells/PhotoCell';
import { ProjectsCell } from './cells/ProjectsCell';
import { StravaCell, type StravaData } from './cells/StravaCell';
import { INITIAL_SLOTS, type PhotoSlot, pickLayout } from './photos';

/**
 * Top-level bento home. Composes the asymmetric grid:
 *
 *   Row band 1: [Name        ] [Photo A     ] [Contact     ]
 *   Row band 2: [Projects    ] [ (Photo A)  ] [Strava      ]
 *   Row band 3: [ (Projects) ] [Photo B     ] [Hours       ]
 *
 * The grid actually uses 6 equal rows so photo cells span 3 rows each
 * (near-square) while left/right column cells span 2 rows each — see
 * bento.css. Photos are always 2 per visit; the color-band shuffle
 * picks which two from the manifest.
 *
 * JSX source order matters on mobile — the media query stacks cells
 * with auto-flow using CSS `order:`, so JSX order feeds into that
 * ordering. Desktop ignores JSX order and uses grid-column + grid-row.
 *
 * Hydration story: SSR + first client paint render `INITIAL_SLOTS`
 * (deterministic, first 2 photos from the manifest). A useEffect swaps
 * in the seeded selection. One-frame swap, imperceptible in practice.
 *
 * Mobile stack order: Name (§ INDEX / about-me) is anchored at the
 * top; the six cells below it — Contact, Projects, Strava, Photo-A,
 * Photo-B, Hours — shuffle randomly per visit, with one rule: the two
 * photo cells never land back-to-back. Implemented on client mount by
 * injecting a <style> element whose rules live inside the mobile
 * media query. bento.css keeps a fixed order as the JS-off fallback.
 */
export function BentoHome({
  content,
  strava,
}: {
  content: ShellContent;
  strava: StravaData | null;
}) {
  const [slots, setSlots] = useState<readonly PhotoSlot[]>(INITIAL_SLOTS);

  useEffect(() => {
    setSlots(pickLayout());

    // Rejection-sample a permutation of the six non-Name cells until
    // the two photo cells are not adjacent. For 2 photos among 6
    // positions, ~2/3 of permutations satisfy the constraint — a
    // handful of rerolls at most.
    const items = ['contact', 'projects', 'strava', 'photo-a', 'photo-b', 'hours'];
    let order: string[];
    do {
      order = [...items];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    } while (Math.abs(order.indexOf('photo-a') - order.indexOf('photo-b')) === 1);

    // Name stays at order:1 (from bento.css); everyone else gets 2..7.
    const rules = order.map((k, i) => `  .cell-${k} { order: ${i + 2}; }`).join('\n');
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-mobile-shuffle', '');
    styleEl.textContent = `@media (max-width: 720px) {\n${rules}\n}\n`;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, []);

  return (
    <div className="bento-page">
      <header className="bento-topbar">
        <div className="brand">RANDY REN · PORTFOLIO 2026</div>
      </header>

      <main className="bento-grid" data-photo-count={slots.length}>
        <NameCell aboutText={content.ABOUT_TEXT} />
        {slots[0] && (
          <PhotoCell key={`a-${slots[0].file}`} filename={slots[0].file} areaClass="cell-photo-a" />
        )}
        <ContactCell contactText={content.CONTACT_TEXT} />

        <ProjectsCell order={content.ORDER} mediums={content.MEDIUMS} plates={content.PLATE_DATA} />
        {slots[1] && (
          <PhotoCell key={`b-${slots[1].file}`} filename={slots[1].file} areaClass="cell-photo-b" />
        )}
        <StravaCell strava={strava} />

        <HoursCell hoursText={content.HOURS_TEXT} />
      </main>

      <footer className="bento-topbar" aria-hidden="true">
        <div>randyren.org · 2026</div>
        <div>NO SERVERS PRESIDING</div>
      </footer>
    </div>
  );
}
