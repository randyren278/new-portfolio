'use client';

import type { ShellContent } from '@/content/types';
import { useEffect, useState } from 'react';
import './bento.css';
import { ContactCell } from './cells/ContactCell';
import { NameCell } from './cells/NameCell';
import { PhotoCell } from './cells/PhotoCell';
import { ProjectsCell } from './cells/ProjectsCell';
import { ResumeCell } from './cells/ResumeCell';
import { StravaCell, type StravaData } from './cells/StravaCell';
import { INITIAL_SLOTS, type PhotoSlot, pickLayout } from './photos';

/**
 * Top-level bento home. Composes the asymmetric grid:
 *
 *   Row band 1: [Name        ] [Photo A     ] [Contact     ]
 *   Row band 2: [Projects    ] [ (Photo A)  ] [Strava      ]
 *   Row band 3: [ (Projects) ] [Photo B     ] [Résumé      ]
 *
 * The grid uses 6 equal rows so photo cells span 3 rows each
 * (near-square) while left/right column cells span 2 rows each — see
 * bento.css. Portraits get cropped top+bottom via object-fit: cover to
 * fit the near-square cell; that's intentional (see the OPTION 4 pick
 * in the photo-fit review). Photos are 2 per visit; the color-band
 * shuffle picks which two from the manifest.
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
 * Photo-B, Résumé — shuffle randomly per visit, with one rule: the
 * two photo cells never land back-to-back. Implemented on client mount
 * by injecting a <style> element whose rules live inside the mobile
 * media query. bento.css keeps a fixed order as the JS-off fallback.
 *
 * Projects carousel: content.ORDER is the full project catalog (8, as
 * of this writing), but .projects-list has a fixed height with
 * overflow: hidden and only ever fit 4 rows. Rather than grow the
 * cell, each visit shows a random 4-project slice — same "deterministic
 * SSR, swap after mount" pattern as the photo pair above. The chosen
 * subset is re-sorted back into catalog order so numbering/prev-next
 * reads stably rather than jumbled.
 */
const VISIBLE_PROJECT_COUNT = 4;

function pickVisibleProjects(order: readonly string[]): string[] {
  const shuffled = [...order];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = new Set(shuffled.slice(0, VISIBLE_PROJECT_COUNT));
  return order.filter((id) => picked.has(id));
}

export function BentoHome({
  content,
  strava,
}: {
  content: ShellContent;
  strava: StravaData | null;
}) {
  const [slots, setSlots] = useState<readonly PhotoSlot[]>(INITIAL_SLOTS);
  const [visibleProjects, setVisibleProjects] = useState<string[]>(() =>
    content.ORDER.slice(0, VISIBLE_PROJECT_COUNT),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: content.ORDER is a static server-loaded prop; this must run once on mount only.
  useEffect(() => {
    setSlots(pickLayout());
    setVisibleProjects(pickVisibleProjects(content.ORDER));

    // Rejection-sample a permutation of the six non-Name cells until
    // the two photo cells are not adjacent. For 2 photos among 6
    // positions, ~2/3 of permutations satisfy the constraint — a
    // handful of rerolls at most.
    const items = ['contact', 'projects', 'strava', 'photo-a', 'photo-b', 'resume'];
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
        <div className="brand">RANDY REN · PORTFOLIO</div>
      </header>

      <main className="bento-grid" data-photo-count={slots.length}>
        <NameCell aboutText={content.ABOUT_TEXT} />
        {slots[0] && (
          <PhotoCell
            key={`a-${slots[0].photo.file}`}
            slot={slots[0]}
            areaClass="cell-photo-a"
            caption={content.PHOTO_CAPTIONS[slots[0].photo.file]}
          />
        )}
        <ContactCell contactText={content.CONTACT_TEXT} />

        <ProjectsCell
          order={visibleProjects}
          mediums={content.MEDIUMS}
          plates={content.PLATE_DATA}
        />
        {slots[1] && (
          <PhotoCell
            key={`b-${slots[1].photo.file}`}
            slot={slots[1]}
            areaClass="cell-photo-b"
            caption={content.PHOTO_CAPTIONS[slots[1].photo.file]}
          />
        )}
        <StravaCell strava={strava} />

        <ResumeCell resume={content.RESUME} />
      </main>

      <footer className="bento-topbar" aria-hidden="true">
        <div>randyren.org</div>
        <div>NO SERVERS PRESIDING</div>
      </footer>
    </div>
  );
}
