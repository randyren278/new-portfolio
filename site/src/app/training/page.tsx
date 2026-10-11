import { loadTrainingView } from '@/training/load';
import { TrainingPage } from '@/training/ui/TrainingPage';
import type { Metadata } from 'next';

// Rendered per request; the data underneath is cached for 15 minutes
// (see src/training/load.ts), so Coros and Strava see a few calls an hour.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Training status — Randy Ren',
  description:
    'How Randy’s running is going: load, recovery, the latest session, live from Coros and Strava.',
};

export default async function Page() {
  const view = await loadTrainingView();
  return <TrainingPage view={view} />;
}
