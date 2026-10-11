import { timingSafeEqual } from 'node:crypto';
import { authorizeUrl, pkce, registerClient } from '@/training/coros/auth';
import { NextResponse } from 'next/server';

/**
 * One-time bootstrap: /api/coros/connect?key=<COROS_CONNECT_KEY>
 *
 * Registers this site with Coros' OAuth server, then sends the browser to
 * Coros' consent screen. The key gate matters: whoever completes this flow
 * decides whose Coros data the training page shows.
 */
export async function GET(request: Request) {
  const expected = process.env.COROS_CONNECT_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'COROS_CONNECT_KEY is not configured' }, { status: 500 });
  }
  const url = new URL(request.url);
  const key = Buffer.from(url.searchParams.get('key') ?? '');
  const want = Buffer.from(expected);
  if (key.length !== want.length || !timingSafeEqual(key, want)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const redirectUri = `${url.origin}/api/coros/callback`;
  try {
    const clientId = await registerClient(redirectUri);
    const { verifier, challenge, state } = pkce();
    const res = NextResponse.redirect(authorizeUrl({ clientId, redirectUri, state, challenge }));
    res.cookies.set('coros_oauth', JSON.stringify({ state, verifier, clientId, redirectUri }), {
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 600,
      path: '/api/coros',
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
