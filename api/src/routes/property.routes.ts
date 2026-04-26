import { Router } from 'express';
import * as propertyController from '../controllers/property.controller';
import { authenticate, optionalAuth, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuth, propertyController.listProperties);
router.get('/my', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.getOwnerProperties);
router.get('/my/stats', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.getOwnerStats);
router.get('/favorites', authenticate, propertyController.getFavorites);
router.get('/:slug', optionalAuth, propertyController.getProperty);
router.post('/', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.createProperty);
router.put('/:id', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.updateProperty);
router.post('/:id/submit', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.submitForReview);
router.delete('/:id', authenticate, propertyController.deleteProperty);
router.post('/:id/favorite', authenticate, propertyController.toggleFavorite);
router.put('/:propertyId/availability', authenticate, authorize('OWNER', 'SUPER_ADMIN'), propertyController.manageAvailability);

export default router;
