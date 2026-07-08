'use client';

import { useState } from 'react';

/**
 * Photo cell. Renders a soft muted rectangle with the assigned filename
 * shown top-left in mono. Attempts to <img> from /photos/<filename>; if
 * the file 404s, onError hides the image so the placeholder rectangle
 * stays clean — no broken-image icon.
 *
 * Cell placement (grid-row / grid-column / aspect-ratio) lives in
 * bento.css. Photo cells are near-square on desktop (~1:1 aspect via
 * a 6-row grid where photos span 3 rows) and portrait on mobile
 * (aspect-ratio: 4/5). BentoHome picks WHICH file goes in each slot;
 * this component just renders it.
 */
type Props = {
  filename: string;
  /** Which grid area class to apply, e.g. 'cell-photo-a'. */
  areaClass: string;
};

export function PhotoCell({ filename, areaClass }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <section className={`cell cell-photo ${areaClass}`} aria-label={`Photograph ${filename}`}>
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
