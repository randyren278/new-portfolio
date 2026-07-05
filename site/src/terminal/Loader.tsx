'use client';
import { useEffect, useRef, useState } from 'react';
import { LOADER } from './reveal/cadences';
import { useReducedMotion } from './hooks/useReducedMotion';
import styles from './Loader.module.css';

type Phase = 'counting' | 'holding' | 'dissolving' | 'gone';

export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<Phase>('counting');
  const phaseRef = useRef<Phase>('counting');

  useEffect(() => {
    if (reduced) { onDone(); return; }
    let raf = 0;
    const start = performance.now();
    let skipped = false;

    const skip = () => { skipped = true; };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / LOADER.duration);
      setPct(Math.round((skipped ? 1 : t) * 100));
      if ((skipped || t >= 1) && phaseRef.current === 'counting') {
        phaseRef.current = 'holding';
        setPhase('holding');
        setTimeout(() => { phaseRef.current = 'dissolving'; setPhase('dissolving'); }, LOADER.hold);
        setTimeout(() => { phaseRef.current = 'gone'; setPhase('gone'); onDone(); }, LOADER.hold + LOADER.dissolve);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', skip); window.removeEventListener('pointerdown', skip); };
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
        <div className={styles.hint}>press any key to skip</div>
      </div>
    </div>
  );
}
