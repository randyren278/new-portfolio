'use client';

import { useCallback, useEffect, useState } from 'react';
import { POOL_SIZE, type PhotoSlot } from '../photos';

/**
 * Photo cell — a flip card. The front is the photograph; clicking it turns
 * the card over to the verso, which carries the two things the image alone
 * can't say: that Randy shot it, and that the frame beside it on the grid
 * was chosen to match its palette (see pickColorBand in ../photos.ts).
 *
 * The verso shows this frame's five dominant tones as a ribbon, then the
 * paired photograph as a thumbnail with its own ribbon underneath — the
 * match reads at a glance instead of needing a diagram.
 *
 * Cards flip independently. Esc turns any open card back.
 *
 * Front/back both carry `backface-visibility: hidden`, but bento.css also
 * hard-hides the outgoing face at the flip midpoint: a blend mode or filter
 * anywhere inside a face defeats backface culling in some engines and the
 * front paints through mirrored. Belt and braces — the label on the front
 * deliberately uses a text-shadow rather than mix-blend-mode for the same
 * reason.
 *
 * Cell placement (grid-row / grid-column / aspect-ratio) lives in bento.css.
 * If /photos/<file> 404s, onError hides the <img> and the muted rectangle
 * stands alone — no broken-image icon, and the verso still works.
 */
type Props = {
  slot: PhotoSlot;
  /** Which grid area class to apply, e.g. 'cell-photo-a'. */
  areaClass: string;
  /** Optional authored caption for this file; most photos have none. */
  caption?: string;
};

const stem = (file: string) => file.replace(/\.[^.]+$/, '').toUpperCase();

function Ribbon({ palette, className }: { palette: { hex: string }[]; className: string }) {
  return (
    <span className={className} aria-hidden="true">
      {palette.map((tone) => (
        <span key={tone.hex} style={{ background: tone.hex }} />
      ))}
    </span>
  );
}

export function PhotoCell({ slot, areaClass, caption }: Props) {
  const { photo, partner, rank } = slot;
  const [flipped, setFlipped] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const flipBack = useCallback(() => setFlipped(false), []);

  useEffect(() => {
    if (!flipped) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') flipBack();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [flipped, flipBack]);

  const hex = `#${[photo.r, photo.g, photo.b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
  const delta = Math.abs(photo.hue - partner.hue);

  return (
    <section
      className={`cell cell-photo ${areaClass} ${flipped ? 'flipped' : ''}`}
      aria-label={`Photograph ${photo.file}`}
    >
      <div className="photo-inner">
        <div className="photo-face photo-front">
          {!failed && (
            <img
              className="photo-img"
              src={`/photos/${photo.file}`}
              alt=""
              decoding="async"
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 220ms ease' }}
            />
          )}
          <span className="photo-fname">{photo.file.toUpperCase()}</span>
          <button
            type="button"
            className="photo-flip"
            onClick={() => setFlipped(true)}
            aria-expanded={flipped}
            aria-label={`Show details for ${photo.file}`}
          >
            <span className="photo-mark" aria-hidden="true" />
          </button>
        </div>

        <div className="photo-face photo-back">
          <div className={`photo-verso ${caption ? '' : 'photo-verso-nocap'}`}>
            <div className="photo-verso-top">
              <span className="kicker">
                § VERSO · {rank}/{POOL_SIZE} BY HUE
              </span>
              <span className="photo-prov">PHOTOGRAPHED BY RANDY REN</span>
            </div>

            {caption ? <p className="photo-caption">{caption}</p> : null}

            <div className="photo-palrow">
              <span className="photo-lab">PALETTE</span>
              <Ribbon palette={photo.palette} className="photo-rib photo-rib-self" />
            </div>

            <div className="photo-verso-rule" />

            <div className="photo-pair">
              <img
                className="photo-thumb"
                src={`/photos/${partner.file}`}
                alt=""
                decoding="async"
                loading="lazy"
              />
              <div className="photo-pairmeta">
                <span className="kicker">PAIRED WITH</span>
                <span className="photo-pairname">{stem(partner.file)}</span>
                <Ribbon palette={partner.palette} className="photo-rib photo-rib-sm" />
                <span className="photo-foot">Δ{delta}° OF HUE · ADJACENT IN THE SORT</span>
              </div>
            </div>

            <div className="photo-verso-tail">
              <span className="photo-foot">
                {hex} · {photo.w}×{photo.h} · HUE {photo.hue}°
              </span>
            </div>
          </div>

          <button
            type="button"
            className="photo-return"
            onClick={flipBack}
            aria-label="Back to photograph"
          >
            {'↩︎'}
          </button>
        </div>
      </div>
    </section>
  );
}
