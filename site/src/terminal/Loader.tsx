'use client';
import { useEffect, useRef, useState } from 'react';
import { LOADER } from './reveal/cadences';
import { useReducedMotion } from './hooks/useReducedMotion';
import styles from './Loader.module.css';

type Phase = 'counting' | 'holding' | 'dissolving' | 'gone';

type LogLine = { threshold: number; text: string; cls: 'lg-dim' | 'lg-ok' };

const LINES: LogLine[] = [
  { threshold:  4, text: '[randy.sh] museum shell v0.9', cls: 'lg-dim' },
  { threshold: 12, text: 'linking /usr/lib/agents..done', cls: 'lg-dim' },
  { threshold: 22, text: 'mounting /work (6 volumes)..done', cls: 'lg-dim' },
  { threshold: 34, text: 'reading /randy/.order..done', cls: 'lg-dim' },
  { threshold: 44, text: 'unlocking rooms i–vi..ok', cls: 'lg-ok' },
  { threshold: 56, text: 'opening gallery hours..done', cls: 'lg-dim' },
  { threshold: 66, text: 'loading typeface: Instrument Serif..done', cls: 'lg-dim' },
  { threshold: 76, text: 'loading typeface: IBM Plex Mono..done', cls: 'lg-dim' },
  { threshold: 84, text: 'curator on shift..ok', cls: 'lg-ok' },
  { threshold: 92, text: 'sourcing ~/.randyrc..done', cls: 'lg-dim' },
  { threshold: 98, text: 'ready.', cls: 'lg-ok' },
];

export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<Phase>('counting');
  const [logCount, setLogCount] = useState(0);
  const phaseRef = useRef<Phase>('counting');

  useEffect(() => {
    if (reduced) { onDone(); return; }
    let raf = 0;
    const start = performance.now();
    let skipped = false;
    let t1: ReturnType<typeof setTimeout> | null = null;
    let t2: ReturnType<typeof setTimeout> | null = null;
    let emitted = 0;

    const skip = () => { skipped = true; };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / LOADER.duration);
      let eased: number;
      if (t < 0.4) eased = t * 1.25;
      else if (t < 0.75) eased = 0.50 + (t - 0.4) * 0.71;
      else eased = 0.75 + (t - 0.75) * 1.0;
      const p = skipped ? 1 : Math.min(1, eased);
      const currentPct = Math.floor(p * 100);
      setPct(currentPct);
      while (emitted < LINES.length && currentPct >= (LINES[emitted] as LogLine).threshold) {
        emitted++;
      }
      setLogCount(emitted);
      if ((skipped || t >= 1) && phaseRef.current === 'counting') {
        if (emitted < LINES.length) {
          emitted = LINES.length;
          setLogCount(LINES.length);
        }
        phaseRef.current = 'holding';
        setPhase('holding');
        t1 = setTimeout(() => { phaseRef.current = 'dissolving'; setPhase('dissolving'); }, LOADER.hold);
        t2 = setTimeout(() => { phaseRef.current = 'gone'; setPhase('gone'); onDone(); }, LOADER.hold + LOADER.dissolve);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); window.removeEventListener('keydown', skip); window.removeEventListener('pointerdown', skip); };
  }, [reduced, onDone]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`${styles.wrap} ${phase === 'dissolving' ? styles.fade : ''}`}
      aria-hidden={phase === 'dissolving'}
    >
      <div className={styles.stack}>
        <div className={styles.label}>catalog</div>
        <div className={styles.counter}>{String(pct).padStart(3, '0')}<span className={styles.pct}>%</span></div>
        <div className={styles.log}>
          {LINES.slice(0, logCount).map((line, i) => (
            <span key={i} className={`${styles.line} ${line.cls === 'lg-ok' ? styles.ok : styles.dim}`}>
              {line.text}
            </span>
          ))}
        </div>
        <div className={styles.hint}>press any key to skip</div>
      </div>
    </div>
  );
}
