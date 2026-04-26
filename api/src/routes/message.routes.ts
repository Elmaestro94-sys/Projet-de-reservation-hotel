import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, messageController.getConversations);
router.post('/', authenticate, messageController.sendMessage);
router.post('/:id/report', authenticate, messageController.reportMessage);
router.delete('/:id', authenticate, messageController.deleteMessage);
router.get('/admin/reported', authenticate, authorize('SUPER_ADMIN', 'MODERATOR', 'SUPPORT'), messageController.adminListReportedMessages);
router.delete('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'MODERATOR'), messageController.adminDeleteMessage);
router.get('/:otherUserId', authenticate, messageController.getConversation);

export default router;
