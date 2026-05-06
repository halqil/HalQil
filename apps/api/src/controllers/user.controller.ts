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
        firstName: true,
        lastName: true,
        name: true,
        username: true,
        walletId: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        reliability: true,
        successfulOrders: true,
        cancelledOrders: true,
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
        providerProfile: {
          include: {
            providerSkills: { include: { skill: { include: { category: true } } } },
            districts: true,
            portfolio: true
          }
        },
        providerApplications: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1
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
 * @route   PATCH /api/users/me/profile
 * @access  Private
 */
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { firstName, lastName, username } = req.body;

    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ success: false, error: 'Ushbu username band' });
      }
    }

    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (username !== undefined) data.username = username;

    if (firstName !== undefined || lastName !== undefined) {
      const userObj = await prisma.user.findUnique({ where: { id: userId } });
      if (userObj) {
        data.name = `${firstName !== undefined ? firstName : (userObj.firstName || '')} ${lastName !== undefined ? lastName : (userObj.lastName || '')}`.trim();
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true, name: true, username: true, email: true, role: true, avatar: true, walletId: true }
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

/**
 * @desc    Ommaviy user profili (provayder ko'rishi uchun)
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getPublicUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        username: true,
        walletId: true,
        avatar: true,
        isOnline: true,
        lastSeenAt: true,
        reliability: true,
        successfulOrders: true,
        cancelledOrders: true,
        createdAt: true,
        role: true
      }
    });

    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
