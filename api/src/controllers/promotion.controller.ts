import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

export async function listPromotions(req: Request, res: Response) {
  const { propertyId } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};

  if (propertyId) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) return error(res, 'Annonce introuvable', 404);
    if (property.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
      return error(res, 'Accès refusé', 403);
    }
    where.propertyId = propertyId;
  } else {
    where.property = { ownerId: req.user!.id };
  }

  const promotions = await prisma.promotion.findMany({
    where,
    include: { property: { select: { id: true, title: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, promotions);
}

export async function createPromotion(req: Request, res: Response) {
  const { propertyId, code, discount, type, startDate, endDate, minNights, maxUsage } = req.body;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return error(res, 'Accès refusé', 403);
  }

  if (code) {
    const existing = await prisma.promotion.findFirst({ where: { code, propertyId } });
    if (existing) return error(res, 'Ce code promotionnel existe déjà pour cette annonce', 409);
  }

  const promotion = await prisma.promotion.create({
    data: {
      propertyId,
      code: code || null,
      discount,
      type: type || 'PERCENTAGE',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      minNights: minNights || null,
      maxUsage: maxUsage || null,
    },
  });
  return success(res, promotion, 201);
}

export async function updatePromotion(req: Request, res: Response) {
  const { id } = req.params;

  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { property: { select: { ownerId: true } } },
  });
  if (!promotion) return error(res, 'Promotion introuvable', 404);
  if (promotion.property.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return error(res, 'Accès refusé', 403);
  }

  const { code, discount, type, startDate, endDate, minNights, maxUsage, isActive } = req.body;
  const updated = await prisma.promotion.update({
    where: { id },
    data: {
      code: code ?? promotion.code,
      discount: discount ?? promotion.discount,
      type: type ?? promotion.type,
      startDate: startDate ? new Date(startDate) : promotion.startDate,
      endDate: endDate ? new Date(endDate) : promotion.endDate,
      minNights: minNights ?? promotion.minNights,
      maxUsage: maxUsage ?? promotion.maxUsage,
      isActive: isActive ?? promotion.isActive,
    },
  });
  return success(res, updated);
}

export async function deletePromotion(req: Request, res: Response) {
  const { id } = req.params;

  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: { property: { select: { ownerId: true } } },
  });
  if (!promotion) return error(res, 'Promotion introuvable', 404);
  if (promotion.property.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return error(res, 'Accès refusé', 403);
  }

  await prisma.promotion.delete({ where: { id } });
  return success(res, { message: 'Promotion supprimée.' });
}

export async function validatePromoCode(req: Request, res: Response) {
  const { code, propertyId, checkIn, checkOut } = req.body;

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const now = new Date();
  const promotion = await prisma.promotion.findFirst({
    where: {
      code,
      propertyId,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  if (!promotion) return error(res, 'Code promotionnel invalide ou expiré', 404);
  if (promotion.maxUsage && promotion.usageCount >= promotion.maxUsage) {
    return error(res, 'Code promotionnel épuisé', 400);
  }
  if (promotion.minNights && nights < promotion.minNights) {
    return error(res, `Séjour minimum de ${promotion.minNights} nuits requis`, 400);
  }

  return success(res, {
    valid: true,
    discount: promotion.discount,
    type: promotion.type,
    code: promotion.code,
  });
}
