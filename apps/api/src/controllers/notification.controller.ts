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
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
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
    if (!notif || notif.userId !== userId) {
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
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    res.json({ success: true, data: { message: 'Barchasi o\'qildi' } });
  } catch (error) {
    next(error);
  }
};
