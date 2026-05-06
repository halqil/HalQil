import { Router } from 'express';
import { getMe, updateMe, updateAvatar, getPublicUser } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Private routes — /me dan oldin keladi (/:id bilan to'qnashmasin)
router.get('/me', authenticate, getMe);
router.patch('/me/profile', authenticate, updateMe);
router.patch('/me/avatar', authenticate, upload.single('avatar'), updateAvatar);

// Public route — /me dan keyin (/:id ni "me" deb o'qimasin)
router.get('/:id', getPublicUser);

export default router;

