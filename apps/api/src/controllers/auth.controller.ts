import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateTokens, verifyRefreshToken } from '../lib/jwt';

/**
 * @desc    Foydalanuvchini ro'yxatdan o'tkazish
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, username, password } = req.body;

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ success: false, error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ success: false, error: 'Ushbu username band', code: 'USERNAME_IN_USE' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();

    function generateWalletId(): string {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    const walletId = generateWalletId();

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name,
        username,
        phone,
        password: hashedPassword,
        role: 'USER',
        walletId,
      }
    });

    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tizimga kirish
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { login, password } = req.body;

    let user;

    if (/^\+998[0-9]{9}$/.test(login) || /^[0-9]{9}$/.test(login)) {
      const phone = login.startsWith('+998') ? login : '+998' + login;
      user = await prisma.user.findUnique({ where: { phone } });
    } else if (login.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: login } });
    } else {
      user = await prisma.user.findUnique({ where: { username: login } });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: "Login yoki parol noto'g'ri", code: 'INVALID_CREDENTIALS' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, error: 'Hisob bloklangan', code: 'FORBIDDEN' });
    }
    if (user.status === 'FROZEN') {
      return res.status(403).json({ success: false, error: 'Hisob muzlatilgan', code: 'FORBIDDEN' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Login yoki parol noto'g'ri", code: 'INVALID_CREDENTIALS' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() }
    });

    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, username: user.username, phone: user.phone, email: user.email, role: user.role, walletId: user.walletId },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tokenni yangilash
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      
      if (!user || user.status === 'BLOCKED' || user.status === 'FROZEN') {
        return res.status(401).json({ success: false, error: 'Yaroqsiz token', code: 'UNAUTHORIZED' });
      }

      const tokens = generateTokens({ userId: user.id, role: user.role });

      res.json({
        success: true,
        data: tokens
      });
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Yaroqsiz token', code: 'UNAUTHORIZED' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tizimdan chiqish
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If the user ID is in the request (e.g. from auth middleware), set them offline
    if (req.user && req.user.userId) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { isOnline: false, lastSeenAt: new Date() }
      });
    }

    res.json({ success: true, data: { message: 'Tizimdan chiqildi' } });
  } catch (error) {
    next(error);
  }
};

export const checkUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, error: 'Username kiritilmadi' });
    }
    
    const user = await prisma.user.findUnique({ where: { username } });
    res.json({ success: true, data: { available: !user } });
  } catch (error) {
    next(error);
  }
};

export const checkPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.query;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Telefon raqam kiritilmadi' });
    }

    let searchPhone = phone;
    if (/^[0-9]{9}$/.test(phone)) {
      searchPhone = '+998' + phone;
    }
    
    const user = await prisma.user.findUnique({ where: { phone: searchPhone } });
    res.json({ success: true, data: { available: !user } });
  } catch (error) {
    next(error);
  }
};
