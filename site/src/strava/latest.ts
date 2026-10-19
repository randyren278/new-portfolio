import type { StravaData } from '@/bento/cells/StravaCell';
import { unstable_cache } from 'next/cache';
import { fetchLatestActivityWithGps } from './client';
import { decodePolyline, projectToSvgPath } from './polyline';

const latestActivity = unstable_cache(fetchLatestActivityWithGps, ['strava-latest-v1'], {
  revalidate: 60,
});

export async function loadStrava(): Promise<StravaData | null> {
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
