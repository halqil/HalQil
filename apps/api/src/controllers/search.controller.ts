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
        providerSkills: { include: { skill: { include: { category: true } } } },
        districts: true,
        portfolio: true,
        schedules: true,
        memberOfOrganizations: {
          where: { status: 'ACTIVE' },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                rating: true,
                reliability: true
              }
            }
          }
        }
      }
    });

    if (!provider || provider.status !== 'APPROVED') {
      return res.status(404).json({ success: false, error: 'Provayder topilmadi' });
    }

    const reviews = await prisma.review.findMany({
      where: { revieweeId: provider.userId },
      include: { reviewer: { select: { name: true, avatar: true } }, skill: { include: { category: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // 1. Skill bo'yicha statistika (o'rtacha reyting, sharhlar soni, ijobiy sharhlar foizi)
    const providerSkillsWithStats = provider.providerSkills.map(ps => {
      const skillReviews = reviews.filter(r => r.skillId === ps.skillId);
      const count = skillReviews.length;
      const averageRating = count > 0 
        ? Number((skillReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) 
        : 0;
      const positiveCount = skillReviews.filter(r => r.isPositive).length;
      const positivePercent = count > 0 
        ? Math.round((positiveCount / count) * 100) 
        : 0;

      return {
        ...ps,
        stats: {
          averageRating,
          reviewCount: count,
          positivePercent
        }
      };
    });

    // 2. Kategoriya bo'yicha statistika (jami o'rtacha reyting, sharhlar soni va ijobiy foizi)
    const categoryStatsMap: Record<string, { categoryId: string, name: string, description: string | null, icon: string | null, skillsCount: number, reviewCount: number, totalRating: number, positiveCount: number }> = {};

    providerSkillsWithStats.forEach(ps => {
      const category = ps.skill.category;
      if (!category) return;

      if (!categoryStatsMap[category.id]) {
        categoryStatsMap[category.id] = {
          categoryId: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          skillsCount: 0,
          reviewCount: 0,
          totalRating: 0,
          positiveCount: 0
        };
      }
      categoryStatsMap[category.id].skillsCount += 1;
      
      const skillReviews = reviews.filter(r => r.skillId === ps.skillId);
      categoryStatsMap[category.id].reviewCount += skillReviews.length;
      categoryStatsMap[category.id].totalRating += skillReviews.reduce((sum, r) => sum + r.rating, 0);
      categoryStatsMap[category.id].positiveCount += skillReviews.filter(r => r.isPositive).length;
    });

    const categoryStats = Object.values(categoryStatsMap).map(cat => {
      const averageRating = cat.reviewCount > 0 
        ? Number((cat.totalRating / cat.reviewCount).toFixed(1)) 
        : 0;
      const positivePercent = cat.reviewCount > 0 
        ? Math.round((cat.positiveCount / cat.reviewCount) * 100) 
        : 0;

      return {
        categoryId: cat.categoryId,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        skillsCount: cat.skillsCount,
        reviewCount: cat.reviewCount,
        averageRating,
        positivePercent
      };
    });

    const allPriceFrom = provider.providerSkills
      .filter(ps => ps.priceFrom != null)
      .map(ps => ps.priceFrom!)
    const allPriceTo = provider.providerSkills
      .filter(ps => ps.priceTo != null)
      .map(ps => ps.priceTo!)
    const priceRange = {
      from: allPriceFrom.length > 0 ? Math.min(...allPriceFrom) : null,
      to: allPriceTo.length > 0 ? Math.max(...allPriceTo) : null
    }

    res.json({ 
      success: true, 
      data: { 
        ...provider, 
        providerSkills: providerSkillsWithStats,
        categoryStats,
        reviews,
        priceRange
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderSkillDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, skillId } = req.params

    const providerSkill = await prisma.providerSkill.findFirst({
      where: {
        providerId: id,
        skillId: skillId,
        isActive: true
      },
      include: {
        skill: {
          include: {
            category: {
              select: { id: true, name: true, description: true }
            }
          }
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                reliability: true,
                isOnline: true
              }
            }
          }
        }
      }
    })

    if (!providerSkill) {
      return res.status(404).json({ success: false, error: 'Xizmat topilmadi' })
    }

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: providerSkill.provider.userId,
        skillId: skillId,
        fromRole: 'USER'
      },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const reviewCount = reviews.length
    const averageRating = reviewCount > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : 0
    const positiveCount = reviews.filter(r => r.isPositive).length
    const positivePercent = reviewCount > 0
      ? Math.round((positiveCount / reviewCount) * 100)
      : 0

    const successfulOrders = await prisma.order.count({
      where: {
        providerId: id,
        skillId: skillId,
        status: 'COMPLETED'
      }
    })

    res.json({
      success: true,
      data: {
        id: providerSkill.id,
        skillId: providerSkill.skillId,
        providerId: providerSkill.providerId,
        skill: providerSkill.skill,
        serviceType: providerSkill.serviceType,
        priceFrom: providerSkill.priceFrom,
        priceTo: providerSkill.priceTo,
        priceNote: providerSkill.priceNote,
        experienceYears: providerSkill.experienceYears,
        description: providerSkill.description,
        provider: {
          id: providerSkill.provider.id,
          name: providerSkill.provider.user.name,
          avatar: providerSkill.provider.user.avatar,
          reliability: providerSkill.provider.user.reliability,
          isOnline: providerSkill.provider.user.isOnline
        },
        stats: {
          averageRating,
          reviewCount,
          positivePercent,
          successfulOrders
        },
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          isPositive: r.isPositive,
          createdAt: r.createdAt,
          reviewer: {
            id: r.reviewer.id,
            name: r.reviewer.name,
            avatar: r.reviewer.avatar
          }
        }))
      }
    })
  } catch (error) {
    next(error)
  }
}
