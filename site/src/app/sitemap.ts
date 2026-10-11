import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.randyren.org/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://www.randyren.org/training', changeFrequency: 'daily', priority: 0.6 },
  ];
}
