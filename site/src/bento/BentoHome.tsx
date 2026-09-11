'use client';

import type { ShellContent } from '@/content/types';
import { useEffect, useRef, useState } from 'react';
import './bento.css';
import { ContactCell } from './cells/ContactCell';
import { NameCell } from './cells/NameCell';
import { PhotoCell } from './cells/PhotoCell';
import { ProjectsCell } from './cells/ProjectsCell';
import { ResumeCell } from './cells/ResumeCell';
import { StravaCell, type StravaData } from './cells/StravaCell';
import { INITIAL_SLOTS, type PhotoSlot, pickLayout } from './photos';
import { useResizeTreatment } from './useResizeTreatment';

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
 * JSX source order is the stable mobile reading and keyboard order.
 * Desktop uses explicit grid-column and grid-row placement.
 *
 * Hydration story: SSR + first client paint render `INITIAL_SLOTS`
 * (deterministic, first 2 photos from the manifest). A useEffect swaps
 * in the seeded selection. One-frame swap, imperceptible in practice.
 *
 * Mobile: Name, Contact, Projects, Photo A, Résumé, Activity, Photo B.
 * Only the photo selection changes between visits.
 */
export function BentoHome({
  content,
  strava,
}: {
  content: ShellContent;
  strava: StravaData | null;
}) {
  const [slots, setSlots] = useState<readonly PhotoSlot[]>(INITIAL_SLOTS);
  const gridRef = useRef<HTMLElement>(null);
  useResizeTreatment(gridRef);

  useEffect(() => {
    setSlots(pickLayout());
  }, []);

  return (
    <div className="bento-page">
      <a className="skip-link" href="#portfolio">
        Skip to content
      </a>
      <header className="bento-topbar">
        <div className="brand">RANDY REN · PORTFOLIO</div>
      </header>

      <main id="portfolio" ref={gridRef} className="bento-grid" data-photo-count={slots.length}>
        <NameCell aboutText={content.ABOUT_TEXT} />
        <ContactCell contactText={content.CONTACT_TEXT} />
        <ProjectsCell order={content.ORDER} mediums={content.MEDIUMS} plates={content.PLATE_DATA} />
        {slots[0] && (
          <PhotoCell
            key={`a-${slots[0].photo.file}`}
            slot={slots[0]}
            areaClass="cell-photo-a"
            caption={content.PHOTO_CAPTIONS[slots[0].photo.file]}
          />
        )}
        <ResumeCell resume={content.RESUME} />
        <StravaCell strava={strava} />
        {slots[1] && (
          <PhotoCell
            key={`b-${slots[1].photo.file}`}
            slot={slots[1]}
            areaClass="cell-photo-b"
            caption={content.PHOTO_CAPTIONS[slots[1].photo.file]}
          />
        )}
      </main>

      <footer className="bento-topbar">
        <div>randyren.org</div>
        <div className="welcome-note">Stay a little while.</div>
      </footer>
    </div>
  );
}
