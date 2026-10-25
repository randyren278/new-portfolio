import type { TrainingSummary } from '@/bento/cells/StravaCell';
import { loadTrainingView } from '@/training/load';
import { NextResponse } from 'next/server';

/**
 * What the home page shows of /training: the Latest Activity card's run and
 * the three numbers on its "view training status?" plate. Built from the
 * same view /training renders, and not cached at the edge, so the card and
 * the plate never show a run or a number the training page doesn't.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const view = await loadTrainingView();
  if (!view) return NextResponse.json({ error: 'training data unavailable' }, { status: 503 });
  const run = view.outdoor;
  const summary: TrainingSummary = {
    status: view.status?.word ?? null,
    recoveryPct: view.readiness?.pct ?? null,
    km7: Math.round(view.metrics.km7 * 10) / 10,
    run: run?.route ? { km: run.km, sec: run.sec, route: run.route, stravaId: run.stravaId } : null,
  };
  return NextResponse.json(summary, { headers: { 'Cache-Control': 'private, no-store' } });
}
