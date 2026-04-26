import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error, paginated } from '../utils/response';
import { logAudit } from '../utils/audit';

export async function getDashboardStats(req: Request, res: Response) {
  const [users, properties, bookings, revenue, pendingProperties] = await Promise.all([
    prisma.user.count(),
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.booking.count(),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.property.count({ where: { status: 'PENDING_REVIEW' } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { firstName: true, lastName: true } },
      property: { select: { title: true } },
    },
  });

  return success(res, {
    totalUsers: users,
    publishedProperties: properties,
    totalBookings: bookings,
    totalRevenue: revenue._sum.amount || 0,
    pendingProperties,
    recentBookings,
  });
}

export async function listUsers(req: Request, res: Response) {
  const { page = '1', limit = '20', role, search, banned } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (banned === 'true') where.isBanned = true;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        isActive: true, isBanned: true, isVerified: true, createdAt: true, lastLoginAt: true,
        _count: { select: { properties: true, bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(res, users, total, parseInt(page), parseInt(limit));
}

export async function banUser(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  if (user.role === 'SUPER_ADMIN') return error(res, 'Impossible de bannir un super admin', 403);

  await prisma.user.update({
    where: { id },
    data: { isBanned: true, banReason: reason, isActive: false },
  });

  await logAudit({ userId: req.user!.id, action: 'BAN', entity: 'User', entityId: id, reason, req });
  return success(res, { message: 'Utilisateur banni.' });
}

export async function unbanUser(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.user.update({
    where: { id },
    data: { isBanned: false, banReason: null, isActive: true },
  });
  await logAudit({ userId: req.user!.id, action: 'UNBAN', entity: 'User', entityId: id, req });
  return success(res, { message: 'Utilisateur débanni.' });
}

export async function listProperties(req: Request, res: Response) {
  const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { firstName: true, lastName: true, email: true } },
        photos: { where: { isCover: true }, take: 1 },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return paginated(res, properties, total, parseInt(page), parseInt(limit));
}

export async function approveProperty(req: Request, res: Response) {
  const { id } = req.params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.status !== 'PENDING_REVIEW') return error(res, 'Annonce non en attente de validation', 400);

  await prisma.property.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  await logAudit({ userId: req.user!.id, action: 'VERIFY', entity: 'Property', entityId: id, req });
  return success(res, { message: 'Annonce approuvée et publiée.' });
}

export async function rejectProperty(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;

  await prisma.property.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason },
  });

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Property', entityId: id, reason, req });
  return success(res, { message: 'Annonce refusée.' });
}

export async function listBookings(req: Request, res: Response) {
  const { page = '1', limit = '20', status } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        property: { select: { title: true, city: true } },
        payments: { select: { status: true, amount: true, provider: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return paginated(res, bookings, total, parseInt(page), parseInt(limit));
}

export async function listPayments(req: Request, res: Response) {
  const { page = '1', limit = '20', status } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true, nights: true,
            user: { select: { firstName: true, lastName: true } },
            property: { select: { title: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return paginated(res, payments, total, parseInt(page), parseInt(limit));
}

export async function getAuditLogs(req: Request, res: Response) {
  const { page = '1', limit = '50', entity, userId } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginated(res, logs, total, parseInt(page), parseInt(limit));
}
