/**
 * Persistent store for Strava OAuth tokens, under key `strava_tokens`:
 *   { access_token, refresh_token, expires_at (unix seconds), athlete_id }
 *
 * Strava rotates refresh tokens and invalidates the old one immediately, so
 * this is mutable storage: a local JSON file when STRAVA_TOKEN_FILE is set
 * (for `pnpm dev`), Vercel Edge Config otherwise. See src/auth/store.ts.
 */

import { readStored, writeStored } from '@/auth/store';

export type StravaTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
};

export const readTokens = () => readStored<StravaTokens>('strava_tokens', 'STRAVA_TOKEN_FILE');

export const writeTokens = (tokens: StravaTokens) =>
  writeStored('strava_tokens', 'STRAVA_TOKEN_FILE', tokens);
