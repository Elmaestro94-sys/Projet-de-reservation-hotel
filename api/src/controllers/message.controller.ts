import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

export async function getConversations(req: Request, res: Response) {
  const userId = req.user!.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      status: { not: 'DELETED' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
    distinct: ['senderId', 'receiverId'],
  });

  const conversationMap = new Map<string, typeof messages[0]>();
  messages.forEach(msg => {
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!conversationMap.has(otherId)) conversationMap.set(otherId, msg);
  });

  return success(res, Array.from(conversationMap.values()));
}

export async function getConversation(req: Request, res: Response) {
  const { otherUserId } = req.params;
  const userId = req.user!.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      status: { not: 'DELETED' },
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.message.updateMany({
    where: { senderId: otherUserId, receiverId: userId, status: 'SENT' },
    data: { status: 'READ', readAt: new Date() },
  });

  return success(res, messages);
}

export async function sendMessage(req: Request, res: Response) {
  const { receiverId, bookingId, content } = req.body;

  if (req.user!.id === receiverId) return error(res, 'Vous ne pouvez pas vous envoyer un message', 400);

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return error(res, 'Destinataire introuvable', 404);

  const message = await prisma.message.create({
    data: { senderId: req.user!.id, receiverId, bookingId, content },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  return success(res, message, 201);
}

export async function deleteMessage(req: Request, res: Response) {
  const { id } = req.params;
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return error(res, 'Message introuvable', 404);
  if (message.senderId !== req.user!.id) return error(res, 'Accès refusé', 403);

  await prisma.message.update({ where: { id }, data: { status: 'DELETED' } });
  return success(res, { message: 'Message supprimé.' });
}

export async function reportMessage(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return error(res, 'Message introuvable', 404);
  if (message.receiverId !== userId && message.senderId !== userId) {
    return error(res, 'Accès refusé', 403);
  }

  await prisma.message.update({ where: { id }, data: { isReported: true } });
  return success(res, { message: 'Message signalé. Notre équipe va l\'examiner.' });
}

export async function adminListReportedMessages(req: Request, res: Response) {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { isReported: true },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
        receiver: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.message.count({ where: { isReported: true } }),
  ]);

  const { paginated } = await import('../utils/response');
  return paginated(res, messages, total, parseInt(page), parseInt(limit));
}

export async function adminDeleteMessage(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.message.update({ where: { id }, data: { status: 'DELETED', isReported: false } });
  return success(res, { message: 'Message supprimé par l\'administration.' });
}
