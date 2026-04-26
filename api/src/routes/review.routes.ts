import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, reviewController.createReview);
router.post('/:id/reply', authenticate, reviewController.replyToReview);
router.post('/:id/report', authenticate, reviewController.reportReview);
router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.get('/admin/reported', authenticate, authorize('SUPER_ADMIN', 'MODERATOR'), reviewController.adminListReportedReviews);
router.post('/admin/:id/unpublish', authenticate, authorize('SUPER_ADMIN', 'MODERATOR'), reviewController.adminUnpublishReview);

export default router;
