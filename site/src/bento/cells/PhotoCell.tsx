'use client';

import { useState } from 'react';

/**
 * Photo cell. Renders a soft muted rectangle with the assigned filename
 * shown top-left in mono. Attempts to <img> from /photos/<filename>; if
 * the file 404s, onError hides the image so the placeholder rectangle
 * stays clean — no broken-image icon.
 *
 * `filename` and `gridRow` come from BentoHome via pickLayout(). The
 * gridRow string is applied inline so 2-row (portrait) and 1-row
 * layouts share this component. On mobile, bento.css overrides
 * `grid-row` to `auto` so the inline value is ignored (see media query).
 */
type Props = {
  filename: string;
  /** Direct CSS Grid `grid-row` value, e.g. "1", "3", or "1 / span 2". */
  gridRow: string;
  /** Which grid area class to apply, e.g. 'cell-photo-a'. */
  areaClass: string;
};

export function PhotoCell({ filename, gridRow, areaClass }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <section
      className={`cell cell-photo ${areaClass}`}
      aria-label={`Photograph ${filename}`}
      style={{ gridRow }}
    >
      <div className="photo-fname">{filename.toUpperCase()}</div>
      {!failed && (
        <img
          className="photo-img"
          src={`/photos/${filename}`}
          alt=""
          decoding="async"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 220ms ease' }}
        />
      )}
    </section>
  );
}
