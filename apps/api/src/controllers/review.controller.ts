import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * @desc    Buyurtma uchun sharh qoldirish
 * @route   POST /api/reviews
 * @access  Private (USER, PROVIDER)
 */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { order_id, rating, comment } = req.body;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { provider: true }
    });

    if (!order) return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Faqat yakunlangan buyurtmaga sharh qoldirish mumkin' });
    }

    const isUserReviewing = order.userId === userId && role === 'USER';
    const isProviderReviewing = order.provider.userId === userId && role === 'PROVIDER';

    if (!isUserReviewing && !isProviderReviewing) {
      return res.status(403).json({ success: false, error: 'Ushbu buyurtmaga sharh qoldirish ruxsat etilmagan' });
    }

    const revieweeId = isUserReviewing ? order.provider.userId : order.userId;
    const fromRole = isUserReviewing ? 'USER' : 'PROVIDER';

    const existingReview = await prisma.review.findFirst({
      where: { orderId: order_id, reviewerId: userId }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, error: 'Siz allaqachon sharh qoldirgansiz' });
    }

    const review = await prisma.review.create({
      data: {
        orderId: order_id,
        reviewerId: userId,
        revieweeId,
        skillId: order.skillId,
        rating,
        comment,
        fromRole
      }
    });

    if (fromRole === 'USER') {
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: revieweeId }
      })
      if (providerProfile) {
        const avgResult = await prisma.review.aggregate({
          where: { revieweeId, fromRole: 'USER' },
          _avg: { rating: true }
        })
        await prisma.providerProfile.update({
          where: { userId: revieweeId },
          data: { rating: avgResult._avg.rating ?? 0 }
        })
      }
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};
