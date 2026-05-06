import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);

/**
 * @desc    O'zining admin chatini olish
 * @route   GET /my/admin-chat
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const chat = await prisma.adminChat.findFirst({
      where: { targetUserId: userId },
      include: {
        admin: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!chat) {
      return res.json({ success: true, data: null });
    }

    const lastMessage = await prisma.adminChatMessage.findFirst({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { ...chat, lastMessage } });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Admin chat ochish yoki mavjudini olish (birinchi xabarni ham yuborish mumkin)
 * @route   POST /my/admin-chat
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId as string;
    const { message } = req.body;

    let chat = await prisma.adminChat.findFirst({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Agar yo'q bo'lsa, bitta SUPER_ADMIN topib o'shanga bog'laymiz
    if (!chat) {
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });
      
      if (!superAdmin) {
        return res.status(400).json({ success: false, error: "Tizimda admin topilmadi" });
      }

      chat = await prisma.adminChat.create({
        data: {
          adminId: superAdmin.id,
          targetUserId: userId
        }
      });
    }

    if (message?.trim()) {
      await prisma.adminChatMessage.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          content: message.trim()
        }
      });
    }

    // Foydalanuvchi ma'lumotlarini olish
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'Foydalanuvchi';
    const username = user?.username ? `(@${user.username})` : '';

    // Barcha SUPER_ADMIN larga notification
    const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
    const notifs = admins.map(a => ({
      userId: a.id,
      title: "Foydalanuvchi bog'lanmoqchi",
      message: `${name} ${username} siz bilan bog'lanmoqchi`.trim(),
      type: "DIRECT_MESSAGE" as any,
      link: `/admin-chat/${chat!.id}`, // Aslida admin panelida ochiladi, link frontendda /admin ni bildiradi?
      // Promptdagi link: /admin/chats/:chatId lekin admin panelida qanday? "link: /admin/chats/:chatId"
      isGlobal: false
    }));

    if (notifs.length > 0) {
      await prisma.notification.createMany({ data: notifs });
    }

    res.json({ success: true, data: { chatId: chat.id } });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Chat xabarlarini olish
 * @route   GET /my/admin-chat/messages
 */
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const chat = await prisma.adminChat.findFirst({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!chat) {
      return res.json({ success: true, data: [] });
    }

    const messages = await prisma.adminChatMessage.findMany({
      where: { chatId: chat.id },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Xabar yuborish
 * @route   POST /my/admin-chat/messages
 */
router.post('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    const userId = req.user?.userId as string;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'content majburiy' });
    }

    const chat = await prisma.adminChat.findFirst({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat topilmadi. Avval chat oching' });
    }

    const message = await prisma.adminChatMessage.create({
      data: { chatId: chat.id, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true, role: true } } }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Barcha SUPER_ADMIN larga notification
    const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
    const notifs = admins.map(a => ({
      userId: a.id,
      title: "Yangi xabar",
      message: `${user?.username || user?.name}: ${content.trim().slice(0, 50)}`,
      type: "DIRECT_MESSAGE" as any,
      link: `/admin-chat/${chat.id}`, // Admin chat linki, garchi ularda admin/chats panel bo'lsa ham shu bo'lishi aytildi
      senderId: userId,
      isGlobal: false
    }));

    if (notifs.length > 0) {
      await prisma.notification.createMany({ data: notifs });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

export default router;

