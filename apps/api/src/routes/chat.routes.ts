import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getChats, getChatCategories, uploadChatImage } from '../controllers/chat.controller';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

router.get('/', getChats);
router.get('/categories', getChatCategories);
router.post('/upload', upload.single('image'), uploadChatImage);

export default router;
