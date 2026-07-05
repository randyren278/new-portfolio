'use client';
import { ORDER, PROJECTS, type Slug } from '@/content/projects';
import styles from './Chips.module.css';

export type Chip = { l1: string; cmd: string };

export function buildChipSet(cwd: string, visibleSlug: Slug | null): Chip[] {
  if (cwd === '/randy/work') {
    if (visibleSlug) {
      return [
        { l1: 'Open the plate', cmd: `open ${visibleSlug}` },
        { l1: 'Back home', cmd: 'cd ~' }
      ];
    }
    return ORDER.map((s) => ({ l1: `Open ${PROJECTS[s].slug}`, cmd: `open ${s}` }));
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
      {chips.map((c) => (
        <button
          key={c.cmd}
          className={styles.chip}
          onClick={() => onRun(c.cmd)}
          type="button"
        >
          <span className={styles.l1}>{c.l1}</span>
          <span className={styles.cmd}>{c.cmd}</span>
        </button>
      ))}
    </div>
  );
}
