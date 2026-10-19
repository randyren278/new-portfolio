/**
 * Durable stale-while-revalidate cache for the training sources (server only).
 *
 * The last good Coros and Strava bundles live in Postgres: the
 * randyren_site.training_cache table in Supabase, reached through
 * TRAINING_CACHE_URL as a role that can read and write that table and
 * nothing else. A visit reads one row and never waits on Coros once the row
 * exists: past maxAge the row is still served, and the refresh runs after
 * the response. Unlike Next's data cache, rows survive deploys, so the first
 * visitor after a deploy no longer waits on a cold Coros fetch.
 *
 * One refresher at a time across every instance: a refresh first claims the
 * row (refresh_started_at), and a claim older than two minutes is presumed
 * dead. A failed refresh leaves the old row in place.
 *
 * Without TRAINING_CACHE_URL (local dev), or when Postgres can't be reached,
 * an in-process cache with the same lifetime stands in.
 */

import { after } from 'next/server';
import pg from 'pg';

let pool: pg.Pool | null | undefined;

function db(): pg.Pool | null {
  if (pool === undefined) {
    const url = process.env.TRAINING_CACHE_URL;
    // The URL must not carry sslmode: pg lets it override this ssl config.
    pool = url
      ? new pg.Pool({
          connectionString: url,
          ssl: { ca: SUPABASE_ROOT_CA },
          max: 3,
          connectionTimeoutMillis: 2500,
          idleTimeoutMillis: 10_000,
          query_timeout: 5000,
        })
      : null;
    // A pooled client the pooler drops while idle must not crash the function.
    pool?.on('error', (err) => console.error('[training-cache] idle client:', err.message));
  }
  return pool;
}

const msg = (err: unknown) => (err instanceof Error ? err.message : String(err));

const pending = new Map<string, Promise<unknown>>();

/** Share the whole read/populate operation among same-process callers. */
export function cached<T>(key: string, maxAgeSec: number, fetch: () => Promise<T>): Promise<T> {
  const hit = pending.get(key);
  if (hit) return hit as Promise<T>;
  const value = readCached(key, maxAgeSec, fetch).finally(() => pending.delete(key));
  pending.set(key, value);
  return value;
}

async function readCached<T>(key: string, maxAgeSec: number, fetch: () => Promise<T>): Promise<T> {
  const conn = db();
  if (!conn) return local(key, maxAgeSec, fetch);
  let row: { value: T; stale: boolean } | undefined;
  try {
    const res = await conn.query(
      `select value, fetched_at < now() - make_interval(secs => $2) as stale
         from randyren_site.training_cache where key = $1`,
      [key, maxAgeSec],
    );
    row = res.rows[0];
  } catch (err) {
    console.error(`[training-cache] read ${key}:`, msg(err));
    return local(key, maxAgeSec, fetch);
  }
  if (!row) {
    const value = await fetch();
    await put(conn, key, value).catch((err) =>
      console.error(`[training-cache] write ${key}:`, msg(err)),
    );
    return value;
  }
  if (row.stale) after(() => refresh(conn, key, maxAgeSec, fetch));
  return row.value;
}

async function refresh<T>(
  conn: pg.Pool,
  key: string,
  maxAgeSec: number,
  fetch: () => Promise<T>,
): Promise<void> {
  try {
    const claim = await conn.query(
      `update randyren_site.training_cache set refresh_started_at = now()
        where key = $1
          and fetched_at < now() - make_interval(secs => $2)
          and (refresh_started_at is null or refresh_started_at < now() - interval '2 minutes')`,
      [key, maxAgeSec],
    );
    // Fresh again, or another instance holds the claim.
    if (claim.rowCount === 0) return;
    await put(conn, key, await fetch());
  } catch (err) {
    console.error(`[training-cache] refresh ${key}:`, msg(err));
  }
}

function put(conn: pg.Pool, key: string, value: unknown) {
  // Stringified: pg would send a top-level array as a Postgres array.
  return conn.query(
    `insert into randyren_site.training_cache (key, value) values ($1, $2)
     on conflict (key) do update
       set value = excluded.value, fetched_at = now(), refresh_started_at = null`,
    [key, JSON.stringify(value)],
  );
}

const memory = new Map<string, { at: number; value: Promise<unknown> }>();

/** The in-process stand-in: same lifetime, one fetch at a time, no stale serving. */
function local<T>(key: string, maxAgeSec: number, fetch: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < maxAgeSec * 1000) return hit.value as Promise<T>;
  const value = fetch();
  memory.set(key, { at: Date.now(), value });
  value.catch(() => memory.delete(key));
  return value;
}

// Supabase Root 2021 CA (valid to 2031-04-26), which signs the pooler's
// *.pooler.supabase.com certificate. Pinned so the connection is verified,
// not merely encrypted.
const SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;
