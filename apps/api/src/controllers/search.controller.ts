import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * @desc    Tasdiqlangan mutaxassislarni izlash va filtrlash
 * @route   GET /api/search
 * @access  Public
 */
export const getProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category_id, skill_id, district, service_type, sort } = req.query;

    let filter: any = {
      status: 'APPROVED',
      user: { status: 'ACTIVE' }
    };

    if (service_type && service_type !== 'BOTH') {
      filter.OR = [
        { serviceType: service_type },
        { serviceType: 'BOTH' }
      ];
    }

    if (district) {
      filter.districts = {
        some: { districtName: { contains: district as string, mode: 'insensitive' } }
      };
    }

    if (skill_id) {
      filter.providerSkills = {
        some: { skillId: skill_id as string, isActive: true }
      };
    } else if (category_id) {
      filter.providerSkills = {
        some: { skill: { categoryId: category_id as string }, isActive: true }
      };
    }

    let orderBy: any = { user: { reliability: 'desc' } }
    if (sort === 'rating') {
      orderBy = { rating: 'desc' }
    } else if (sort === 'completed_orders') {
      orderBy = [
        { successfulOrders: 'desc' }
      ]
    } else if (sort === 'skills_count') {
      orderBy = [
        { providerSkills: { _count: 'desc' } }
      ]
    } else if (sort === 'reliability') {
      orderBy = { user: { reliability: 'desc' } }
    }

    const providers = await prisma.providerProfile.findMany({
      where: filter,
      include: {
        user: { select: { id: true, name: true, avatar: true, reliability: true } },
        providerSkills: {
          include: { skill: true }
        },
        districts: true,
        _count: { select: { orders: { where: { status: 'COMPLETED' } } } }
      },
      orderBy
    });

    const mappedProviders = providers.map(p => ({
      id: p.id,
      name: p.user.name,
      avatar: p.user.avatar,
      reliability: p.user.reliability,
      rating: p.rating,
      service_type: p.serviceType,
      skills: p.providerSkills.map(ps => ({
        id: ps.skill.id,
        name: ps.skill.name,
        price_from: ps.priceFrom,
        price_to: ps.priceTo
      })),
      districts: p.districts.map(d => d.districtName),
      completed_orders: p._count.orders
    }));

    res.json({ success: true, data: mappedProviders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Provayder profilini (batafsil ma'lumot va sharhlar bilan) olish
 * @route   GET /api/search/:id
 * @access  Public
 */
export const getProviderDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const provider = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true, username: true, walletId: true, isOnline: true, lastSeenAt: true, avatar: true, reliability: true, createdAt: true } },
        providerSkills: { include: { skill: true } },
        districts: true,
        portfolio: true,
        schedules: true
      }
    });

    if (!provider || provider.status !== 'APPROVED') {
      return res.status(404).json({ success: false, error: 'Provayder topilmadi' });
    }

    const reviews = await prisma.review.findMany({
      where: { revieweeId: provider.userId },
      include: { reviewer: { select: { name: true, avatar: true } }, skill: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { ...provider, reviews } });
  } catch (error) {
    next(error);
  }
};
