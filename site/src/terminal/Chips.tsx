'use client';
import { Fragment } from 'react';
import { ORDER, type Slug } from '@/content/projects';
import styles from './Chips.module.css';

export type Chip = { l1: string; cmd: string };

function formatTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function buildChipSet(cwd: string, visibleSlugs: Set<Slug>): Chip[] {
  if (cwd === '/randy/work') {
    if (visibleSlugs.size > 0) {
      const target = Array.from(visibleSlugs).at(-1)!;
      return [
        { l1: 'Open the plate', cmd: `open ${target}` },
        { l1: 'Back home', cmd: 'cd ~' }
      ];
    }
    return ORDER.map((s) => ({ l1: `Open ${formatTitle(s)}`, cmd: `open ${s}` }));
  }
  if (cwd === '/randy') {
    return [
      { l1: 'See work', cmd: 'cd work' },
      { l1: 'About', cmd: 'open about' },
      { l1: 'Get in touch', cmd: 'open contact' }
    ];
  }
  if (cwd.startsWith('/randy/work/')) {
    const slug = cwd.split('/').pop() as Slug;
    return [
      { l1: 'Open the plate', cmd: `open ${slug}` },
      { l1: 'Back to work', cmd: 'cd ~/work' }
    ];
  }
  return [{ l1: 'Back home', cmd: 'cd ~' }];
}

export function Chips({ chips, onRun }: { chips: Chip[]; onRun: (cmd: string) => void }) {
  return (
    <div className={styles.row} role="group" aria-label="Suggested commands">
      {chips.map((c, i) => (
        <Fragment key={c.cmd}>
          {i > 0 && (
            <span className={styles.chipSep} aria-hidden="true">
              ·
            </span>
          )}
          <button className={styles.chip} onClick={() => onRun(c.cmd)} type="button">
            <span className={styles.l1}>{c.l1}</span>
            <span className={styles.cmd}>{c.cmd}</span>
          </button>
        </Fragment>
      ))}
    </div>
  );
}
