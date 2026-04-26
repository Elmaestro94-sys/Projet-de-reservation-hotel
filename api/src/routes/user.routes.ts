import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

const router = Router();

router.get('/favorites', authenticate, async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      property: {
        select: {
          id: true, slug: true, title: true, city: true, pricePerNight: true,
          avgRating: true, reviewCount: true,
          photos: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
  });
  return success(res, favorites.map(f => f.property));
});

router.get('/export', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      bookings: {
        include: {
          property: { select: { title: true, city: true } },
          payments: true,
        },
      },
      reviews: true,
    },
  });
  if (!user) return error(res, 'Utilisateur introuvable', 404);
  const { passwordHash: _, ...safeUser } = user;
  res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees-sejour-senegal.json"');
  res.setHeader('Content-Type', 'application/json');
  return res.json(safeUser);
});

export default router;
