import { loadTrainingView } from '@/training/load';
import { NextResponse } from 'next/server';

/**
 * The three numbers the home page's "view training status?" plate shows.
 * Reads the same 15-minute caches as /training, so asking costs nothing.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const view = await loadTrainingView();
  if (!view) return NextResponse.json({ error: 'training data unavailable' }, { status: 503 });
  return NextResponse.json(
    {
      status: view.status?.word ?? null,
      recoveryPct: view.readiness?.pct ?? null,
      km7: Math.round(view.metrics.km7 * 10) / 10,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
