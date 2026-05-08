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

    // Phone format: +998XXXXXXXXX
    const formattedPhone = phone.startsWith('+998') ? phone : '+998' + phone;

    // Phone unique tekshirish
    const existingPhone = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan",
      });
    }

    // Username unique tekshirish
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: 'Bu username band, boshqa username tanlang',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    function generateWalletId(): string {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        phone: formattedPhone,
        username: username.toLowerCase(),
        password: hashedPassword,
        walletId: generateWalletId(),
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const { accessToken, refreshToken } = generateTokens({ userId: user.id, role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletId: user.walletId,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
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

    let user = null;

    // Tel raqam tekshirish
    if (/^[\+]?[0-9]{9,13}$/.test(login.replace(/\s/g, ''))) {
      let phone = login.replace(/\s/g, '');
      if (!phone.startsWith('+998') && phone.length === 9) {
        phone = '+998' + phone;
      }
      user = await prisma.user.findUnique({ where: { phone } });
    }
    // Email tekshirish
    else if (login.includes('@') && login.includes('.')) {
      user = await prisma.user.findUnique({
        where: { email: login.toLowerCase() },
      });
    }
    // Username tekshirish
    else {
      user = await prisma.user.findUnique({
        where: { username: login.toLowerCase() },
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Login yoki parol noto'g'ri",
      });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        error: "Hisobingiz bloklangan. Admin bilan bog'laning",
      });
    }

    if (user.status === 'FROZEN') {
      return res.status(403).json({
        success: false,
        error: 'Hisobingiz vaqtinchalik muzlatilgan',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Login yoki parol noto'g'ri",
      });
    }

    // isOnline = true
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens({ userId: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletId: user.walletId,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          username: user.username,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        accessToken,
        refreshToken,
      },
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
        return res.status(401).json({ success: false, error: 'Yaroqsiz token' });
      }

      const tokens = generateTokens({ userId: user.id, role: user.role });

      return res.json({ success: true, data: tokens });
    } catch {
      return res.status(401).json({ success: false, error: 'Yaroqsiz token' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tizimdan chiqish
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user && req.user.userId) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { isOnline: false, lastSeenAt: new Date() },
      });
    }
    return res.json({ success: true, data: { message: 'Tizimdan chiqildi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Username mavjudligini tekshirish
 * @route   GET /api/auth/check-username
 * @access  Public
 */
export const checkUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username kiritilmagan' });
    }
    const existing = await prisma.user.findUnique({
      where: { username: String(username).toLowerCase() },
    });
    return res.json({ success: true, data: { available: !existing } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Telefon raqam mavjudligini tekshirish
 * @route   GET /api/auth/check-phone
 * @access  Public
 */
export const checkPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Telefon kiritilmagan' });
    }
    let formattedPhone = String(phone).replace(/\s/g, '');
    if (!formattedPhone.startsWith('+998') && formattedPhone.length === 9) {
      formattedPhone = '+998' + formattedPhone;
    }
    const existing = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    return res.json({ success: true, data: { available: !existing } });
  } catch (error) {
    next(error);
  }
};
