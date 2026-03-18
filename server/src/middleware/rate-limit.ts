import type { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory sliding window rate limiter.
 * For production behind a load balancer, replace with Redis-backed rate limiting.
 */
const buckets = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimitMiddleware(opts: {
  /** A function that returns the key to rate limit on (e.g., IP, email, user ID) */
  keyFn: (c: Context) => string;
  /** Maximum requests within the window */
  max: number;
  /** Window in seconds */
  windowSec: number;
}) {
  return async (c: Context, next: Next) => {
    const key = opts.keyFn(c);
    const now = Date.now();
    const windowMs = opts.windowSec * 1000;

    let entry = buckets.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count++;

    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          error: `Too many requests. Please try again in ${retryAfter} seconds.`,
          code: 'RATE_LIMITED',
          retryable: true,
          retryAfter,
        },
        429,
      );
    }

    await next();
  };
}
