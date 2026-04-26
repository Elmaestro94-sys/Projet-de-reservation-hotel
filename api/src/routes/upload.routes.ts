import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middlewares/auth.middleware';
import { success, error } from '../utils/response';
import prisma from '../utils/prisma';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Format non supporté. Utilisez JPG, PNG ou WebP.'));
  },
});

const router = Router();

router.post('/property-photo', authenticate, upload.single('photo'), async (req, res) => {
  if (!req.file) return error(res, 'Fichier manquant', 400);
  const { propertyId, isCover, caption } = req.body;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.ownerId !== req.user!.id) return error(res, 'Accès refusé', 403);

  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  const photo = await prisma.propertyPhoto.create({
    data: { propertyId, url, caption, isCover: isCover === 'true' },
  });

  return success(res, photo, 201);
});

router.delete('/property-photo/:id', authenticate, async (req, res) => {
  const photo = await prisma.propertyPhoto.findUnique({ where: { id: req.params.id } });
  if (!photo) return error(res, 'Photo introuvable', 404);

  const property = await prisma.property.findUnique({ where: { id: photo.propertyId } });
  if (property?.ownerId !== req.user!.id) return error(res, 'Accès refusé', 403);

  await prisma.propertyPhoto.delete({ where: { id: photo.id } });
  return success(res, { message: 'Photo supprimée.' });
});

export default router;
