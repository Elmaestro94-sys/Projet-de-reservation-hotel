import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/stripe/create-session', authenticate, paymentController.createStripeSession);
router.post('/stripe/webhook', paymentController.stripeWebhook);
router.post('/paytech/create-session', authenticate, paymentController.createPayTechSession);
router.post('/paytech/webhook', paymentController.paytechWebhook);
router.get('/my', authenticate, paymentController.getUserPayments);

export default router;
