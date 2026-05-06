import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * @desc    Bildirishnomalarni olish
 * @route   GET /api/notifications
 * @access  Private (USER, PROVIDER)
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { isGlobal: true }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const unreadCount = await prisma.notification.count({ 
      where: { 
        OR: [
          { userId },
          { isGlobal: true }
        ],
        isRead: false 
      } 
    });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bildirishnomani o'qilgan deb belgilash
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const notif = await prisma.notification.findUnique({ where: { id } });

    // Global notification yoki o'z notificationini o'qishi mumkin
    if (!notif || (notif.userId !== null && notif.userId !== userId)) {
      return res.status(404).json({ success: false, error: 'Bildirishnoma topilmadi' });
    }

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true, data: { message: 'O\'qildi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Barcha bildirishnomalarni o'qilgan deb belgilash
 * @route   POST /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    // O'z notificationlarini o'qi
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    // Global notificationlarni ham o'qi
    await prisma.notification.updateMany({
      where: { isGlobal: true, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, data: { message: 'Barchasi o\'qildi' } });
  } catch (error) {
    next(error);
  }
};

