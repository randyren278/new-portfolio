'use client';
import { useCallback, useRef, useState } from 'react';
import type { Slug } from '@/content/projects';

export function useVisibleSlug() {
  const [visible, setVisible] = useState<Slug | null>(null);
  const map = useRef<Map<Slug, boolean>>(new Map());
  const onChange = useCallback((slug: Slug, isVisible: boolean) => {
    map.current.set(slug, isVisible);
    const first = Array.from(map.current.entries()).find(([, v]) => v)?.[0] ?? null;
    setVisible(first);
  }, []);
  return { visible, onChange };
}
