import { Router } from 'express';
import * as promotionController from '../controllers/promotion.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('OWNER', 'SUPER_ADMIN'), promotionController.listPromotions);
router.post('/', authenticate, authorize('OWNER', 'SUPER_ADMIN'), promotionController.createPromotion);
router.post('/validate', promotionController.validatePromoCode);
router.put('/:id', authenticate, authorize('OWNER', 'SUPER_ADMIN'), promotionController.updatePromotion);
router.delete('/:id', authenticate, authorize('OWNER', 'SUPER_ADMIN'), promotionController.deletePromotion);

export default router;
