import type { ComponentType } from 'react';
import type { Slug } from '../projects';

export const platesLoader: Record<Slug, () => Promise<{ default: ComponentType }>> = {
  oryzo: () => import('./oryzo.mdx'),
  halcyon: () => import('./halcyon.mdx'),
  paperlane: () => import('./paperlane.mdx'),
  atlas: () => import('./atlas.mdx'),
  koinu: () => import('./koinu.mdx'),
  linen: () => import('./linen.mdx')
};
