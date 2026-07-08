/**
 * Strava API client — OAuth token exchange, token refresh, activity fetch.
 * All calls hit https://www.strava.com/api/v3 or /oauth.
 */

import { readTokens, writeTokens, type StravaTokens } from './tokenStore';

const OAUTH_BASE = 'https://www.strava.com/oauth';
const API_BASE = 'https://www.strava.com/api/v3';

function creds() {
  const client_id = process.env.STRAVA_CLIENT_ID;
  const client_secret = process.env.STRAVA_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    throw new Error('missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET');
  }
  return { client_id, client_secret };
}

/** Exchange the OAuth `code` from the callback for initial tokens. */
export async function exchangeCode(code: string): Promise<StravaTokens> {
  const { client_id, client_secret } = creds();
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id,
      client_secret,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    throw new Error(`strava token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: { id: number };
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete.id,
  };
}

/** Refresh an expired access token. Writes the new pair back to the store. */
async function refreshTokens(current: StravaTokens): Promise<StravaTokens> {
  const { client_id, client_secret } = creds();
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id,
      client_secret,
      refresh_token: current.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`strava refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  const next: StravaTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token, // may be same as before, may rotate
    expires_at: data.expires_at,
    athlete_id: current.athlete_id,
  };
  await writeTokens(next);
  return next;
}

/** Get a valid access token; refresh if the current one is expired. */
async function getAccessToken(): Promise<string> {
  const tokens = await readTokens();
  if (!tokens) throw new Error('strava not connected — visit /api/strava/connect');
  const now = Math.floor(Date.now() / 1000);
  // Refresh with a 60s safety window.
  if (tokens.expires_at - now < 60) {
    const fresh = await refreshTokens(tokens);
    return fresh.access_token;
  }
  return tokens.access_token;
}

export type StravaActivity = {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  type: string;
  start_date: string; // ISO
  map: { summary_polyline: string | null };
  // Strava emits 'everyone' | 'followers_only' | 'only_me' on newer
  // activities. Older ones may omit the field entirely — default to
  // 'everyone' so we don't silently hide a legit public activity.
  visibility?: 'everyone' | 'followers_only' | 'only_me';
};

/**
 * Fetch the most recent PUBLIC activity with a GPS polyline. Indoor /
 * treadmill / manual entries return `map.summary_polyline: null` and are
 * skipped, as are activities set to Followers Only or Only Me on Strava.
 */
export async function fetchLatestActivityWithGps(): Promise<StravaActivity | null> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/athlete/activities?per_page=30`, {
    headers: { Authorization: `Bearer ${token}` },
    // Cache the raw Strava response for 15 min at the Next.js data-cache layer.
    // This is what makes /api/strava/latest instant on repeat calls without
    // us needing a KV store.
    next: { revalidate: 900 },
  });
  if (!res.ok) {
    throw new Error(`strava activities fetch failed: ${res.status} ${await res.text()}`);
  }
  const activities = (await res.json()) as StravaActivity[];
  return (
    activities.find(
      (a) => !!a.map?.summary_polyline && (a.visibility ?? 'everyone') === 'everyone',
    ) ?? null
  );
}
