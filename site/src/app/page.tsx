import { BentoHome } from '@/bento/BentoHome';
import type { StravaData } from '@/bento/cells/StravaCell';
import { loadShellContent } from '@/content/loader';
import { fetchLatestActivityWithGps } from '@/strava/client';
import { decodePolyline, projectToSvgPath } from '@/strava/polyline';

// Server component: loads content + strava in parallel, hands them to the
// client bento. Strava is best-effort — any failure (no tokens, network,
// 5xx, no GPS activities) collapses to `null` and StravaCell renders its
// hand-drawn fallback polyline.
//
// force-dynamic + no-store on the strava fetch means every page load hits
// Strava fresh, so a new activity shows up on the next refresh (no 15-min
// cache to wait out).
export const dynamic = 'force-dynamic';

async function loadStrava(): Promise<StravaData | null> {
  try {
    const activity = await fetchLatestActivityWithGps();
    if (!activity?.map?.summary_polyline) return null;
    const points = decodePolyline(activity.map.summary_polyline);
    const polylinePath = projectToSvgPath(points, 360, 200, 12);
    return {
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
