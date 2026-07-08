'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';

/**
 * Photo cell. Renders a soft muted rectangle with the assigned filename
 * shown top-left in mono. Attempts to <img> from /photos/<filename>; if
 * the file 404s, onError hides the image so the placeholder rectangle
 * stays clean — no broken-image icon.
 *
 * The cell's aspect ratio comes from the photo itself (via a
 * --photo-aspect CSS var set from the manifest). The cell reshapes to
 * match the image so nothing gets cropped or squashed at any viewport.
 * See .cell-photo in bento.css for how the var is consumed.
 */
type Props = {
  filename: string;
  aspect: number;
  /** Which grid area class to apply, e.g. 'cell-photo-a'. */
  areaClass: string;
};

export function PhotoCell({ filename, aspect, areaClass }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <section
      className={`cell cell-photo ${areaClass}`}
      style={{ '--photo-aspect': String(aspect) } as CSSProperties}
      aria-label={`Photograph ${filename}`}
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
