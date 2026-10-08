'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import fallbackPhotos from '../photo-fallbacks.json';
import { POOL_SIZE, type PhotoSlot } from '../photos';
import type { ReadyPhoto } from '../usePhotoShuffle';

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
 * Cards flip independently. Clicking anywhere on the verso or pressing Esc
 * turns an open card back; the corner return button remains as the visible
 * and keyboard-accessible affordance.
 *
 * Front/back both carry `backface-visibility: hidden`, but bento.css also
 * hard-hides the outgoing face at the flip midpoint: a blend mode or filter
 * anywhere inside a face defeats backface culling in some engines and the
 * front paints through mirrored. Belt and braces — the label on the front
 * deliberately uses a text-shadow rather than mix-blend-mode for the same
 * reason.
 *
 * Cell placement (grid-row / grid-column / aspect-ratio) lives in bento.css.
 * The image stage owns decoded DOM images so a shuffle keeps the previous
 * photograph underneath the incoming film frame until its animation finishes.
 */
type Props = {
  slot: PhotoSlot;
  /** Which grid area class to apply, e.g. 'cell-photo-a'. */
  areaClass: string;
  /** Optional authored caption for this file; most photos have none. */
  caption?: string;
  incoming?: ReadyPhoto;
  onSettled: (file: string) => void;
  delay: number;
};

const fallbacks: Record<string, string> = fallbackPhotos;

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

export function PhotoCell({ slot, areaClass, caption, incoming, onSettled, delay }: Props) {
  const { photo, partner, rank } = slot;
  const [flipped, setFlipped] = useState(false);
  const initial = useRef(slot);
  const stage = useRef<HTMLDivElement>(null);
  const displayed = useRef<HTMLImageElement | null>(null);
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;
  const frontRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const interacted = useRef(false);

  useEffect(() => {
    if (!incoming || !stage.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wasFlipped = flippedRef.current;
    // A shuffle should not move focus from its button back into a photo.
    interacted.current = false;
    setFlipped(false);
    const image = incoming.image;
    image.className = 'photo-img photo-incoming';
    stage.current.append(image);
    const animation = image.animate(
      reduced
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }],
      {
        duration: reduced ? 120 : 720,
        delay: reduced ? 0 : delay + (wasFlipped ? 620 : 0),
        easing: 'cubic-bezier(.22,.8,.2,1)',
        fill: 'both',
      },
    );
    let completed = false;
    animation.finished.then(
      () => {
        completed = true;
        displayed.current?.remove();
        displayed.current = image;
        image.className = 'photo-img photo-current';
        animation.cancel();
        onSettled(incoming.slot.photo.file);
      },
      () => {},
    );
    return () => {
      animation.cancel();
      if (!completed) image.remove();
    };
  }, [incoming, onSettled, delay]);

  useEffect(() => {
    if (!interacted.current) return;
    const timer = setTimeout(
      () => {
        (flipped ? backRef : frontRef).current?.focus({ preventScroll: true });
      },
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320,
    );
    return () => clearTimeout(timer);
  }, [flipped]);

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
        <div className="photo-face photo-front" inert={flipped}>
          <div className="photo-stage" ref={stage}>
            <img
              className="photo-img photo-fallback"
              src={fallbacks[initial.current.photo.file]}
              alt=""
              decoding="async"
              loading="eager"
            />
          </div>
          <span className="photo-fname">{photo.file.toUpperCase()}</span>
          <button
            type="button"
            className="photo-flip"
            ref={frontRef}
            disabled={!!incoming}
            onClick={() => {
              interacted.current = true;
              setFlipped(true);
            }}
            aria-expanded={flipped}
            aria-label={`Show details for ${photo.file}`}
          >
            <span className="photo-glass-label">
              Photo details <span aria-hidden="true">↗</span>
            </span>
          </button>
        </div>

        {/* biome-ignore lint/a11y/useKeyWithClickEvents: the full verso is a redundant pointer target; the nested return button provides the keyboard action. */}
        <div className="photo-face photo-back" onClick={flipBack} inert={!flipped}>
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
                src={fallbacks[partner.file] ?? `/photos/${partner.file}`}
                alt=""
                decoding="async"
                loading="eager"
              />
              <div className="photo-pairmeta">
                <span className="kicker">PAIRED WITH</span>
                <span className="photo-pairname">{stem(partner.file)}</span>
                <Ribbon palette={partner.palette} className="photo-rib photo-rib-sm" />
                <span className="photo-foot">Δ{delta}° OF HUE · PAIRED BY COLOR</span>
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
            ref={backRef}
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
