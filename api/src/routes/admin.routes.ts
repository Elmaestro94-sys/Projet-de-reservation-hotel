import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

const adminRoles = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE', 'MODERATOR'] as const;

router.use(authenticate);
router.use(authorize(...adminRoles));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.listUsers);
router.post('/users/:id/ban', authorize('SUPER_ADMIN', 'MODERATOR'), adminController.banUser);
router.post('/users/:id/unban', authorize('SUPER_ADMIN', 'MODERATOR'), adminController.unbanUser);
router.get('/properties', adminController.listProperties);
router.post('/properties/:id/approve', authorize('SUPER_ADMIN', 'MODERATOR'), adminController.approveProperty);
router.post('/properties/:id/reject', authorize('SUPER_ADMIN', 'MODERATOR'), adminController.rejectProperty);
router.get('/bookings', adminController.listBookings);
router.get('/payments', authorize('SUPER_ADMIN', 'FINANCE'), adminController.listPayments);
router.get('/audit-logs', authorize('SUPER_ADMIN'), adminController.getAuditLogs);

export default router;
