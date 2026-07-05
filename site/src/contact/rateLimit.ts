import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let cached: Ratelimit | null = null;

export function getLimiter(): Ratelimit | null {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cached = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: false,
    prefix: 'randyren:contact'
  });
  return cached;
}
