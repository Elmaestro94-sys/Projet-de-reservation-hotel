import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';
import { logAudit } from '../utils/audit';

export async function createReview(req: Request, res: Response) {
  const { bookingId, rating, cleanliness, accuracy, checkin, communication, location, value, comment } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (booking.userId !== req.user!.id) return error(res, 'Accès refusé', 403);
  if (booking.status !== 'COMPLETED' && booking.status !== 'CONFIRMED') {
    return error(res, 'Vous ne pouvez évaluer qu\'une réservation confirmée ou terminée', 400);
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) return error(res, 'Avis déjà soumis pour cette réservation', 409);

  const review = await prisma.review.create({
    data: {
      propertyId: booking.propertyId,
      bookingId,
      reviewerId: req.user!.id,
      ownerId: booking.property.ownerId,
      rating, cleanliness, accuracy, checkin, communication, location, value, comment,
    },
  });

  // Recalculate property average rating
  const stats = await prisma.review.aggregate({
    where: { propertyId: booking.propertyId, isPublished: true },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.property.update({
    where: { id: booking.propertyId },
    data: {
      avgRating: stats._avg.rating || 0,
      reviewCount: stats._count.id,
    },
  });

  await logAudit({ userId: req.user!.id, action: 'CREATE', entity: 'Review', entityId: review.id, req });
  return success(res, review, 201);
}

export async function replyToReview(req: Request, res: Response) {
  const { id } = req.params;
  const { reply } = req.body;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return error(res, 'Avis introuvable', 404);
  if (review.ownerId !== req.user!.id) return error(res, 'Accès refusé', 403);
  if (review.ownerReply) return error(res, 'Réponse déjà ajoutée', 409);

  const updated = await prisma.review.update({
    where: { id },
    data: { ownerReply: reply, ownerRepliedAt: new Date() },
  });

  return success(res, updated);
}

export async function getPropertyReviews(req: Request, res: Response) {
  const { propertyId } = req.params;
  const reviews = await prisma.review.findMany({
    where: { propertyId, isPublished: true },
    include: {
      reviewer: { select: { firstName: true, lastName: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, reviews);
}

export async function reportReview(req: Request, res: Response) {
  const { id } = req.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return error(res, 'Avis introuvable', 404);

  await prisma.review.update({ where: { id }, data: { isReported: true } });
  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Review', entityId: id, reason: 'Signalement', req });
  return success(res, { message: 'Avis signalé. Notre équipe va l\'examiner.' });
}

export async function adminListReportedReviews(req: Request, res: Response) {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isReported: true },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { firstName: true, lastName: true, email: true } },
        property: { select: { title: true, slug: true } },
      },
    }),
    prisma.review.count({ where: { isReported: true } }),
  ]);

  const { paginated } = await import('../utils/response');
  return paginated(res, reviews, total, parseInt(page), parseInt(limit));
}

export async function adminUnpublishReview(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.review.update({ where: { id }, data: { isPublished: false, isReported: false } });

  const review = await prisma.review.findUnique({ where: { id } });
  if (review) {
    const stats = await prisma.review.aggregate({
      where: { propertyId: review.propertyId, isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.property.update({
      where: { id: review.propertyId },
      data: { avgRating: stats._avg.rating || 0, reviewCount: stats._count.id },
    });
  }

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Review', entityId: id, req });
  return success(res, { message: 'Avis masqué.' });
}
