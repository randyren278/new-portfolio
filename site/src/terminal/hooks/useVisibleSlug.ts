'use client';
import { useCallback, useRef, useState } from 'react';
import type { Slug } from '@/content/projects';

export function useVisibleSlug() {
  const setRef = useRef<Set<Slug>>(new Set());
  const [visibleSlugs, setVisibleSlugs] = useState<Set<Slug>>(setRef.current);
  const onChange = useCallback((slug: Slug, isVisible: boolean) => {
    if (isVisible) setRef.current.add(slug);
    else setRef.current.delete(slug);
    setVisibleSlugs(new Set(setRef.current));
  }, []);
  return { visibleSlugs, onChange };
}
