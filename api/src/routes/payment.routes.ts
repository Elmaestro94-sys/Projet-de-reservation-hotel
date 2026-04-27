import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stripe/create-session', authenticate, paymentController.createStripeSession);
router.post('/stripe/webhook', paymentController.stripeWebhook);
router.post('/paytech/create-session', authenticate, paymentController.createPayTechSession);
router.post('/paytech/webhook', paymentController.paytechWebhook);
router.get('/my', authenticate, paymentController.getUserPayments);
router.post('/:id/refund', authenticate, authorize('SUPER_ADMIN', 'FINANCE'), paymentController.refundPayment);

export default router;
