import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// ------------------------ CATEGORY ------------------------

/**
 * @desc    Kategoriyalarni olish (status/search filter, counts)
 * @route   GET /api/admin/categories
 * @access  SUPER_ADMIN
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'all', search } = req.query as Record<string, string>;

    const where: any = {};
    if (status === 'active')   where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const categories = await prisma.category.findMany({
      where,
      include: {
        skills: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { providerSkills: true } } }
        },
        _count: { select: { skills: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // providersCount: distinct provayderlar soni (ProviderSkill orqali)
    const enriched = await Promise.all(categories.map(async (cat) => {
      const providersCount = await prisma.providerSkill.count({
        where: { skill: { categoryId: cat.id } }
      });
      const ordersCount = await prisma.order.count({
        where: { skill: { categoryId: cat.id } }
      });
      const organizationsCount = await prisma.organizationSkill.count({
        where: { skill: { categoryId: cat.id } }
      })
      return { ...cat, providersCount, ordersCount, organizationsCount }
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Yangi kategoriya yaratish
 * @route   POST /api/admin/categories
 * @access  SUPER_ADMIN
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon } = req.body;

    const existing = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Kategoriya nomi allaqachon mavjud', code: 'DUPLICATE_CATEGORY' });
    }

    const category = await prisma.category.create({
      data: { name, description, icon }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kategoriyani tahrirlash
 * @route   PATCH /api/admin/categories/:id
 * @access  SUPER_ADMIN
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi', code: 'NOT_FOUND' });

    if (name && name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await prisma.category.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } }
      });
      if (existing) return res.status(400).json({ success: false, error: 'Kategoriya nomi allaqachon mavjud', code: 'DUPLICATE_CATEGORY' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kategoriya holatini toggle (isActive) — skilllar ham birga o'zgaradi
 * @route   PATCH /api/admin/categories/:id/toggle
 * @access  SUPER_ADMIN
 */
export const toggleCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi', code: 'NOT_FOUND' });

    const newActive = !category.isActive;

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: newActive }
    });

    // Barcha skilllarni ham bir xil holat qil
    await prisma.skill.updateMany({
      where: { categoryId: id },
      data: { isActive: newActive }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kategoriya provayderlarini olish
 * @route   GET /api/admin/categories/:id/providers
 * @access  SUPER_ADMIN
 */
export const getCategoryProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [providerSkills, total] = await Promise.all([
      prisma.providerSkill.findMany({
        where: { skill: { categoryId: id } },
        include: {
          provider: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, username: true, avatar: true, isOnline: true } },
              _count: { select: { orders: true } }
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { provider: { user: { createdAt: 'desc' } } }
      }),
      prisma.providerSkill.count({ where: { skill: { categoryId: id } } })
    ]);

    // Deduplicate by providerId + avgRating
    const seen = new Set<string>();
    const providers = [];
    for (const ps of providerSkills) {
      if (seen.has(ps.provider.id)) continue;
      seen.add(ps.provider.id);

      const reviews = await prisma.review.aggregate({
        where: { reviewee: { providerProfile: { id: ps.provider.id } } },
        _avg: { rating: true }
      });

      providers.push({
        id: ps.provider.id,
        user: ps.provider.user,
        reliability: 0,
        avgRating: reviews._avg.rating ?? 0,
        ordersCount: ps.provider._count.orders,
        experienceYears: ps.experienceYears,
        priceFrom: ps.priceFrom,
        priceTo: ps.priceTo,
      });
    }

    res.json({ success: true, data: { providers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kategoriya o'chirishni tekshirish
 * @route   GET /api/admin/categories/:id/check-delete
 * @access  SUPER_ADMIN
 */
export const checkCategoryDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const providersCount = await prisma.providerSkill.count({
      where: { skill: { categoryId: id }, provider: { status: 'APPROVED' } }
    });

    res.json({ success: true, data: { canDelete: providersCount === 0, providersCount } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kategoriyani o'chirish (cascade)
 * @route   DELETE /api/admin/categories/:id
 * @access  SUPER_ADMIN
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { skills: true } } } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi', code: 'NOT_FOUND' });

    const providersCount = await prisma.providerSkill.count({
      where: { skill: { categoryId: id }, provider: { status: 'APPROVED' } }
    });

    if (providersCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Bu kategoriyada ${providersCount} ta aktiv provayder bor. Avval ularni boshqa kategoriyaga ko'chiring.`,
        code: 'HAS_ACTIVE_PROVIDERS',
        providersCount
      });
    }

    // Cascade delete
    const skillIds = (await prisma.skill.findMany({ where: { categoryId: id }, select: { id: true } })).map(s => s.id);

    if (skillIds.length > 0) {
      await prisma.providerApplicationSkill.deleteMany({ where: { skillId: { in: skillIds } } });
      await prisma.providerSkill.deleteMany({ where: { skillId: { in: skillIds } } });
      await prisma.skill.deleteMany({ where: { categoryId: id } });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, data: { message: 'Kategoriya o\'chirildi' } });
  } catch (error) {
    next(error);
  }
};



// ------------------------ SKILL ------------------------

/**
 * @desc    Ko'nikmalarni (Skills) olish
 * @route   GET /api/admin/skills
 * @access  SUPER_ADMIN
 */
export const getSkills = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category_id, is_active } = req.query;

    let filter: any = {};
    if (category_id) filter.categoryId = category_id as string;
    if (is_active !== undefined) filter.isActive = is_active === 'true';

    const skills = await prisma.skill.findMany({
      where: filter,
      include: {
        category: true,
        _count: { select: { providerSkills: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Yangi ko'nikma yaratish
 * @route   POST /api/admin/skills
 * @access  SUPER_ADMIN
 */
export const createSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, name, description } = req.body;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi', code: 'NOT_FOUND' });
    if (!category.isActive) return res.status(400).json({ success: false, error: 'Nofaol kategoriyaga skill qo\'shib bo\'lmaydi', code: 'CATEGORY_INACTIVE' });

    const skill = await prisma.skill.create({
      data: { categoryId, name, description }
    });

    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ko'nikmani tahrirlash
 * @route   PATCH /api/admin/skills/:id
 * @access  SUPER_ADMIN
 */
export const updateSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi', code: 'NOT_FOUND' });

    if (name && name.toLowerCase() !== skill.name.toLowerCase()) {
      const existing = await prisma.skill.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, categoryId: skill.categoryId, id: { not: id } }
      });
      if (existing) return res.status(400).json({ success: false, error: 'Bu kategoriyada bunday nomli skill mavjud', code: 'DUPLICATE_SKILL' });
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ko'nikma holatini o'zgartirish (Faol/Nofaol) — kategoriyadan mustaqil
 * @route   PATCH /api/admin/skills/:id/toggle
 * @access  SUPER_ADMIN
 */
export const toggleSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({ where: { id }, include: { category: true } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi', code: 'NOT_FOUND' });

    if (!skill.isActive && !skill.category.isActive) {
       return res.status(400).json({ success: false, error: 'Nofaol kategoriyadagi skillni aktivlashtirib bo\'lmaydi', code: 'CATEGORY_INACTIVE' });
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: { isActive: !skill.isActive }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skill provayderlarini olish
 * @route   GET /api/admin/skills/:id/providers
 * @access  SUPER_ADMIN
 */
export const getSkillProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [providerSkills, total] = await Promise.all([
      prisma.providerSkill.findMany({
        where: { skillId: id },
        include: {
          provider: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, username: true, avatar: true, isOnline: true } },
              _count: { select: { orders: true } }
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { provider: { user: { createdAt: 'desc' } } }
      }),
      prisma.providerSkill.count({ where: { skillId: id } })
    ]);

    const providers = providerSkills.map(ps => ({
      id: ps.provider.id,
      user: ps.provider.user,
      ordersCount: ps.provider._count.orders,
      experienceYears: ps.experienceYears,
      priceFrom: ps.priceFrom,
      priceTo: ps.priceTo,
    }));

    res.json({ success: true, data: { providers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skill o'chirishni tekshirish
 * @route   GET /api/admin/skills/:id/check-delete
 * @access  SUPER_ADMIN
 */
export const checkSkillDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const providersCount = await prisma.providerSkill.count({
      where: { skillId: id, provider: { status: 'APPROVED' } }
    });

    res.json({ success: true, data: { canDelete: providersCount === 0, providersCount } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skillni o'chirish (cascade)
 * @route   DELETE /api/admin/skills/:id
 * @access  SUPER_ADMIN
 */
export const deleteSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi', code: 'NOT_FOUND' });

    const providersCount = await prisma.providerSkill.count({
      where: { skillId: id, provider: { status: 'APPROVED' } }
    });

    if (providersCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Bu skillda ${providersCount} ta aktiv provayder bor. Avval ularni boshqa skillga ko'chiring.`,
        code: 'HAS_ACTIVE_PROVIDERS',
        providersCount
      });
    }

    await prisma.providerApplicationSkill.deleteMany({ where: { skillId: id } });
    await prisma.providerSkill.deleteMany({ where: { skillId: id } });
    await prisma.skill.delete({ where: { id } });

    res.json({ success: true, data: { message: 'Skill o\'chirildi' } });
  } catch (error) {
    next(error);
  }
};



/**
 * @desc    Provayder arizalarini olish
 * @route   GET /api/admin/applications
 * @access  SUPER_ADMIN
 */
export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      search,
      page = '1',
      limit = '20'
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const userWhere: any = {};
    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // status filter: agar ko'rsatilmasa yoki 'ALL' bo'lsa — hammasi
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) where.user = userWhere;

    const [applications, total] = await Promise.all([
      prisma.providerApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, username: true,
              name: true, email: true, avatar: true, walletId: true,
              isOnline: true, createdAt: true, reliability: true
            }
          },
          reviewer: {
            select: { id: true, firstName: true, lastName: true, name: true }
          },
          _count: { select: { skills: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.providerApplication.count({ where })
    ]);

    const data = applications.map(a => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      user: a.user,
      skillsCount: a._count.skills,
      districts: a.workDistricts,
      reviewedBy: a.reviewer ? { id: a.reviewer.id, name: a.reviewer.name, firstName: a.reviewer.firstName, lastName: a.reviewer.lastName } : null,
      reviewedAt: a.reviewedAt,
      adminMessage: a.adminMessage,
    }));

    res.json({ success: true, data: { applications: data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Bitta ariza batafsil
 * @route   GET /api/admin/applications/:id
 * @access  SUPER_ADMIN
 */
export const getApplicationDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const application = await prisma.providerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, username: true,
            name: true, email: true, avatar: true, walletId: true,
            isOnline: true, createdAt: true, reliability: true,
            successfulOrders: true, cancelledOrders: true
          }
        },
        reviewer: {
          select: { id: true, name: true, firstName: true, lastName: true }
        },
        skills: {
          include: {
            skill: { include: { category: { select: { id: true, name: true } } } }
          }
        }
      }
    });

    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi' });

    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Arizani tasdiqlash
 * @route   PATCH /api/admin/applications/:id/approve
 * @access  SUPER_ADMIN
 */
export const approveApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user?.userId as string;

    if (!message?.trim()) return res.status(400).json({ success: false, error: 'Xabar majburiy' });

    const application = await prisma.providerApplication.findUnique({
      where: { id },
      include: { skills: true, user: true }
    });
    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi' });
    if (application.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilgan' });

    await prisma.$transaction(async (tx) => {
      // 1. Ariza statusini yangilash
      await tx.providerApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminMessage: message.trim()
        }
      });

      // 2. User rolini PROVIDER qilish
      await tx.user.update({ where: { id: application.userId }, data: { role: 'PROVIDER' } });

      // 3. ProviderProfile yaratish
      const profile = await tx.providerProfile.upsert({
        where: { userId: application.userId },
        update: { status: 'APPROVED', applicationId: id, serviceType: 'INDEPENDENT' },
        create: {
          userId: application.userId,
          serviceType: 'INDEPENDENT',
          status: 'APPROVED',
          applicationId: id,
          bio: null
        }
      });

      // 4. ProviderSkill lar yaratish
      if (application.skills.length > 0) {
        await tx.providerSkill.deleteMany({ where: { providerId: profile.id } });
        await tx.providerSkill.createMany({
          data: application.skills.map(s => ({
            providerId: profile.id,
            skillId: s.skillId,
            serviceType: s.serviceType as any,
            experienceYears: s.experienceYears,
            priceFrom: s.priceFrom,
            priceTo: s.priceTo,
            isActive: true
          }))
        });
      }

      // 5. ProviderDistrict lar yaratish
      if (application.workDistricts.length > 0) {
        await tx.providerDistrict.deleteMany({ where: { providerId: profile.id } });
        await tx.providerDistrict.createMany({
          data: application.workDistricts.map(d => ({
            providerId: profile.id,
            districtName: d
          }))
        });
      }

      // 6. User ga notification
      await tx.notification.create({
        data: {
          userId: application.userId,
          title: 'Arizangiz tasdiqlandi! 🎉',
          message: message.trim(),
          type: 'APPLICATION_RESPONSE',
          link: '/provider/dashboard',
          isGlobal: false
        }
      });
    });

    // 7. Admin chat yaratish (transaction tashqarisida)
    let chat = await prisma.adminChat.findFirst({
      where: { adminId, targetUserId: application.userId }
    });
    if (!chat) {
      chat = await prisma.adminChat.create({
        data: { adminId, targetUserId: application.userId }
      });
    }
    await prisma.adminChatMessage.create({
      data: { chatId: chat.id, senderId: adminId, content: message.trim() }
    });

    res.json({ success: true, data: { message: 'Ariza tasdiqlandi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Arizani rad etish
 * @route   PATCH /api/admin/applications/:id/reject
 * @access  SUPER_ADMIN
 */
export const rejectApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) return res.status(400).json({ success: false, error: 'Rad etish sababini kiritish majburiy' });

    const application = await prisma.providerApplication.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi' });
    if (application.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilgan' });

    await prisma.providerApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionNote: reason.trim(),
        reviewedBy: req.user?.userId,
        reviewedAt: new Date(),
        adminMessage: reason.trim()
      }
    });

    await prisma.notification.create({
      data: {
        userId: application.userId,
        title: 'Arizangiz rad etildi',
        message: reason.trim(),
        type: 'APPLICATION_RESPONSE',
        link: '/profile',
        isGlobal: false
      }
    });

    res.json({ success: true, data: { message: 'Ariza rad etildi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ariza bo'yicha admin chat ochish
 * @route   PATCH /api/admin/applications/:id/open-chat
 * @access  SUPER_ADMIN
 */
export const openApplicationChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user?.userId as string;

    if (!message?.trim()) return res.status(400).json({ success: false, error: 'Xabar majburiy' });

    const application = await prisma.providerApplication.findUnique({ where: { id } });
    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi' });

    let chat = await prisma.adminChat.findFirst({
      where: { adminId, targetUserId: application.userId }
    });
    if (!chat) {
      chat = await prisma.adminChat.create({
        data: { adminId, targetUserId: application.userId }
      });
    }

    await prisma.adminChatMessage.create({
      data: { chatId: chat.id, senderId: adminId, content: message.trim() }
    });

    await prisma.notification.create({
      data: {
        userId: application.userId,
        type: 'DIRECT_MESSAGE' as any,
        title: 'Admin sizga savol bermoqchi',
        message: message.trim().slice(0, 80),
        link: `/admin-chat/${chat.id}`,
        senderId: adminId,
        isGlobal: false
      }
    });

    res.json({ success: true, data: { chatId: chat.id } });
  } catch (error) {
    next(error);
  }
};



// ─── ORGANIZATION APPLICATIONS (by SUPER_ADMIN) ──────────────────────────────

/**
 * @desc    Tashkilot arizalarini olish
 * @route   GET /api/admin/organization-applications
 * @access  SUPER_ADMIN
 */
export const getOrgApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const apps = await prisma.organizationApplication.findMany({
      where: status ? { status: status as any } : {},
      include: {
        provider: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: apps });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot arizasini tasdiqlash
 * @route   POST /api/admin/organization-applications/:id/approve
 * @access  SUPER_ADMIN
 */
export const approveOrgApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const app = await prisma.organizationApplication.findUnique({
      where: { id },
      include: { provider: { include: { user: true } } }
    });
    if (!app) return res.status(404).json({ success: false, error: 'Ariza topilmadi' });
    if (app.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilgan' });

    await prisma.$transaction(async (tx) => {
      // Create the organization
      const org = await tx.organization.create({
        data: {
          name: app.name,
          description: app.description,
          adminProviderId: app.providerId,
        }
      });

      // Add provider as first member (ACTIVE)
      await tx.organizationMember.create({
        data: { organizationId: org.id, providerId: app.providerId, status: 'ACTIVE' }
      });

      // Mark application as approved
      await tx.organizationApplication.update({ where: { id }, data: { status: 'APPROVED' } });
    });

    // Notify provider
    await prisma.notification.create({
      data: {
        userId: app.provider.userId,
        title: 'Tashkilot arizangiz tasdiqlandi! 🎉',
        message: `"${app.name}" tashkilotingiz muvaffaqiyatli yaratildi. Siz endi tashkilot admini hisoblanasiz.`
      }
    });

    res.json({ success: true, data: { message: 'Tashkilot yaratildi va ariza tasdiqlandi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot arizasini rad etish
 * @route   POST /api/admin/organization-applications/:id/reject
 * @access  SUPER_ADMIN
 */
export const rejectOrgApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rejection_note } = req.body;
    if (!rejection_note) return res.status(400).json({ success: false, error: 'Rad etish sababi majburiy' });

    const app = await prisma.organizationApplication.findUnique({
      where: { id }, include: { provider: { include: { user: true } } }
    });
    if (!app) return res.status(404).json({ success: false, error: 'Ariza topilmadi' });
    if (app.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilgan' });

    await prisma.organizationApplication.update({ where: { id }, data: { status: 'REJECTED', rejectionNote: rejection_note } });

    await prisma.notification.create({
      data: {
        userId: app.provider.userId,
        title: 'Tashkilot arizangiz rad etildi',
        message: `"${app.name}" uchun ariza rad etildi. Sabab: ${rejection_note}`
      }
    });

    res.json({ success: true, data: { message: 'Ariza rad etildi' } });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Manage Organizations ──────────────────────────────────────────────

/**
 * @desc    Tashkilotlarni olish (Admin uchun)
 * @route   GET /api/admin/organizations
 * @access  SUPER_ADMIN
 */
export const getAdminOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        adminProvider: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { members: true, orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot ma'lumotlarini tahrirlash (Admin)
 * @route   PUT /api/admin/organizations/:id
 * @access  SUPER_ADMIN
 */
export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, logo } = req.body;
    const org = await prisma.organization.update({ where: { id }, data: { name, description, logo } });
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot holatini o'zgartirish (Faol/Nofaol)
 * @route   PATCH /api/admin/organizations/:id/toggle
 * @access  SUPER_ADMIN
 */
export const toggleOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) return res.status(404).json({ success: false, error: 'Tashkilot topilmadi' });
    const updated = await prisma.organization.update({ where: { id }, data: { isActive: !org.isActive } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

/**
 * @desc    Barcha foydalanuvchilarni olish (pagination, sort, search)
 * @route   GET /api/admin/users
 * @access  SUPER_ADMIN
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'username', 'email', 'walletId'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const where: any = { status: { not: 'DELETED' } };

    if (role) where.role = role;

    if (search) {
      where.OR = [
        { walletId: { contains: search } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          walletId: true,
          reliability: true,
          successfulOrders: true,
          cancelledOrders: true,
          isOnline: true,
          lastSeenAt: true,
          createdAt: true,
        },
        orderBy: { [orderField]: orderDir },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Foydalanuvchi tafsilotlarini olish
 * @route   GET /api/admin/users/:id
 * @access  SUPER_ADMIN
 */
export const getUserDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        providerProfile: true,
        _count: { select: { ordersAsUser: true, reviewsGiven: true } }
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Foydalanuvchi rolini o'zgartirish
 * @route   PATCH /api/admin/users/:id/role
 * @access  SUPER_ADMIN
 */
export const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Foydalanuvchi statusini o'zgartirish (Muzlatish, Bloklash, va h.k.)
 * @route   PATCH /api/admin/users/:id/status
 * @access  SUPER_ADMIN
 */
export const changeUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE', 'FROZEN', 'BLOCKED'

    if (id === req.user?.userId) {
      return res.status(400).json({ success: false, error: 'O\'zingizni bloklay olmaysiz' });
    }

    const updated = await prisma.user.update({ where: { id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Foydalanuvchini o'chirish (Soft delete)
 * @route   DELETE /api/admin/users/:id
 * @access  SUPER_ADMIN
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id === req.user?.userId) {
      return res.status(400).json({ success: false, error: 'O\'zingizni o\'chira olmaysiz' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Foydalanuvchi to\'liq o\'chirildi' } });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN CHATS ──────────────────────────────────────────────────────────────

/**
 * @desc    Barcha admin chatlarini olish
 * @route   GET /api/admin/chats
 * @access  SUPER_ADMIN
 */
export const getAdminChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    const chats = await prisma.adminChat.findMany({
      include: {
        targetUser: { select: { id: true, name: true, avatar: true, email: true, username: true, walletId: true, role: true, isOnline: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Yangi admin chat yaratish (yoki mavjudini olish) + birinchi xabar
 * @route   POST /api/admin/chats
 * @access  SUPER_ADMIN
 */
export const createAdminChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId as string;
    const { targetUserId, initialMessage } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'targetUserId majburiy' });
    }
    if (!initialMessage?.trim()) {
      return res.status(400).json({ success: false, error: 'initialMessage majburiy' });
    }

    // Mavjud chatni qidirish yoki yangi yaratish
    let chat = await prisma.adminChat.findFirst({
      where: { adminId, targetUserId }
    });

    if (!chat) {
      chat = await prisma.adminChat.create({
        data: { adminId, targetUserId }
      });
    }

    // Birinchi xabarni saqlash
    await prisma.adminChatMessage.create({
      data: { chatId: chat.id, senderId: adminId, content: initialMessage.trim() }
    });

    // Target user ga notification
    const preview = initialMessage.trim().slice(0, 50);
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'DIRECT_MESSAGE' as any,
        title: 'Admin sizga xabar yubordi',
        message: preview,
        link: `/admin-chat`,
        senderId: adminId,
        isGlobal: false
      }
    });

    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Admin chat xabarlarini olish
 * @route   GET /api/admin/chats/:id/messages
 * @access  SUPER_ADMIN
 */
export const getAdminChatMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const messages = await prisma.adminChatMessage.findMany({
      where: { chatId: id },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Admin chatga xabar yuborish
 * @route   POST /api/admin/chats/:id/messages
 * @access  SUPER_ADMIN
 */
export const sendAdminChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const senderId = req.user?.userId as string;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'content majburiy' });
    }

    const message = await prisma.adminChatMessage.create({
      data: { chatId: id, senderId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true, role: true } } }
    });

    // Target user ga notification
    const chat = await prisma.adminChat.findUnique({ where: { id } });
    if (chat) {
      await prisma.notification.create({
        data: {
          userId: chat.targetUserId,
          type: 'DIRECT_MESSAGE' as any,
          title: 'Admin yangi xabar yubordi',
          message: content.trim().slice(0, 50),
          link: `/admin-chat`,
          senderId,
          isGlobal: false
        }
      });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};


// ─── ADMIN NOTIFICATIONS ──────────────────────────────────────────────────────

/**
 * @desc    Barcha yoki ma'lum rolga notification yuborish
 * @route   POST /api/admin/notifications/broadcast
 * @access  SUPER_ADMIN
 */
export const broadcastNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, title, message, targetRole } = req.body;
    const senderId = req.user?.userId;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title va message majburiy' });
    }

    if (targetRole && targetRole !== 'ALL') {
      // Ma'lum rol uchun: faqat shu roldagi userlarga individual yuboriladi
      const users = await prisma.user.findMany({
        where: { role: targetRole },
        select: { id: true }
      });

      const notifications = users.map(u => ({
        userId: u.id,
        type: (type || 'ANNOUNCEMENT') as any,
        title,
        message,
        senderId,
        isGlobal: false
      }));

      await prisma.notification.createMany({ data: notifications });

      return res.json({
        success: true,
        data: { message: `${notifications.length} ta ${targetRole} ga yuborildi` }
      });
    }

    // Barcha userlar uchun: isGlobal = true, userId = null — bitta yozuv
    // Hozirgi va kelajakdagi barcha userlar ko'radi
    await prisma.notification.create({
      data: {
        userId: null,
        isGlobal: true,
        type: (type || 'ANNOUNCEMENT') as any,
        title,
        message,
        senderId
      }
    });

    res.json({ success: true, data: { message: 'Barcha foydalanuvchilarga global notification yuborildi' } });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Bitta foydalanuvchiga notification yuborish
 * @route   POST /api/admin/notifications/send
 * @access  SUPER_ADMIN
 */
export const sendNotificationToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type, title, message } = req.body;
    const senderId = req.user?.userId;

    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, error: 'userId, title va message majburiy' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: (type || 'SYSTEM') as any,
        title,
        message,
        senderId,
        isGlobal: false
      }
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};


