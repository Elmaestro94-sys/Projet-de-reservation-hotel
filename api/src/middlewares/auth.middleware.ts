import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { error } from '../utils/response';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, 'Token d\'authentification manquant', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true, isBanned: true },
    });
    if (!user || !user.isActive || user.isBanned) {
      return error(res, 'Compte inactif ou banni', 401);
    }
    req.user = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName };
    next();
  } catch {
    return error(res, 'Token invalide ou expiré', 401);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return error(res, 'Non authentifié', 401);
    if (!roles.includes(req.user.role)) return error(res, 'Accès refusé', 403);
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload as Express.Request['user'];
  } catch {
    // optional — continue without auth
  }
  next();
}
