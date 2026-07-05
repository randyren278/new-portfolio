'use client';
import { Suspense, lazy, useCallback, useEffect, useMemo } from 'react';
import { platesLoader } from '@/content/plates';
import { PROJECTS, type Slug } from '@/content/projects';
import styles from './PlateViewer.module.css';

export function PlateViewer({ slug, onClose }: { slug: Slug; onClose: () => void }) {
  const Plate = useMemo(() => lazy(platesLoader[slug]), [slug]);
  const p = PROJECTS[slug];

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Backspace') {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (active?.isContentEditable ?? false);
      if (!isEditable) {
        e.preventDefault();
        onClose();
      }
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={`${p.slug} plate`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} type="button" aria-label="Close plate (Esc)">×</button>
        <article className={styles.article}>
          <Suspense fallback={<div className={styles.loading}>loading…</div>}>
            <Plate />
          </Suspense>
        </article>
        <div className={styles.footer}>PRESS ESC OR × TO RETURN TO THE SHELL</div>
      </div>
    </div>
  );
}
