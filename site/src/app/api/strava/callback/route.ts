import { NextResponse } from 'next/server';
import { exchangeCode } from '@/strava/client';
import { writeTokens } from '@/strava/tokenStore';

/**
 * OAuth callback from Strava's consent screen.
 * Exchanges the short-lived `code` for the initial (access, refresh) pair
 * and persists it in the token store.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const err = url.searchParams.get('error');

  if (err) {
    return NextResponse.json({ error: `strava denied: ${err}` }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'missing code' }, { status: 400 });
  }

  try {
    const tokens = await exchangeCode(code);
    await writeTokens(tokens);
    return NextResponse.json({
      ok: true,
      athlete_id: tokens.athlete_id,
      expires_at: tokens.expires_at,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
