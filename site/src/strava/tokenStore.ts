/**
 * Persistent store for Strava OAuth tokens.
 *
 * Strava rotates refresh tokens and invalidates the old one immediately, so
 * we need mutable, persistent storage. Two backends:
 *
 * - **local** (`STRAVA_TOKEN_FILE` set) — JSON file at that path. For `pnpm dev`.
 * - **edge-config** (`EDGE_CONFIG` + `VERCEL_TOKEN` + `EDGE_CONFIG_ID` set) —
 *   Vercel Edge Config. Reads via the SDK (~ms globally); writes via REST API
 *   (a few seconds to propagate — fine, refreshes are ~4x/day).
 *
 * Both stores hold the same shape under key `strava_tokens`:
 *   { access_token, refresh_token, expires_at (unix seconds), athlete_id }
 */

import { get as edgeGet } from '@vercel/edge-config';
import { readFile, writeFile } from 'node:fs/promises';

export type StravaTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
};

const KEY = 'strava_tokens';

function backend(): 'local' | 'edge-config' {
  return process.env.STRAVA_TOKEN_FILE ? 'local' : 'edge-config';
}

export async function readTokens(): Promise<StravaTokens | null> {
  if (backend() === 'local') {
    try {
      const raw = await readFile(process.env.STRAVA_TOKEN_FILE!, 'utf8');
      return JSON.parse(raw) as StravaTokens;
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  const value = await edgeGet<StravaTokens>(KEY);
  return value ?? null;
}

export async function writeTokens(tokens: StravaTokens): Promise<void> {
  if (backend() === 'local') {
    await writeFile(process.env.STRAVA_TOKEN_FILE!, JSON.stringify(tokens, null, 2), 'utf8');
    return;
  }

  // Edge Config writes go through the Vercel REST API.
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID; // optional
  if (!edgeConfigId || !vercelToken) {
    throw new Error('edge-config write requires EDGE_CONFIG_ID and VERCEL_TOKEN env vars');
  }

  const url = new URL(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`);
  if (teamId) url.searchParams.set('teamId', teamId);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: KEY, value: tokens }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`edge-config write failed: ${res.status} ${body}`);
  }
}
