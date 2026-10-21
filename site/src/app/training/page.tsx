import { loadTrainingView } from '@/training/load';
import { TrainingPage } from '@/training/ui/TrainingPage';
import type { Metadata } from 'next';

// Rendered per request; the data underneath is cached for 15 minutes
// (see src/training/load.ts), so Coros and Strava see a few calls an hour.
export const dynamic = 'force-dynamic';

const title = 'Randy Ren';
const description =
  'How Randy’s running is going: load, recovery, the latest session, live from Coros and Strava.';

// Open Graph and Twitter replace the layout's objects wholesale, so the
// shared image and site name are restated here.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/training' },
  openGraph: {
    title,
    description,
    url: '/training',
    siteName: 'randyren.org',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
};

export default async function Page() {
  const view = await loadTrainingView();
  return <TrainingPage view={view} />;
}
