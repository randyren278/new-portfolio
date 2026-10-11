import { BentoHome } from '@/bento/BentoHome';
import type { StravaData } from '@/bento/cells/StravaCell';
import { loadShellContent } from '@/content/loader';
import { fetchLatestActivityWithGps } from '@/strava/client';
import { decodePolyline, projectToSvgPath } from '@/strava/polyline';
import { unstable_cache } from 'next/cache';

// Server component: loads content + strava in parallel, hands them to the
// client bento. Strava is best-effort — any failure (no tokens, network,
// 5xx, no GPS activities) collapses to `null` and StravaCell renders its
// hand-drawn fallback polyline.
//
// force-dynamic so photos and content render per request. Strava is cached
// for one minute: the whole app gets 100 Strava reads per 15 minutes, and a
// call per page view would let a burst of visitors exhaust that and blank
// this cell (and /training's routes). A new run still shows within a minute.
export const dynamic = 'force-dynamic';

const latestActivity = unstable_cache(fetchLatestActivityWithGps, ['strava-latest-v1'], {
  revalidate: 60,
});

async function loadStrava(): Promise<StravaData | null> {
  try {
    const activity = await latestActivity();
    if (!activity?.map?.summary_polyline) return null;
    const points = decodePolyline(activity.map.summary_polyline);
    const polylinePath = projectToSvgPath(points, 360, 200, 12);
    return {
      id: activity.id,
      name: activity.name,
      distanceM: activity.distance,
      movingTimeS: activity.moving_time,
      activityType: activity.type,
      polylinePath,
    };
  } catch {
    return null;
  }
}

export default async function Page() {
  const [content, strava] = await Promise.all([loadShellContent(), loadStrava()]);
  return <BentoHome content={content} strava={strava} />;
}
