import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be defined in production. Refusing to start.');
  }
  if (!ACCESS_SECRET) process.env.JWT_SECRET = 'dev-only-insecure-access-secret-change-me';
  if (!REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'dev-only-insecure-refresh-secret-change-me';
  console.warn('[WARN] JWT secrets not set — using insecure dev fallbacks. Set JWT_SECRET and JWT_REFRESH_SECRET.');
}

const getSecret = () => process.env.JWT_SECRET!;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET!;

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '15m' });
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, getSecret()) as jwt.JwtPayload;
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload;
}

export function signEmailToken(payload: object): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' });
}

export function verifyEmailToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, getSecret()) as jwt.JwtPayload;
}
