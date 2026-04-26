import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, reviewController.createReview);
router.post('/:id/reply', authenticate, reviewController.replyToReview);
router.get('/property/:propertyId', reviewController.getPropertyReviews);

export default router;
