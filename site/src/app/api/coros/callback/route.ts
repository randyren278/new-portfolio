import { exchangeCode } from '@/training/coros/auth';
import { NextResponse } from 'next/server';

/**
 * OAuth callback from Coros. Only completes a flow this site started
 * (state must match the cookie /api/coros/connect set), then stores the
 * tokens where the training page reads them.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) return NextResponse.json({ error: `coros denied: ${error}` }, { status: 400 });

  const cookie = request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith('coros_oauth='));
  let pending: { state: string; verifier: string; clientId: string; redirectUri: string } | null =
    null;
  try {
    pending = cookie ? JSON.parse(decodeURIComponent(cookie.slice('coros_oauth='.length))) : null;
  } catch {
    pending = null;
  }
  const code = url.searchParams.get('code');
  if (!pending || !code || url.searchParams.get('state') !== pending.state) {
    return NextResponse.json({ error: 'no matching connect request' }, { status: 400 });
  }

  try {
    await exchangeCode({
      clientId: pending.clientId,
      redirectUri: pending.redirectUri,
      code,
      verifier: pending.verifier,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
  const res = NextResponse.redirect(new URL('/training', url.origin));
  res.cookies.delete({ name: 'coros_oauth', path: '/api/coros' });
  return res;
}
