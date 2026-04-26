import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, messageController.getConversations);
router.get('/:otherUserId', authenticate, messageController.getConversation);
router.post('/', authenticate, messageController.sendMessage);
router.delete('/:id', authenticate, messageController.deleteMessage);

export default router;
