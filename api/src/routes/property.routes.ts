import { Router } from 'express';
import { z } from 'zod';
import * as propertyController from '../controllers/property.controller';
import { authenticate, optionalAuth, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const propertySchema = z.object({
  title: z.string().min(5, 'Titre trop court (min 5 caractères)').max(100),
  description: z.string().min(20, 'Description trop courte (min 20 caractères)').max(5000),
  type: z.string().min(1, 'Type requis'),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxGuests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  pricePerNight: z.number().positive('Prix par nuit requis'),
  cleaningFee: z.number().min(0).optional(),
  serviceFee: z.number().min(0).optional(),
  minNights: z.number().int().min(1).optional(),
  maxNights: z.number().int().min(1).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  instantBooking: z.boolean().optional(),
  cancellationPolicy: z.string().optional(),
  rules: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

router.get('/', optionalAuth, propertyController.listProperties);
router.get('/my', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.getOwnerProperties);
router.get('/my/stats', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.getOwnerStats);
router.get('/my/stats/revenue', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.getOwnerRevenueStats);
router.get('/my/export', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.exportOwnerBookingsCSV);
router.get('/favorites', authenticate, propertyController.getFavorites);
router.get('/:slug', optionalAuth, propertyController.getProperty);
router.post('/', authenticate, authorize('OWNER', 'SUPER_ADMIN'), validate(propertySchema), propertyController.createProperty);
router.put('/:id', authenticate, authorize('OWNER', 'SUPER_ADMIN'), validate(propertySchema.partial()), propertyController.updateProperty);
router.post('/:id/submit', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.submitForReview);
router.delete('/:id', authenticate, propertyController.deleteProperty);
router.post('/:id/favorite', authenticate, propertyController.toggleFavorite);
router.put('/:propertyId/availability', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.manageAvailability);

export default router;
