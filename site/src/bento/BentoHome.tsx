'use client';

import type { ShellContent } from '@/content/types';
import './bento.css';
import { ThemeToggle } from './ThemeToggle';
import { ContactCell } from './cells/ContactCell';
import { HoursCell } from './cells/HoursCell';
import { NameCell } from './cells/NameCell';
import { PhotoCell } from './cells/PhotoCell';
import { ProjectsCell } from './cells/ProjectsCell';
import { StravaCell, type StravaData } from './cells/StravaCell';

/**
 * Top-level bento home. Composes the 3×3 asymmetric grid:
 *
 *   Row 1: [Name        ] [Photo A     ] [Contact     ]
 *   Row 2: [Projects    ] [Photo B     ] [Strava      ]
 *   Row 3: [ (spans)    ] [Photo C     ] [Hours       ]
 *
 * Projects spans two rows down the left. Middle column is a vertical
 * photo strip. Strava sits between Contact and Hours on the right.
 *
 * All content arrives as server-fetched props (content + strava). No
 * client-side data fetching — the page is fully static at render time
 * apart from theme + photo shuffle.
 */
export function BentoHome({
  content,
  strava,
}: {
  content: ShellContent;
  strava: StravaData | null;
}) {
  return (
    <div className="bento-page">
      <header className="bento-topbar">
        <div className="brand">RANDY REN · PORTFOLIO 2026</div>
        <ThemeToggle />
      </header>

      <main className="bento-grid">
        <NameCell aboutText={content.ABOUT_TEXT} />
        <PhotoCell slot={0} areaClass="cell-photo-a" />
        <ContactCell contactText={content.CONTACT_TEXT} />

        <ProjectsCell order={content.ORDER} mediums={content.MEDIUMS} plates={content.PLATE_DATA} />
        <PhotoCell slot={1} areaClass="cell-photo-b" />
        <StravaCell strava={strava} />

        <PhotoCell slot={2} areaClass="cell-photo-c" />
        <HoursCell hoursText={content.HOURS_TEXT} />
      </main>

      <footer className="bento-topbar" aria-hidden="true">
        <div>randyren.org · 2026</div>
        <div>NO SERVERS PRESIDING</div>
      </footer>
    </div>
  );
}
