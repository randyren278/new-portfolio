'use client';
import { useEffect, useRef } from 'react';
import { PROJECTS, type Slug } from '@/content/projects';
import { CADENCES } from './reveal/cadences';
import { traceCorners } from './reveal/cornerTrace';
import { typeInto } from './reveal/typewriter';
import styles from './InlineLabel.module.css';

type Props = {
  slug: Slug;
  instant?: boolean;
  onVisibilityChange?: (slug: Slug, visible: boolean) => void;
};

export function InlineLabel({ slug, instant = false, onVisibilityChange }: Props) {
  const p = PROJECTS[slug];
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const kickerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const mediumRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const blurbRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onVisibilityChange || !rootRef.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => onVisibilityChange(slug, e.isIntersecting)),
      { threshold: 0.25 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [slug, onVisibilityChange]);

  useEffect(() => {
    if (instant || !svgRef.current) return;
    const svg = svgRef.current;
    const ac = new AbortController();
    (async () => {
      await traceCorners(svg, {
        onContent: async () => {
          if (kickerRef.current) await typeInto(kickerRef.current, p.kicker, { msPerChar: CADENCES.kicker, signal: ac.signal }).done;
          if (titleRef.current) await typeInto(titleRef.current, p.title, { msPerChar: CADENCES.title, signal: ac.signal }).done;
          if (artistRef.current) await typeInto(artistRef.current, `Artist       ${p.artist}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (yearRef.current) await typeInto(yearRef.current, `Year         ${p.year}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (mediumRef.current) await typeInto(mediumRef.current, `Medium       ${p.medium}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (dimRef.current) await typeInto(dimRef.current, `Dimensions   ${p.dim}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (collectionRef.current) await typeInto(collectionRef.current, `Collection   ${p.collection}`, { msPerChar: CADENCES.metaDt, signal: ac.signal }).done;
          if (blurbRef.current) await typeInto(blurbRef.current, p.blurb, { msPerChar: CADENCES.blurb, signal: ac.signal }).done;
          if (hintRef.current) {
            hintRef.current.innerHTML = p.hint;
          }
        },
        signal: ac.signal
      });
    })();
    return () => ac.abort();
  }, [slug, instant, p]);

  return (
    <div ref={rootRef} className={styles.card} data-inline-slug={slug}>
      <svg ref={svgRef} className={styles.frame} aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="corner" d="M0 12 L0 0 L12 0" />
        <path className="corner" d="M88 0 L100 0 L100 12" />
        <path className="corner" d="M100 88 L100 100 L88 100" />
        <path className="corner" d="M12 100 L0 100 L0 88" />
      </svg>
      <div className={styles.body}>
        {instant ? (
          <>
            <div className={styles.kicker}>{p.kicker}</div>
            <div className={styles.title}>{p.title}</div>
            <div className={styles.meta}>{`Artist       ${p.artist}`}</div>
            <div className={styles.meta}>{`Year         ${p.year}`}</div>
            <div className={styles.meta}>{`Medium       ${p.medium}`}</div>
            <div className={styles.meta}>{`Dimensions   ${p.dim}`}</div>
            <div className={styles.meta}>{`Collection   ${p.collection}`}</div>
            <div className={styles.blurb}>{p.blurb}</div>
            <div className={styles.hint} dangerouslySetInnerHTML={{ __html: p.hint }} />
          </>
        ) : (
          <>
            <div ref={kickerRef} className={styles.kicker} />
            <div ref={titleRef} className={styles.title} />
            <div ref={artistRef} className={styles.meta} />
            <div ref={yearRef} className={styles.meta} />
            <div ref={mediumRef} className={styles.meta} />
            <div ref={dimRef} className={styles.meta} />
            <div ref={collectionRef} className={styles.meta} />
            <div ref={blurbRef} className={styles.blurb} />
            <div ref={hintRef} className={styles.hint} />
          </>
        )}
      </div>
    </div>
  );
}
