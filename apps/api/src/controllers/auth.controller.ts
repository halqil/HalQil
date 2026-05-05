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
    const { firstName, lastName, username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, error: 'Ushbu email bilan foydalanuvchi mavjud', code: 'EMAIL_IN_USE' });
      }
      return res.status(400).json({ success: false, error: 'Ushbu username band', code: 'USERNAME_IN_USE' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name,
        username,
        email,
        password: hashedPassword,
        role: 'USER',
      }
    });

    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
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
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Email yoki parol xato', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, error: 'Hisob bloklangan', code: 'FORBIDDEN' });
    }
    if (user.status === 'FROZEN') {
      return res.status(403).json({ success: false, error: 'Hisob muzlatilgan', code: 'FORBIDDEN' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Email yoki parol xato', code: 'INVALID_CREDENTIALS' });
    }

    // Set online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() }
    });

    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, walletId: user.walletId },
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
