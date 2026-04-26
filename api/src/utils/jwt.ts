import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-refresh-me-in-production';

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, SECRET) as jwt.JwtPayload;
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;
}
