import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * @desc    Joriy foydalanuvchi ma'lumotlarini olish
 * @route   GET /api/users/me
 * @access  Private (USER, PROVIDER, ADMIN, SUPER_ADMIN)
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        reliability: true,
        createdAt: true,
        providerProfile: {
          include: {
            providerSkills: { include: { skill: { include: { category: true } } } },
            districts: true,
            portfolio: true
          }
        }
      }
    });

    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Joriy foydalanuvchi ma'lumotlarini yangilash
 * @route   PUT /api/users/me
 * @access  Private
 */
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Joriy foydalanuvchi avatarini yangilash
 * @route   POST /api/users/me/avatar
 * @access  Private
 */
export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'Rasm yuklanmadi' });

    const avatarUrl = `/uploads/${file.filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
