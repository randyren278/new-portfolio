'use client';

import type { ShellContent } from '@/content/types';
import { useEffect, useState } from 'react';
import './bento.css';
import { ThemeToggle } from './ThemeToggle';
import { ContactCell } from './cells/ContactCell';
import { HoursCell } from './cells/HoursCell';
import { NameCell } from './cells/NameCell';
import { PhotoCell } from './cells/PhotoCell';
import { ProjectsCell } from './cells/ProjectsCell';
import { StravaCell, type StravaData } from './cells/StravaCell';
import { INITIAL_SLOTS, type PhotoSlot, pickLayout } from './photos';

/**
 * Top-level bento home. Composes the 3×3 asymmetric grid:
 *
 *   Row 1: [Name        ] [Photo A     ] [Contact     ]
 *   Row 2: [Projects    ] [Photo B     ] [Strava      ]
 *   Row 3: [ (spans)    ] [Photo C     ] [Hours       ]
 *
 * Projects spans two rows down the left. Middle column is a vertical
 * photo strip whose count (2 or 3) and per-cell row-span is picked at
 * mount time by `pickLayout()` — see src/bento/photos.ts. Photos in a
 * given visit share a hue band; the band is randomly-positioned so
 * the palette differs between visits.
 *
 * JSX source order matters on mobile — the media query stacks cells
 * with auto-flow, so order here IS the vertical order there. Desktop
 * ignores source order and uses grid-column + inline grid-row.
 *
 * Hydration story: SSR + first client paint render `INITIAL_SLOTS`
 * (deterministic, from the top of the manifest). A useEffect swaps in
 * the seeded selection. One-frame swap, imperceptible in practice.
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
  }, []);

  return (
    <div className="bento-page">
      <header className="bento-topbar">
        <div className="brand">RANDY REN · PORTFOLIO 2026</div>
        <ThemeToggle />
      </header>

      <main className="bento-grid" data-photo-count={slots.length}>
        <NameCell aboutText={content.ABOUT_TEXT} />
        {slots[0] && (
          <PhotoCell
            key={`a-${slots[0].file}`}
            filename={slots[0].file}
            gridRow={slots[0].gridRow}
            areaClass="cell-photo-a"
          />
        )}
        <ContactCell contactText={content.CONTACT_TEXT} />

        <ProjectsCell order={content.ORDER} mediums={content.MEDIUMS} plates={content.PLATE_DATA} />
        {slots[1] && (
          <PhotoCell
            key={`b-${slots[1].file}`}
            filename={slots[1].file}
            gridRow={slots[1].gridRow}
            areaClass="cell-photo-b"
          />
        )}
        <StravaCell strava={strava} />

        {slots[2] && (
          <PhotoCell
            key={`c-${slots[2].file}`}
            filename={slots[2].file}
            gridRow={slots[2].gridRow}
            areaClass="cell-photo-c"
          />
        )}
        <HoursCell hoursText={content.HOURS_TEXT} />
      </main>

      <footer className="bento-topbar" aria-hidden="true">
        <div>randyren.org · 2026</div>
        <div>NO SERVERS PRESIDING</div>
      </footer>
    </div>
  );
}
