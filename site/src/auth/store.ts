/**
 * A small persistent JSON store for OAuth state (Strava and Coros tokens).
 * Refresh tokens rotate, so this has to be mutable and shared by every
 * instance. Two backends:
 *
 * - **local** (the named file env var is set) — JSON file. For `pnpm dev`.
 * - **edge-config** — Vercel Edge Config. Reads via the SDK; writes via the
 *   REST API with VERCEL_TOKEN + EDGE_CONFIG_ID (already set for Strava).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { get as edgeGet } from '@vercel/edge-config';

export async function readStored<T>(key: string, fileEnv: string): Promise<T | null> {
  const file = process.env[fileEnv];
  if (file) {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }
  return ((await edgeGet<T>(key)) as T | undefined) ?? null;
}

export async function writeStored(key: string, fileEnv: string, value: unknown): Promise<void> {
  const file = process.env[fileEnv];
  if (file) {
    await writeFile(file, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    return;
  }
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!edgeConfigId || !vercelToken) {
    throw new Error('edge-config write requires EDGE_CONFIG_ID and VERCEL_TOKEN env vars');
  }
  const url = new URL(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key, value }] }),
  });
  if (!res.ok) throw new Error(`edge-config write failed: ${res.status} ${await res.text()}`);
}
