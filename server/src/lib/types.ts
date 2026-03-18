import type { AuthUser } from '../middleware/auth.js';

/**
 * Hono environment type — declares context variable types.
 * Use: `new Hono<AppEnv>()` to get typed `c.get('user')`.
 */
export type AppEnv = {
  Variables: {
    user: AuthUser;
  };
};
