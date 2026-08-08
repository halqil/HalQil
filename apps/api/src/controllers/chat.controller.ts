import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const CHAT_STATUSES = ['CHATTING', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'];

/**
 * @desc    User/Provayder suhbatlari inbox ro'yxati
 * @route   GET /chats
 * @access  authenticate
 */
export const getChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId as string;
    const role = req.user?.role as string;
    const { categoryId, skillId, status } = req.query;

    // ─── WHERE sharti ──────────────────────────────────────────
    const where: any = {
      status: { in: CHAT_STATUSES }
    };

    // PROVIDER bo'lsa providerProfile.id topib, OR filter
    if (role === 'PROVIDER') {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (!profile) {
        return res.json({ success: true, data: [] });
      }
      where.OR = [
        { userId },
        { providerId: profile.id }
      ];
    } else {
      where.userId = userId;
    }

    // Status filter (frontenddan ma'lum status tanlansa)
    if (status && typeof status === 'string' && CHAT_STATUSES.includes(status)) {
      where.status = status;
    }

    // Category filter
    if (categoryId && typeof categoryId === 'string') {
      where.skill = { categoryId };
    }

    // Skill filter
    if (skillId && typeof skillId === 'string') {
      where.skillId = skillId;
    }

    // ─── Orderlarni olish ──────────────────────────────────────
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, isOnline: true } },
        provider: {
          include: {
            user: { select: { id: true, name: true, avatar: true, isOnline: true } }
          }
        },
        skill: {
          include: {
            category: { select: { id: true, name: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, type: true, createdAt: true, senderId: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // ─── unreadCount lar bir batchda ───────────────────────────
    const orderIds = orders.map(o => o.id);
    const unreadCounts = await prisma.message.groupBy({
      by: ['orderId'],
      where: {
        orderId: { in: orderIds },
        isRead: false,
        senderId: { not: userId }
      },
      _count: { id: true }
    });
    const unreadMap = new Map(unreadCounts.map(u => [u.orderId, u._count.id]));

    // ─── Map va sort ───────────────────────────────────────────
    const chats = orders.map(order => {
      const lastMessage = order.messages[0] || null;
      const lastMessageAt = lastMessage ? lastMessage.createdAt : order.updatedAt;

      // otherParty: men user bo'lsam — provayder, aksincha
      const amIUser = order.userId === userId;
      const otherParty = amIUser
        ? {
            id: order.provider.user.id,
            name: order.provider.user.name,
            avatar: order.provider.user.avatar,
            isOnline: order.provider.user.isOnline
          }
        : {
            id: order.user.id,
            name: order.user.name,
            avatar: order.user.avatar,
            isOnline: order.user.isOnline
          };

      return {
        orderId: order.id,
        status: order.status,
        otherParty,
        skill: { id: order.skill.id, name: order.skill.name },
        category: order.skill.category,
        topic: order.skill.name,
        lastMessage,
        lastMessageAt,
        unreadCount: unreadMap.get(order.id) || 0
      };
    });

    // lastMessageAt bo'yicha desc sort
    chats.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Foydalanuvchining suhbatlari bo'lgan kategoriyalar ro'yxati
 * @route   GET /chats/categories
 * @access  authenticate
 */
export const getChatCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId as string;
    const role = req.user?.role as string;

    const where: any = {
      status: { in: CHAT_STATUSES }
    };

    if (role === 'PROVIDER') {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (!profile) {
        return res.json({ success: true, data: [] });
      }
      where.OR = [
        { userId },
        { providerId: profile.id }
      ];
    } else {
      where.userId = userId;
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        skill: {
          select: {
            category: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Distinct kategoriyalar
    const categoryMap = new Map<string, { id: string; name: string }>();
    for (const order of orders) {
      const cat = order.skill.category;
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, cat);
      }
    }

    res.json({ success: true, data: Array.from(categoryMap.values()) });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Chat uchun rasm yuklash
 * @route   POST /chats/upload
 * @access  authenticate
 */
export const uploadChatImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Rasm yuklanmadi" });
    }
    res.json({
      success: true,
      data: {
        url: req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
};

