'use client';

import type { ShellContent } from '@/content/types';
import { useEffect, useRef, useState } from 'react';
import './bento.css';
import './puff.css';
import { PuffEntrance } from './PuffEntrance';
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
  const [intro, setIntro] = useState(true);
  const [entering, setEntering] = useState(false);
  const [scene, setScene] = useState<string | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  useEffect(() => {
    setScene(['space', 'pool', 'kite'][Math.floor(Math.random() * 3)]);
  }, []);
  useEffect(() => {
    if (!intro) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, [intro]);
  function shufflePhotos() {
    let next = pickLayout();
    for (
      let i = 0;
      i < 20 && next.some((n) => slots.some((s) => s.photo.file === n.photo.file));
      i++
    )
      next = pickLayout();
    setSlots(next);
    setShuffleCount((count) => count + 1);
  }
  function finishIntro() {
    setIntro(false);
    setEntering(false);
  }
  function replayIntro() {
    window.scrollTo(0, 0);
    setIntro(true);
  }
  const [slots, setSlots] = useState<readonly PhotoSlot[]>(INITIAL_SLOTS);
  const gridRef = useRef<HTMLElement>(null);
  useResizeTreatment(gridRef);
  useEffect(() => {
    if (!intro) gridRef.current?.focus({ preventScroll: true });
  }, [intro]);

  useEffect(() => {
    setSlots(pickLayout());
  }, []);

  return (
    <>
      {intro && scene && (
        <PuffEntrance scene={scene} onEntering={() => setEntering(true)} onEntered={finishIntro} />
      )}
      <div
        className={`bento-page puff-bento${intro && !entering ? ' awaiting-intro' : ''}${entering ? ' bento-landing' : ''}`}
        inert={intro}
      >
        <a className="skip-link" href="#portfolio">
          Skip to content
        </a>
        <header className="bento-topbar">
          <div className="brand">RANDY REN · PORTFOLIO</div>
          <button className="bento-text-button" type="button" onClick={shufflePhotos}>
            Shuffle photos ↻
          </button>
          <output className="puff-sr-only">
            {shuffleCount ? `Photos shuffled (${shuffleCount})` : ''}
          </output>
        </header>

        <main
          id="portfolio"
          tabIndex={-1}
          ref={gridRef}
          className="bento-grid"
          data-photo-count={slots.length}
        >
          <NameCell aboutText={content.ABOUT_TEXT} />
          <ContactCell contactText={content.CONTACT_TEXT} puff />
          <ProjectsCell
            order={content.ORDER}
            mediums={content.MEDIUMS}
            plates={content.PLATE_DATA}
          />
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
          <button className="bento-text-button" type="button" onClick={replayIntro}>
            Return to intro ↑
          </button>
        </footer>
      </div>
    </>
  );
}
