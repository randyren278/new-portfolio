'use client';

import type { ShellContent } from '@/content/types';
import { consumeReturnToHome } from '@/training/returnFlag';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './bento.css';
import './puff.css';
import { PuffEntrance } from './PuffEntrance';
import { ContactCell } from './cells/ContactCell';
import { NameCell } from './cells/NameCell';
import { PhotoCell } from './cells/PhotoCell';
import { ProjectsCell } from './cells/ProjectsCell';
import { ResumeCell } from './cells/ResumeCell';
import { StravaCell } from './cells/StravaCell';
import { usePhotoShuffle } from './usePhotoShuffle';

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
 * Desktop uses explicit grid placement. Mobile reorders the sections in the
 * DOM once per visit, so reading and keyboard order follow the visible order.
 *
 * Hydration story: SSR + first client paint render `INITIAL_SLOTS`
 * (deterministic, first 2 photos from the manifest). A useEffect swaps
 * in a decoded pair, retaining the bundled starting photos until ready.
 *
 * Mobile keeps Name first and both photos together. Projects stays among the
 * first three sections after Name; the remaining sections vary by visit.
 */
const DEFAULT_ORDER = ['name', 'contact', 'projects', 'photos', 'resume', 'activity'] as const;
type Section = (typeof DEFAULT_ORDER)[number];
const PuffGame = dynamic(() => import('./PuffGame'), { ssr: false });

function mobileOrder(): Section[] {
  const rest: Section[] = ['contact', 'projects', 'photos', 'resume', 'activity'];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const projects = rest.indexOf('projects');
  if (projects > 2) {
    rest.splice(projects, 1);
    rest.splice(Math.floor(Math.random() * 3), 0, 'projects');
  }
  return ['name', ...rest];
}

export function BentoHome({
  content,
  initialGame = false,
}: {
  content: ShellContent;
  initialGame?: boolean;
}) {
  const [intro, setIntro] = useState(!initialGame);
  const [entering, setEntering] = useState(false);
  const [scene, setScene] = useState<string | null>(null);
  const [introReady, setIntroReady] = useState(initialGame);
  const gameVisit = useRef(0);
  const [game, setGame] = useState<{
    trigger: HTMLButtonElement | null;
    direct: boolean;
    visit: number;
  } | null>(initialGame ? { trigger: null, direct: true, visit: 0 } : null);
  const [gameOpening, setGameOpening] = useState(initialGame);
  const closeGame = useCallback(() => {
    setGame(null);
    setGameOpening(false);
  }, []);
  const gameEntered = useCallback(() => setGameOpening(false), []);
  const openGame = useCallback(
    (trigger: HTMLButtonElement) => setGame({ trigger, direct: false, visit: ++gameVisit.current }),
    [],
  );
  useEffect(() => {
    const forward = () => {
      const activeGame = document.querySelector<HTMLElement>('.puff-game:not([hidden])');
      if (location.pathname !== '/game' || (activeGame && activeGame.dataset.state !== 'returning'))
        return;
      setIntro(false);
      setGameOpening(true);
      setGame({
        trigger: document.querySelector<HTMLButtonElement>('.correspondence-puff'),
        direct: true,
        visit: ++gameVisit.current,
      });
    };
    addEventListener('popstate', forward);
    addEventListener('pageshow', forward);
    return () => {
      removeEventListener('popstate', forward);
      removeEventListener('pageshow', forward);
    };
  }, []);
  const photos = usePhotoShuffle(introReady || !intro);
  const { slots } = photos;
  const [sectionOrder, setSectionOrder] = useState<readonly Section[]>(DEFAULT_ORDER);
  useLayoutEffect(() => {
    const mobile = matchMedia('(max-width: 720px)');
    let visitOrder: Section[] | null = null;
    const update = () => {
      if (mobile.matches) {
        visitOrder ??= mobileOrder();
        setSectionOrder(visitOrder);
      } else {
        setSectionOrder(DEFAULT_ORDER);
      }
    };
    update();
    mobile.addEventListener('change', update);
    return () => mobile.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (initialGame) return;
    // Returning from another world: the visitor has already been welcomed.
    if (consumeReturnToHome()) {
      setIntroReady(true);
      setIntro(false);
      return;
    }
    setScene(['space', 'pool', 'kite'][Math.floor(Math.random() * 3)]);
  }, [initialGame]);
  // The portfolio is live from the moment it starts fading in (the landing
  // animation's start, after its delay) — not before, or a double-click on
  // the invitation lands on invisible controls; and not after the transit
  // ends, which left a second where everything was visible but every click
  // (Training status, photos, projects) did nothing.
  const [visible, setVisible] = useState(false);
  const covered = intro && !visible;
  useEffect(() => {
    // Reduced motion has no landing animation to wait for.
    if (entering && matchMedia('(prefers-reduced-motion: reduce)').matches) setVisible(true);
  }, [entering]);
  useEffect(() => {
    if (!covered) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, [covered]);
  function finishIntro() {
    setIntro(false);
    setEntering(false);
    setVisible(false);
  }
  const replaying = useRef(false);
  async function replayIntro() {
    if (replaying.current) return;
    replaying.current = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fade one opaque surface over the page, including composited 3D photo faces.
    const curtain = reduced ? null : document.createElement('div');
    if (curtain) {
      curtain.className = 'bento-departure';
      curtain.setAttribute('aria-hidden', 'true');
      document.body.append(curtain);
      await curtain
        .animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 320,
          easing: 'ease-in-out',
          fill: 'forwards',
        })
        .finished.catch(() => {});
    }
    // Commit the hidden portfolio before scrolling or removing its cover.
    // A requestAnimationFrame can run before a concurrent React commit and
    // briefly expose the complete bento at scroll position zero.
    flushSync(() => {
      setScene(['space', 'pool', 'kite'][Math.floor(Math.random() * 3)]);
      setIntro(true);
    });
    window.scrollTo(0, 0);
    curtain?.remove();
    replaying.current = false;
  }
  const gridRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // Hand focus to the grid unless the visitor already moved it (e.g. opened
    // the training plate during the fade-in).
    const active = document.activeElement;
    if (!intro && (!active || active === document.body || active.tagName === 'IFRAME')) {
      gridRef.current?.focus({ preventScroll: true });
    }
  }, [intro]);

  return (
    <>
      {intro && scene && (
        <PuffEntrance
          scene={scene}
          released={visible}
          onEntering={() => setEntering(true)}
          onEntered={finishIntro}
          onReady={() => setIntroReady(true)}
        />
      )}
      <div
        className={`bento-page puff-bento${intro && !entering ? ' awaiting-intro' : ''}${entering ? ' bento-landing' : ''}${gameOpening ? ' game-opening' : ''}`}
        inert={covered}
        onAnimationStart={(e) => {
          if (e.target === e.currentTarget && e.animationName === 'bento-land') setVisible(true);
        }}
      >
        <a className="skip-link" href="#portfolio">
          Skip to content
        </a>
        <header className="bento-topbar">
          <div className="brand">RANDY REN · PORTFOLIO</div>
          <button
            className="bento-text-button photo-shuffle photo-shuffle-top"
            type="button"
            onClick={photos.shuffle}
            disabled={photos.busy}
            aria-busy={photos.busy}
          >
            Shuffle photos <span aria-hidden="true">↻</span>
          </button>
          <a className="bento-text-button photo-jump" href="#photos">
            Photos <span aria-hidden="true">↓</span>
          </a>
          <output className="puff-sr-only">{photos.message}</output>
        </header>

        <main
          id="portfolio"
          tabIndex={-1}
          ref={gridRef}
          className="bento-grid"
          data-photo-count={slots.length}
        >
          {sectionOrder.map((section) => {
            switch (section) {
              case 'name':
                return <NameCell key={section} aboutText={content.ABOUT_TEXT} />;
              case 'contact':
                return (
                  <ContactCell
                    key={section}
                    contactText={content.CONTACT_TEXT}
                    puff
                    onPuffPlay={openGame}
                  />
                );
              case 'projects':
                return (
                  <ProjectsCell
                    key={section}
                    order={content.ORDER}
                    mediums={content.MEDIUMS}
                    plates={content.PLATE_DATA}
                  />
                );
              case 'photos':
                return (
                  <section
                    key={section}
                    className="photo-gallery"
                    id="photos"
                    aria-label="Photographs"
                  >
                    <div className="photo-gallery-head">
                      <h2 className="kicker">§ PHOTOGRAPHS · 02</h2>
                      <button
                        className="glass-pill photo-shuffle photo-gallery-shuffle"
                        type="button"
                        onClick={photos.shuffle}
                        disabled={photos.busy}
                        aria-busy={photos.busy}
                      >
                        Shuffle photos <span aria-hidden="true">↻</span>
                      </button>
                    </div>
                    {slots[0] && (
                      <PhotoCell
                        slot={slots[0]}
                        incoming={photos.incoming?.[0]}
                        onSettled={photos.onSettled}
                        delay={0}
                        areaClass="cell-photo-a"
                        caption={content.PHOTO_CAPTIONS[slots[0].photo.file]}
                      />
                    )}
                    {slots[1] && (
                      <PhotoCell
                        slot={slots[1]}
                        incoming={photos.incoming?.[1]}
                        onSettled={photos.onSettled}
                        delay={90}
                        areaClass="cell-photo-b"
                        caption={content.PHOTO_CAPTIONS[slots[1].photo.file]}
                      />
                    )}
                    <p className="photo-gallery-status">
                      {photos.busy
                        ? 'Loading the next photographs…'
                        : photos.message.startsWith('Keeping')
                          ? photos.message
                          : 'Two photographs chosen as a pair. Shuffle here to see another pair.'}
                    </p>
                  </section>
                );
              case 'resume':
                return <ResumeCell key={section} resume={content.RESUME} />;
              case 'activity':
                return <StravaCell key={section} />;
            }
          })}
        </main>

        <footer className="bento-topbar">
          <div>randyren.org</div>
          <button className="bento-text-button" type="button" onClick={replayIntro}>
            Return to intro ↑
          </button>
        </footer>
      </div>
      {game && (
        <PuffGame
          key={game.visit}
          trigger={game.trigger}
          direct={game.direct}
          directPage={initialGame}
          onEntered={gameEntered}
          onClose={closeGame}
        />
      )}
    </>
  );
}
