import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';

const USER_SETTINGS_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  username: true,
  walletId: true,
  email: true,
  phone: true,
  role: true,
  avatar: true,
  status: true,
  reliability: true,
  successfulOrders: true,
  cancelledOrders: true,
  isOnline: true,
  lastSeenAt: true,
  createdAt: true,
  theme: true,
  fontSize: true,
  language: true,
  notifyNewOrder: true,
  notifyChat: true,
  notifySystem: true,
  notifyApplication: true,
} as const;

/**
 * @desc    Joriy foydalanuvchi ma'lumotlarini olish
 * @route   GET /api/user/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SETTINGS_SELECT,
        providerProfile: {
          include: {
            providerSkills: { include: { skill: { include: { category: true } } } },
            districts: true,
            portfolio: true,
          },
        },
        providerApplications: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Profil ma'lumotlarini yangilash
 * @route   PATCH /api/user/me/profile
 * @access  Private
 */
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { firstName, lastName, username, email } = req.body;

    // Username unique tekshirish
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ success: false, error: 'Ushbu username band' });
      }
    }

    // Email unique tekshirish
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({ success: false, error: 'Bu email allaqachon ishlatilmoqda' });
      }
    }

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName.trim();
    if (lastName !== undefined) data.lastName = lastName.trim();
    if (username !== undefined) data.username = username.toLowerCase().trim();
    if (email !== undefined) data.email = email.toLowerCase().trim();

    // name = firstName + lastName
    if (firstName !== undefined || lastName !== undefined) {
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (current) {
        data.name = `${firstName !== undefined ? firstName.trim() : (current.firstName || '')} ${lastName !== undefined ? lastName.trim() : (current.lastName || '')}`.trim();
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, firstName: true, lastName: true, name: true,
        username: true, email: true, phone: true, role: true, avatar: true, walletId: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Avatar yuklash va yangilash
 * @route   POST /api/user/me/avatar
 * @access  Private
 */
export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'Rasm yuklanmadi' });

    // Eski avatarni o'chirish (faqat lokal bo'lsa)
    const oldUser = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });
    if (oldUser?.avatar && !oldUser.avatar.startsWith('http')) {
      const oldFilePath = path.join(__dirname, '../../', oldUser.avatar);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch { /* silent */ }
      }
    }

    const avatarUrl = file.path.startsWith('http') ? file.path : `/uploads/avatars/${file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    UI/UX sozlamalarini yangilash (theme, fontSize, language, notifications)
 * @route   PATCH /api/user/me/settings
 * @access  Private
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { theme, fontSize, language, notifyNewOrder, notifyChat, notifySystem, notifyApplication } = req.body;

    const data: Record<string, unknown> = {};

    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme))
        return res.status(400).json({ success: false, error: "theme: 'light' | 'dark' | 'system'" });
      data.theme = theme;
    }
    if (fontSize !== undefined) {
      if (!['small', 'medium', 'large'].includes(fontSize))
        return res.status(400).json({ success: false, error: "fontSize: 'small' | 'medium' | 'large'" });
      data.fontSize = fontSize;
    }
    if (language !== undefined) {
      if (!['uz', 'ru', 'en'].includes(language))
        return res.status(400).json({ success: false, error: "language: 'uz' | 'ru' | 'en'" });
      data.language = language;
    }
    if (notifyNewOrder !== undefined) data.notifyNewOrder = Boolean(notifyNewOrder);
    if (notifyChat !== undefined) data.notifyChat = Boolean(notifyChat);
    if (notifySystem !== undefined) data.notifySystem = Boolean(notifySystem);
    if (notifyApplication !== undefined) data.notifyApplication = Boolean(notifyApplication);

    if (Object.keys(data).length === 0)
      return res.status(400).json({ success: false, error: "Hech qanday o'zgarish yo'q" });

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        theme: true, fontSize: true, language: true,
        notifyNewOrder: true, notifyChat: true, notifySystem: true, notifyApplication: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Parolni o'zgartirish
 * @route   PATCH /api/user/me/change-password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, error: 'currentPassword va newPassword majburiy' });

    if (newPassword.length < 8)
      return res.status(400).json({ success: false, error: "Yangi parol kamida 8 belgi bo'lishi kerak" });
    if (!/(?=.*[a-z])/.test(newPassword))
      return res.status(400).json({ success: false, error: 'Kamida 1 ta kichik harf kerak' });
    if (!/(?=.*[A-Z])/.test(newPassword))
      return res.status(400).json({ success: false, error: 'Kamida 1 ta katta harf kerak' });
    if (!/(?=.*\d)/.test(newPassword))
      return res.status(400).json({ success: false, error: 'Kamida 1 ta raqam kerak' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid)
      return res.status(400).json({ success: false, error: "Hozirgi parol noto'g'ri" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

    res.json({ success: true, message: "Parol muvaffaqiyatli o'zgartirildi" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Parolni tasdiqlash (2-step password change uchun)
 * @route   POST /api/user/me/verify-password
 * @access  Private
 */
export const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Parol kiritilmagan' });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ success: false, error: "Parol noto'g'ri" });

    res.json({ success: true, message: 'Parol tasdiqlandi' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ommaviy user profili
 * @route   GET /api/user/:id
 * @access  Public
 */
export const getPublicUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, name: true,
        username: true, walletId: true, avatar: true,
        isOnline: true, lastSeenAt: true, reliability: true,
        successfulOrders: true, cancelledOrders: true, createdAt: true, role: true,
        providerProfile: {
          select: { id: true, status: true }
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
