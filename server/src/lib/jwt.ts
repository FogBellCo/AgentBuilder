import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In development, use a deterministic fallback so restarts don't invalidate sessions.
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-secret-not-for-production-use-please-set-JWT_SECRET';
    }
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret;
}

export function signJwt(payload: { sub: string; email: string; role: string }): { token: string; jti: string; expiresAt: Date } {
  const jti = randomUUID();
  const expiryDays = parseInt(process.env.JWT_EXPIRY_DAYS || '30', 10);
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      jti,
    },
    getSecret(),
    { expiresIn: `${expiryDays}d` },
  );

  return { token, jti, expiresAt };
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
