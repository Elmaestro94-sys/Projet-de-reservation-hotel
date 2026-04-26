import { Router } from 'express';
import prisma from '../utils/prisma';
import { success } from '../utils/response';

const router = Router();

router.get('/', async (_req, res) => {
  const destinations = await prisma.destination.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  return success(res, destinations);
});

export default router;
