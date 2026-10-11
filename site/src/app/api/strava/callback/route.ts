import { forgetFlow, recallFlow } from '@/auth/connectGate';
import { exchangeCode } from '@/strava/client';
import { writeTokens } from '@/strava/tokenStore';
import { NextResponse } from 'next/server';

/**
 * OAuth callback from Strava's consent screen. Only completes a flow
 * /api/strava/connect started; exchanges the short-lived `code` for the
 * initial (access, refresh) pair and persists it in the token store.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error');

  if (err) {
    return NextResponse.json({ error: `strava denied: ${err}` }, { status: 400 });
  }
  if (!code || !recallFlow(request, 'strava')) {
    return NextResponse.json({ error: 'no matching connect request' }, { status: 400 });
  }

  try {
    const tokens = await exchangeCode(code);
    await writeTokens(tokens);
    return forgetFlow(
      NextResponse.json({ ok: true, athlete_id: tokens.athlete_id, expires_at: tokens.expires_at }),
      'strava',
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
