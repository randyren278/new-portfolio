import { newState, refuseWithoutKey, rememberFlow } from '@/auth/connectGate';
import { NextResponse } from 'next/server';

/**
 * One-time bootstrap: /api/strava/connect?key=<CONNECT_KEY>
 * Redirects to Strava's OAuth consent screen; Strava calls back to
 * /api/strava/callback with a `code`. See src/auth/connectGate.ts for why
 * it's gated.
 *
 * Only needs to be visited once ever — token refresh happens automatically
 * thereafter (as long as the athlete doesn't revoke access at strava.com).
 */
export async function GET(request: Request) {
  const refused = refuseWithoutKey(request);
  if (refused) return refused;

  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirect = process.env.STRAVA_REDIRECT_URI;
  if (!clientId || !redirect) {
    return NextResponse.json(
      { error: 'missing STRAVA_CLIENT_ID or STRAVA_REDIRECT_URI env var' },
      { status: 500 },
    );
  }

  const state = newState();
  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('approval_prompt', 'auto');
  url.searchParams.set('scope', 'read,activity:read');
  url.searchParams.set('state', state);

  return rememberFlow(NextResponse.redirect(url.toString()), 'strava', { state }, request);
}
