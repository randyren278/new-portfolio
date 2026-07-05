import { NextResponse } from 'next/server';
import { fetchLatestActivityWithGps } from '@/strava/client';
import { decodePolyline, projectToSvgPath } from '@/strava/polyline';

/**
 * Public endpoint the museum shell calls when the user types `latest`.
 *
 * Returns the most recent GPS-bearing activity, with the polyline already
 * projected server-side into a 360×200 SVG viewBox path. The client just
 * drops it into a <path d="..."> — no math on the browser side.
 *
 * Response cached for 15min by Next.js data-cache (see client.ts).
 */
export async function GET() {
  try {
    const activity = await fetchLatestActivityWithGps();
    if (!activity) {
      return NextResponse.json({ error: 'no gps activities found' }, { status: 404 });
    }
    const polyline = activity.map.summary_polyline!;
    const points = decodePolyline(polyline);
    const path = projectToSvgPath(points, 360, 200, 12);

    return NextResponse.json({
      id: activity.id,
      name: activity.name,
      distanceM: activity.distance,
      movingTimeS: activity.moving_time,
      startDate: activity.start_date,
      activityType: activity.type,
      polylinePath: path,
    });
  } catch (e: any) {
    // Distinguish "not connected" from real failures — the shell will show
    // a friendlier hint in the former case.
    const msg = e.message ?? String(e);
    const status = msg.includes('not connected') ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
