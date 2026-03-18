import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import type { DatabaseAdapter } from '../../lib/db-adapter.js';
import adminAuth from './auth.js';
import { createAdminSubmissionsRoutes } from './submissions.js';
import { createAdminAnalyticsRoutes } from './analytics.js';
import { createAdminTeamRoutes } from './team.js';

function getAdminJwtSecret(): string {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-admin-secret-not-for-production';
}

export function createNewAdminRoutes(db: DatabaseAdapter): Hono {
  const app = new Hono();

  // Auth endpoint (no middleware needed)
  app.route('/', adminAuth);

  // JWT middleware for all other routes
  app.use('/*', async (c, next) => {
    const path = c.req.path;
    // Skip auth for the auth endpoint itself
    if (path === '/auth' || path.endsWith('/auth')) {
      return next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Not authenticated', code: 'UNAUTHORIZED' }, 401);
    }

    const token = authHeader.slice(7);
    try {
      jwt.verify(token, getAdminJwtSecret());
      await next();
    } catch {
      return c.json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }, 401);
    }
  });

  // Mount sub-routes
  app.route('/submissions', createAdminSubmissionsRoutes(db));
  app.route('/analytics', createAdminAnalyticsRoutes(db));
  app.route('/team', createAdminTeamRoutes(db));

  return app;
}
