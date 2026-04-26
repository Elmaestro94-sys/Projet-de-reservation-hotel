import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/check-availability', bookingController.checkAvailability);
router.post('/', authenticate, bookingController.createBooking);
router.get('/my', authenticate, bookingController.getUserBookings);
router.get('/owner', authenticate, bookingController.getOwnerBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.post('/:id/confirm', authenticate, bookingController.confirmBooking);
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

export default router;
