import { Router } from 'express';
import { getMe, updateMe, updateAvatar } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.patch('/me/avatar', upload.single('avatar'), updateAvatar);

export default router;
