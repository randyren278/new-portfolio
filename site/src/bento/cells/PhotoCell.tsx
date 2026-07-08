'use client';

import { useEffect, useState } from 'react';
import { PHOTO_POOL, shufflePhotos } from '../photos';

/**
 * Photo cell. Renders a soft muted rectangle with the assigned filename
 * shown top-left in mono. Attempts to <img> from /photos/<filename>; if
 * the file 404s (default state until Randy drops JPGs into public/photos),
 * onError hides the image so the placeholder rectangle stays clean —
 * no broken-image icon.
 *
 * SSR + hydration story: shuffling has to happen ONLY on the client,
 * because Math.random() on the server produces a different sequence than
 * on the client and would cause a hydration mismatch. So the initial
 * render (SSR + first client paint) uses the unshuffled pool in slot
 * order; then a useEffect swaps in a shuffled filename. The visitor
 * sees the "same" placeholder for one frame, then the shuffle lands —
 * imperceptible in practice, and hydration stays clean.
 *
 * The `slot` prop is a 0-indexed position. Slots 0..N pick the Nth
 * filename from the (shuffled or unshuffled) pool.
 */
type Props = {
  /** Which position in the shuffled pool this cell gets (0..N-1). */
  slot: number;
  /** Which grid area class to apply, e.g. 'cell-photo-a'. */
  areaClass: string;
};

// One shuffle per client-side mount, shared across all PhotoCells so
// they agree on the permutation. Cleared on unmount so a full re-mount
// gets a fresh shuffle (matches "reload → new photos" intent).
let clientShuffle: string[] | null = null;

function getClientShuffle(): string[] {
  if (!clientShuffle) clientShuffle = shufflePhotos();
  return clientShuffle;
}

export function PhotoCell({ slot, areaClass }: Props) {
  // Initial state: unshuffled pool. This is what the SERVER renders and
  // what the client renders on FIRST paint before hydration finishes —
  // matching keeps React from complaining about a hydration mismatch.
  const [filename, setFilename] = useState<string>(PHOTO_POOL[slot % PHOTO_POOL.length]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Now that we're client-only, do the shuffle. This causes ONE re-render
    // where filename changes from the unshuffled default to the shuffled
    // permutation. Same effect as "reshuffles on reload".
    const pool = getClientShuffle();
    setFilename(pool[slot % pool.length]);
  }, [slot]);

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
