import { forgetFlow, recallFlow } from '@/auth/connectGate';
import { exchangeCode } from '@/training/coros/auth';
import { NextResponse } from 'next/server';

/**
 * OAuth callback from Coros. Only completes a flow /api/coros/connect
 * started, then stores the tokens where the training page reads them.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) return NextResponse.json({ error: `coros denied: ${error}` }, { status: 400 });

  const flow = recallFlow<{
    state: string;
    verifier: string;
    clientId: string;
    redirectUri: string;
  }>(request, 'coros');
  const code = url.searchParams.get('code');
  if (!flow || !code) {
    return NextResponse.json({ error: 'no matching connect request' }, { status: 400 });
  }

  try {
    await exchangeCode({
      clientId: flow.clientId,
      redirectUri: flow.redirectUri,
      code,
      verifier: flow.verifier,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }
  return forgetFlow(NextResponse.redirect(new URL('/training', url.origin)), 'coros');
}
