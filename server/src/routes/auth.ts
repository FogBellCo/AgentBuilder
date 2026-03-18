import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import type { DatabaseAdapter } from '../lib/db-adapter.js';
import type { EmailProvider } from '../lib/email-provider.js';
import type { AppEnv } from '../lib/types.js';
import { signJwt, verifyJwt } from '../lib/jwt.js';
import { magicLinkEmail } from '../lib/email-templates.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { authMiddleware } from '../middleware/auth.js';

const magicLinkSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
});

export function createAuthRoutes(db: DatabaseAdapter, emailProvider: EmailProvider): Hono<AppEnv> {
  const authRoute = new Hono<AppEnv>();

  // POST /api/auth/magic-link
  authRoute.post(
    '/magic-link',
    rateLimitMiddleware({
      keyFn: (c) => {
        // Rate limit by IP
        return `magic-link-ip:${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'}`;
      },
      max: parseInt(process.env.RATE_LIMIT_MAGIC_LINK_PER_IP || '20', 10),
      windowSec: 3600,
    }),
    async (c) => {
      try {
        const body = await c.req.json();
        const result = magicLinkSchema.safeParse(body);
        if (!result.success) {
          return c.json(
            { error: 'Invalid email address', code: 'VALIDATION_ERROR', retryable: false },
            400,
          );
        }

        const { email } = result.data;

        // Always return success to prevent email enumeration,
        // but perform rate limiting by email internally
        const user = await db.upsertUser(email);

        // Generate magic link token
        const tokenValue = randomBytes(32).toString('hex');
        const expiryMinutes = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15', 10);
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

        await db.createAuthToken({
          token: tokenValue,
          user_id: user.id,
          type: 'magic_link',
          expires_at: expiresAt,
          consumed_at: null,
          created_at: new Date().toISOString(),
        });

        // Build verify URL
        const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
        const verifyUrl = `${appUrl.replace(/\/$/, '')}/api/auth/verify?token=${tokenValue}&redirect=/`;

        const template = magicLinkEmail(verifyUrl);
        await emailProvider.send({
          to: email,
          ...template,
        });

        return c.json({
          success: true,
          message: 'Check your email for a sign-in link.',
        });
      } catch (error) {
        console.error('[auth/magic-link] Error:', error);
        return c.json(
          { error: 'Failed to send magic link', code: 'INTERNAL_ERROR', retryable: true },
          500,
        );
      }
    },
  );

  // GET /api/auth/verify
  authRoute.get('/verify', async (c) => {
    const token = c.req.query('token');
    const redirect = c.req.query('redirect') || '/';

    // Validate redirect is a relative path
    const safePath = redirect.startsWith('/') ? redirect : '/';

    if (!token) {
      const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
      return c.redirect(`${appUrl}/#/?error=missing_token`);
    }

    try {
      const tokenRow = await db.consumeAuthToken(token);

      if (!tokenRow) {
        // Token not found, already used, or expired
        const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
        return c.redirect(`${appUrl}/#/?error=expired_link`);
      }

      // Check if expired
      if (new Date(tokenRow.expires_at) < new Date()) {
        const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
        return c.redirect(`${appUrl}/#/?error=expired_link`);
      }

      // Get user
      const user = await db.getUserById(tokenRow.user_id);
      if (!user) {
        const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
        return c.redirect(`${appUrl}/#/?error=user_not_found`);
      }

      // Generate JWT
      const { token: jwtToken, jti, expiresAt } = signJwt({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      // Store JWT's jti in auth_tokens for revocation support
      await db.createAuthToken({
        token: jti,
        user_id: user.id,
        type: 'session',
        expires_at: expiresAt.toISOString(),
        consumed_at: null,
        created_at: new Date().toISOString(),
      });

      // Set cookie
      const isProduction = process.env.NODE_ENV === 'production';
      setCookie(c, 'ab_session', jwtToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
      return c.redirect(`${appUrl}/#${safePath}`);
    } catch (error) {
      console.error('[auth/verify] Error:', error);
      const appUrl = process.env.APP_URL || 'http://localhost:5173/AgentBuilder';
      return c.redirect(`${appUrl}/#/?error=verification_failed`);
    }
  });

  // POST /api/auth/logout
  authRoute.post('/logout', authMiddleware(), async (c) => {
    try {
      const cookie = getCookie(c, 'ab_session');
      if (cookie) {
        const payload = verifyJwt(cookie);
        await db.deleteAuthToken(payload.jti);
      }
    } catch {
      // Ignore errors — we're logging out regardless
    }

    deleteCookie(c, 'ab_session', { path: '/' });
    return c.json({ success: true });
  });

  // GET /api/auth/me
  authRoute.get('/me', authMiddleware(), async (c) => {
    const user = c.get('user');
    const fullUser = await db.getUserById(user.id);
    if (!fullUser) {
      return c.json(
        { error: 'User not found', code: 'NOT_FOUND', retryable: false },
        404,
      );
    }
    return c.json({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        displayName: fullUser.display_name,
        role: fullUser.role,
        createdAt: fullUser.created_at,
        lastLoginAt: fullUser.last_login_at,
      },
    });
  });

  return authRoute;
}
