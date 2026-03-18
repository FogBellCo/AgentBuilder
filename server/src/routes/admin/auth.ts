import { Hono } from 'hono';
import jwt from 'jsonwebtoken';

const adminAuth = new Hono();

function getAdminJwtSecret(): string {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-admin-secret-not-for-production';
}

adminAuth.post('/auth', async (c) => {
  const body = await c.req.json() as { token?: string };
  const token = body?.token;

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken) {
    // In development, accept any non-empty token
    if (process.env.NODE_ENV === 'production') {
      return c.json({ error: 'Admin authentication not configured' }, 500);
    }
  } else if (token !== expectedToken) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const secret = getAdminJwtSecret();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const jwtToken = jwt.sign(
    {
      sub: 'admin',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    { expiresIn: '24h' },
  );

  return c.json({
    jwt: jwtToken,
    expiresAt: expiresAt.toISOString(),
  });
});

export default adminAuth;
