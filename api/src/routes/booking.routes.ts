import { Router } from 'express';
import { z } from 'zod';
import * as bookingController from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const availabilitySchema = z.object({
  propertyId: z.string().uuid('ID propriété invalide'),
  checkIn: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  checkOut: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  guests: z.number().int().min(1),
});

const createBookingSchema = availabilitySchema.extend({
  guestNote: z.string().max(500).optional(),
});

router.post('/check-availability', validate(availabilitySchema), bookingController.checkAvailability);
router.post('/admin/auto-complete', authenticate, authorize('SUPER_ADMIN'), bookingController.autoCompleteBookings);
router.post('/', authenticate, validate(createBookingSchema), bookingController.createBooking);
router.get('/my', authenticate, bookingController.getUserBookings);
router.get('/owner', authenticate, bookingController.getOwnerBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.post('/:id/confirm', authenticate, bookingController.confirmBooking);
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);
router.post('/:id/dispute', authenticate, bookingController.createDispute);
router.post('/:id/resolve-dispute', authenticate, authorize('SUPER_ADMIN', 'SUPPORT'), bookingController.resolveDispute);

export default router;
