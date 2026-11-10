import { type TrainingView, fmtDow } from '@/training/derive';
import { loadTrainingView } from '@/training/load';
import { TrainingPage } from '@/training/ui/TrainingPage';
import type { Metadata } from 'next';

// Rendered per request; the data underneath is cached for 15 minutes
// (see src/training/load.ts), so Coros and Strava see a few calls an hour.
export const dynamic = 'force-dynamic';

const title = 'Randy Ren';
const description =
  'How Randy’s running is going: load, recovery and the latest run, live from Coros and Strava.';

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

// Serialize the label once: server and browser timezone databases can differ.
function syncedLabel(view: TrainingView) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(view.asOf));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  return `Updated · ${fmtDow(date)} · ${part('hour')}:${part('minute')} PT`;
}

export default async function Page() {
  const view = await loadTrainingView();
  return <TrainingPage view={view} updatedLabel={view ? syncedLabel(view) : 'Not synced'} />;
}
