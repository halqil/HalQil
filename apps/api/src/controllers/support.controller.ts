import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const contactSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, phone, page } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Xabar kiritish majburiy' });
    }

    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' }
    });

    const notifications = superAdmins.map(admin => ({
      userId: admin.id,
      title: 'Yangi yordam so\'rovi',
      message: `${page ? page + ' sahifasidan: ' : ''}${message.substring(0, 100)}${message.length > 100 ? '...' : ''}${phone ? ' (Tel: ' + phone + ')' : ''}`,
      type: 'SYSTEM' as const,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    res.json({ success: true, message: 'Xabaringiz qabul qilindi' });
  } catch (error) {
    next(error);
  }
};
