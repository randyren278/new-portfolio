import { loadStrava } from '@/strava/latest';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await loadStrava(), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
