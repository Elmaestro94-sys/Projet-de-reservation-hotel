import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { success, error } from '../utils/response';
import { logAudit } from '../utils/audit';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

export async function register(req: Request, res: Response) {
  const { email, password, firstName, lastName, phone, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return error(res, 'Cet email est déjà utilisé', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = uuidv4();

  const allowedRoles = ['USER', 'OWNER'];
  const assignedRole = allowedRoles.includes(role) ? role : 'USER';

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: assignedRole,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });

  try {
    await sendVerificationEmail(email, verificationToken);
  } catch {
    // email failure must not block registration
  }

  await logAudit({ userId: user.id, action: 'CREATE', entity: 'User', entityId: user.id, req });

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  return success(res, { user, accessToken, refreshToken }, 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isBanned) return error(res, 'Email ou mot de passe incorrect', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return error(res, 'Email ou mot de passe incorrect', 401);

  if (!user.isActive) return error(res, 'Compte désactivé. Contactez le support.', 403);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logAudit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, req });

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  const { passwordHash: _, ...safeUser } = user;
  return success(res, { user: safeUser, accessToken, refreshToken });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = req.body;
  if (!token) return error(res, 'Refresh token manquant', 400);

  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isActive: true, isBanned: true },
    });
    if (!user || !user.isActive || user.isBanned) return error(res, 'Compte invalide', 401);

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });
    return success(res, { accessToken, refreshToken: newRefreshToken });
  } catch {
    return error(res, 'Refresh token invalide ou expiré', 401);
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent user enumeration
  if (user) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
    try {
      await sendPasswordResetEmail(email, token);
    } catch {
      // email failure logged silently
    }
  }

  return success(res, { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return error(res, 'Lien invalide ou expiré', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } });
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
  await logAudit({ userId: reset.userId, action: 'UPDATE', entity: 'User', entityId: reset.userId, req });

  return success(res, { message: 'Mot de passe réinitialisé avec succès.' });
}

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      avatar: true, role: true, isVerified: true, language: true, currency: true,
      createdAt: true, lastLoginAt: true,
    },
  });
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  return success(res, user);
}

export async function updateProfile(req: Request, res: Response) {
  const { firstName, lastName, phone, language, currency } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { firstName, lastName, phone, language, currency },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, language: true, currency: true },
  });
  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'User', entityId: req.user!.id, req });
  return success(res, updated);
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return error(res, 'Utilisateur introuvable', 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return error(res, 'Mot de passe actuel incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit({ userId: user.id, action: 'UPDATE', entity: 'User', entityId: user.id, req });

  return success(res, { message: 'Mot de passe modifié avec succès.' });
}
