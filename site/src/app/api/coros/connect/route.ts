import { newState, refuseWithoutKey, rememberFlow } from '@/auth/connectGate';
import { authorizeUrl, pkce, registerClient } from '@/training/coros/auth';
import { NextResponse } from 'next/server';

/**
 * One-time bootstrap: /api/coros/connect?key=<CONNECT_KEY>
 *
 * Registers this site with Coros' OAuth server, then sends the browser to
 * Coros' consent screen. See src/auth/connectGate.ts for why it's gated.
 */
export async function GET(request: Request) {
  const refused = refuseWithoutKey(request);
  if (refused) return refused;

  const redirectUri = `${new URL(request.url).origin}/api/coros/callback`;
  try {
    const clientId = await registerClient(redirectUri);
    const { verifier, challenge } = pkce();
    const state = newState();
    const res = NextResponse.redirect(authorizeUrl({ clientId, redirectUri, state, challenge }));
    return rememberFlow(res, 'coros', { state, verifier, clientId, redirectUri }, request);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
}
