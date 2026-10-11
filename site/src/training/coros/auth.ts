/**
 * Coros MCP OAuth (authorization code + PKCE, public client).
 *
 * Coros' MCP server publishes standard OAuth metadata with dynamic client
 * registration, so the site registers itself on connect, sends Randy to
 * Coros' consent screen once, and keeps the refresh token in the store.
 * The connect and callback routes are gated by src/auth/connectGate.ts.
 */

import { createHash, randomBytes } from 'node:crypto';
import { readStored, writeStored } from '@/auth/store';

const ISSUER = 'https://mcpus.coros.com';
const RESOURCE = 'https://mcpus.coros.com';
const SCOPE = 'openid mcp.tools offline_access';
const KEY = 'coros_auth';
const FILE_ENV = 'COROS_TOKEN_FILE';

export type CorosAuth = {
  client_id: string;
  redirect_uri: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: number; // unix seconds
};

const b64url = (buf: Buffer) => buf.toString('base64url');

export function pkce() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export async function registerClient(redirectUri: string): Promise<string> {
  const res = await fetch(`${ISSUER}/connect/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'randyren.org training status',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: SCOPE,
    }),
  });
  if (!res.ok)
    throw new Error(`coros client registration failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { client_id: string }).client_id;
}

export function authorizeUrl(p: {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
}): string {
  const url = new URL(`${ISSUER}/oauth2/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', p.clientId);
  url.searchParams.set('redirect_uri', p.redirectUri);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('state', p.state);
  url.searchParams.set('code_challenge', p.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('resource', RESOURCE);
  return url.toString();
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`${ISSUER}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...body, resource: RESOURCE }),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`coros token request failed: ${res.status} ${text}`);
  return JSON.parse(text) as { access_token: string; refresh_token?: string; expires_in?: number };
}

function toAuth(
  t: { access_token: string; refresh_token?: string; expires_in?: number },
  prev: Pick<CorosAuth, 'client_id' | 'redirect_uri'> & { refresh_token?: string | null },
): CorosAuth {
  return {
    client_id: prev.client_id,
    redirect_uri: prev.redirect_uri,
    access_token: t.access_token,
    // Servers that don't rotate omit refresh_token on refresh; keep the old one.
    refresh_token: t.refresh_token ?? prev.refresh_token ?? null,
    expires_at: Math.floor(Date.now() / 1000) + (t.expires_in ?? 3600),
  };
}

export async function exchangeCode(p: {
  clientId: string;
  redirectUri: string;
  code: string;
  verifier: string;
}): Promise<CorosAuth> {
  const t = await tokenRequest({
    grant_type: 'authorization_code',
    code: p.code,
    redirect_uri: p.redirectUri,
    client_id: p.clientId,
    code_verifier: p.verifier,
  });
  const auth = toAuth(t, { client_id: p.clientId, redirect_uri: p.redirectUri });
  await writeStored(KEY, FILE_ENV, auth);
  return auth;
}

/** A valid access token, refreshed (and written back) when within 2 min of expiry. */
export async function getCorosToken(): Promise<string> {
  const auth = await readStored<CorosAuth>(KEY, FILE_ENV);
  if (!auth) throw new Error('coros not connected');
  if (auth.expires_at - Math.floor(Date.now() / 1000) > 120) return auth.access_token;
  if (!auth.refresh_token) throw new Error('coros token expired and no refresh token');
  try {
    const next = toAuth(
      await tokenRequest({
        grant_type: 'refresh_token',
        refresh_token: auth.refresh_token,
        client_id: auth.client_id,
      }),
      auth,
    );
    await writeStored(KEY, FILE_ENV, next);
    return next.access_token;
  } catch (err) {
    // Another instance may have rotated the refresh token a moment ago.
    const latest = await readStored<CorosAuth>(KEY, FILE_ENV);
    if (
      latest &&
      latest.access_token !== auth.access_token &&
      latest.expires_at > Date.now() / 1000 + 60
    ) {
      return latest.access_token;
    }
    throw err;
  }
}
