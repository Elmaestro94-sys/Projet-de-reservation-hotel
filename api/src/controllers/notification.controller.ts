import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success } from '../utils/response';

export async function getNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return success(res, notifications);
}

export async function markAsRead(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.notification.updateMany({
    where: { id, userId: req.user!.id },
    data: { isRead: true, readAt: new Date() },
  });
  return success(res, { message: 'Notification marquée comme lue.' });
}

export async function markAllAsRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return success(res, { message: 'Toutes les notifications marquées comme lues.' });
}

export async function getUnreadCount(req: Request, res: Response) {
  const count = await prisma.notification.count({
    where: { userId: req.user!.id, isRead: false },
  });
  return success(res, { count });
}
