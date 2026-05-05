import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

// Extend Express Request object to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

/**
 * @desc    Verify authentication token and set req.user
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token topilmadi', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    
    // Check if user is frozen or blocked
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Foydalanuvchi topilmadi', code: 'UNAUTHORIZED' });
    }
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, error: 'Hisob bloklangan', code: 'FORBIDDEN' });
    }
    if (user.status === 'FROZEN') {
      return res.status(403).json({ success: false, error: 'Hisob muzlatilgan', code: 'FORBIDDEN' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token yaroqsiz', code: 'UNAUTHORIZED' });
  }
};

/**
 * @desc    Check user role for authorization
 * @param   roles Allowed roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Tasdiqlanmagan', code: 'UNAUTHORIZED' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Ruxsat etilmagan', code: 'FORBIDDEN' });
    }

    next();
  };
};
