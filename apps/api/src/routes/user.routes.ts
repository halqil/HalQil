import { Router } from 'express';
import {
  getMe,
  updateMe,
  updateAvatar,
  updateSettings,
  changePassword,
  verifyPassword,
  getPublicUser,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { uploadAvatar } from '../middlewares/upload';

const router = Router();

// Private — /me routes (/:id dan OLDIN bo'lishi kerak)
router.get('/me', authenticate, getMe);
router.patch('/me/profile', authenticate, updateMe);
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), updateAvatar);
router.patch('/me/avatar', authenticate, uploadAvatar.single('avatar'), updateAvatar);
router.patch('/me/settings', authenticate, updateSettings);
router.patch('/me/change-password', authenticate, changePassword);
router.post('/me/verify-password', authenticate, verifyPassword);

// Public
router.get('/:id', getPublicUser);

export default router;
