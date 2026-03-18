import type { Context, Next } from 'hono';

/**
 * Middleware to reject request bodies larger than maxBytes.
 */
export function bodyLimitMiddleware(maxBytes: number) {
  return async (c: Context, next: Next) => {
    const contentLength = parseInt(c.req.header('content-length') || '0', 10);
    if (contentLength > maxBytes) {
      const maxMB = Math.round(maxBytes / (1024 * 1024));
      return c.json(
        {
          error: `Request body too large (max ${maxMB}MB)`,
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
        413,
      );
    }
    await next();
  };
}
