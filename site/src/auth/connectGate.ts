/**
 * Gate for the one-time OAuth bootstraps (/api/strava/connect and
 * /api/coros/connect).
 *
 * Whoever completes one of those flows decides whose account the site
 * shows, so starting one requires `?key=<CONNECT_KEY>`, and a callback only
 * completes a flow whose `state` matches the cookie its gated start set.
 * Without the second half, anyone could run the provider's consent screen
 * for this site's (public) client id and land their own code on the callback.
 */

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

type Provider = 'strava' | 'coros';

/** A 403/500 response if the request may not start a flow, else null. */
export function refuseWithoutKey(request: Request): NextResponse | null {
  const expected = process.env.CONNECT_KEY;
  if (!expected) {
    return NextResponse.json({ error: 'CONNECT_KEY is not configured' }, { status: 500 });
  }
  const given = Buffer.from(new URL(request.url).searchParams.get('key') ?? '');
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}

export const newState = () => randomBytes(16).toString('base64url');

/** Remember a started flow (state + whatever the callback needs) for ten minutes. */
export function rememberFlow(
  res: NextResponse,
  provider: Provider,
  flow: { state: string } & Record<string, string>,
  request: Request,
) {
  res.cookies.set(`${provider}_oauth`, JSON.stringify(flow), {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
    path: `/api/${provider}`,
  });
  return res;
}

/** The flow this callback belongs to, or null if it isn't one we started. */
export function recallFlow<T extends { state: string }>(
  request: Request,
  provider: Provider,
): T | null {
  const prefix = `${provider}_oauth=`;
  const raw = request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(prefix));
  if (!raw) return null;
  try {
    const flow = JSON.parse(decodeURIComponent(raw.slice(prefix.length))) as T;
    const state = new URL(request.url).searchParams.get('state');
    return state && flow.state === state ? flow : null;
  } catch {
    return null;
  }
}

export function forgetFlow(res: NextResponse, provider: Provider) {
  res.cookies.delete({ name: `${provider}_oauth`, path: `/api/${provider}` });
  return res;
}
