import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyJwt } from '../lib/jwt.js';
import type { DatabaseAdapter } from '../lib/db-adapter.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

// Module-level reference to db — set during app initialization
let _db: DatabaseAdapter;

export function setAuthDb(db: DatabaseAdapter): void {
  _db = db;
}

/**
 * Auth middleware — verifies JWT cookie and populates c.get('user').
 */
export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const cookie = getCookie(c, 'ab_session');
    if (!cookie) {
      return c.json(
        { error: 'Not authenticated', code: 'UNAUTHORIZED', retryable: false },
        401,
      );
    }

    try {
      const payload = verifyJwt(cookie);

      // Check token hasn't been revoked
      const tokenRow = await _db.getAuthToken(payload.jti);
      if (!tokenRow || tokenRow.type !== 'session') {
        return c.json(
          { error: 'Session expired', code: 'UNAUTHORIZED', retryable: false },
          401,
        );
      }

      // Check token hasn't expired in the database
      if (new Date(tokenRow.expires_at) < new Date()) {
        return c.json(
          { error: 'Session expired', code: 'UNAUTHORIZED', retryable: false },
          401,
        );
      }

      c.set('user', {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      } satisfies AuthUser);

      await next();
    } catch {
      return c.json(
        { error: 'Invalid session', code: 'UNAUTHORIZED', retryable: false },
        401,
      );
    }
  };
}

/**
 * Admin middleware — must be used after authMiddleware.
 * Checks that the authenticated user has role='admin'.
 */
export function adminMiddleware() {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;
    if (user?.role !== 'admin') {
      return c.json(
        { error: 'Admin access required', code: 'FORBIDDEN', retryable: false },
        403,
      );
    }
    await next();
  };
}
