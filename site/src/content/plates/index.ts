import type { ComponentType } from 'react';
import type { Slug } from '../projects';

export const platesLoader: Record<Slug, () => Promise<{ default: ComponentType }>> = {
  oryzo: () => import('./oryzo.mdx'),
  halcyon: () => import('./halcyon.mdx'),
  aperture: () => import('./aperture.mdx'),
  fieldnote: () => import('./fieldnote.mdx'),
  'signal-garden': () => import('./signal-garden.mdx'),
  loom: () => import('./loom.mdx')
};
