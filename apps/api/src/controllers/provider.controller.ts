import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendNotification } from './organization.controller';

// ─── Apply for Provider ───────────────────────────────────────────────────────
/**
 * @desc    Provayder bo'lish uchun ariza topshirish
 * @route   POST /api/provider/apply
 * @access  Private (USER)
 */
export const applyForProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { aboutMe, whyJoin, portfolioLink, workDistricts, dailyLimit, categoryId, skills } = req.body;

    // ─── Validatsiya ──────────────────────────────────────────────────────────
    if (!aboutMe || aboutMe.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'aboutMe kamida 50 belgi bo\'lishi kerak' });
    }
    if (!whyJoin || whyJoin.trim().length < 30) {
      return res.status(400).json({ success: false, error: 'whyJoin kamida 30 belgi bo\'lishi kerak' });
    }
    if (!workDistricts || !Array.isArray(workDistricts) || workDistricts.length === 0) {
      return res.status(400).json({ success: false, error: 'Kamida 1 ta tuman tanlash kerak' });
    }
    if (!categoryId) {
      return res.status(400).json({ success: false, error: 'Kategoriya tanlash majburiy' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      return res.status(400).json({ success: false, error: 'Kategoriya topilmadi yoki nofaol' });
    }

    if (dailyLimit !== undefined && dailyLimit !== null) {
      const dl = Number(dailyLimit);
      if (isNaN(dl) || dl < 1 || dl > 50) {
        return res.status(400).json({ success: false, error: 'dailyLimit 1 dan 50 gacha bo\'lishi kerak' });
      }
    }
    if (portfolioLink && portfolioLink.trim()) {
      try { new URL(portfolioLink.trim()); } catch {
        return res.status(400).json({ success: false, error: 'portfolioLink to\'g\'ri URL formatida bo\'lishi kerak' });
      }
    }

    // ─── Allaqachon ariza bor-yo'qligini tekshirish ───────────────────────────
    const existing = await prisma.providerApplication.findFirst({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } }
    });
    if (existing?.status === 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Siz allaqachon provaydersiz' });
    }
    if (existing?.status === 'PENDING') {
      return res.status(400).json({ success: false, error: 'Arizangiz allaqachon ko\'rib chiqilmoqda' });
    }

    // ─── Skilllarni validatsiya qilish ────────────────────────────────────────
    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const s of skills) {
        if (!s.skillId) return res.status(400).json({ success: false, error: 'Har bir xizmat uchun skillId majburiy' });
        if (!s.description || s.description.trim().length < 20) {
          return res.status(400).json({ success: false, error: `Skill tavsifi kamida 20 belgi bo'lishi kerak` });
        }
        if (!['ORGANIZED', 'UNORGANIZED', 'BOTH'].includes(s.serviceType)) {
          return res.status(400).json({ success: false, error: 'serviceType: ORGANIZED | UNORGANIZED | BOTH' });
        }
        const expYears = Number(s.experienceYears);
        if (isNaN(expYears) || expYears < 0.5 || expYears > 50) {
          return res.status(400).json({ success: false, error: 'experienceYears 0.5 dan 50 gacha bo\'lishi kerak' });
        }
        if (s.priceFrom !== undefined && s.priceTo !== undefined &&
            s.priceFrom !== null && s.priceTo !== null) {
          if (Number(s.priceTo) <= Number(s.priceFrom)) {
            return res.status(400).json({ success: false, error: 'priceTo priceFrom dan katta bo\'lishi kerak' });
          }
        }

        // Skill mavjud va active bo'lishi kerak
        const skill = await prisma.skill.findUnique({ where: { id: s.skillId } });
        if (!skill || !skill.isActive) {
          return res.status(400).json({ success: false, error: `Skill topilmadi yoki nofaol: ${s.skillId}` });
        }
      }
    }

    // ─── Foydalanuvchi ma'lumotlari ───────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, name: true, username: true }
    });

    // ─── Ariza yaratish ───────────────────────────────────────────────────────
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.providerApplication.create({
        data: {
          userId,
          aboutMe: aboutMe.trim(),
          whyJoin: whyJoin.trim(),
          portfolioLink: portfolioLink?.trim() || null,
          workDistricts,
          dailyLimit: dailyLimit ? Number(dailyLimit) : null,
          status: 'PENDING',
          categoryId,
          skills: skills && Array.isArray(skills) && skills.length > 0 ? {
            create: skills.map((s: any) => ({
              skillId: s.skillId,
              serviceType: s.serviceType,
              experienceYears: Number(s.experienceYears),
              priceFrom: s.priceFrom ? Number(s.priceFrom) : null,
              priceTo: s.priceTo ? Number(s.priceTo) : null,
              description: s.description.trim(),
              portfolioImages: s.portfolioImages || []
            }))
          } : undefined
        }
      });
      return app;
    });

    // ─── SUPER_ADMIN larga notification ───────────────────────────────────────
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true }
    });
    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'Foydalanuvchi';
    const notifData = admins.map(a => ({
      userId: a.id,
      type: 'NEW_APPLICATION' as any,
      title: 'Yangi provayder arizasi',
      message: `${userName}${user?.username ? ` (@${user.username})` : ''} provayder bo'lish uchun ariza topshirdi`,
      link: `/admin/applications/${application.id}`,
      isGlobal: false
    }));
    if (notifData.length > 0) {
      await prisma.notification.createMany({ data: notifData });
    }

    res.status(201).json({ success: true, data: { id: application.id, status: 'PENDING' } });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Application ───────────────────────────────────────────────────────
/**
 * @desc    O'z arizasini olish
 * @route   GET /api/provider/my-application
 * @access  Private
 */
export const getMyApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const app = await prisma.providerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        skills: {
          include: { skill: { include: { category: true } } }
        }
      }
    });
    if (!app) {
      return res.status(404).json({ success: false, error: 'Ariza topilmadi', code: 'NOT_FOUND' });
    }
    res.json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
};



// ─── Get My Profile ───────────────────────────────────────────────────────────
/**
 * @desc    Provayder profilini olish
 * @route   GET /api/providers/me
 * @access  Private (PROVIDER)
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        providerSkills: { include: { skill: { include: { category: true } } } },
        districts: true,
        portfolio: true,
        adminOfOrganizations: { select: { id: true, name: true, logo: true, rating: true, reliability: true } },
        memberOfOrganizations: {
          where: { status: 'ACTIVE' },
          include: { organization: { select: { id: true, name: true, logo: true } } }
        }
      }
    });

    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
/**
 * @desc    Provayder profilini yangilash
 * @route   PUT /api/providers/me
 * @access  Private (PROVIDER)
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { bio, districts } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.providerProfile.update({
        where: { userId },
        data: { bio: bio !== undefined ? bio : profile.bio }
      });
      if (districts) {
        await tx.providerDistrict.deleteMany({ where: { providerId: profile.id } });
        const districtData = districts.map((districtName: string) => ({ providerId: profile.id, districtName }));
        await tx.providerDistrict.createMany({ data: districtData });
      }
      return p;
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Update Bio ───────────────────────────────────────────────────────────
/**
 * @desc    Provayder bioni yangilash
 * @route   PATCH /api/providers/bio
 * @access  Private (PROVIDER)
 */
export const updateBio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { bio } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });
    if (profile.status !== 'APPROVED') return res.status(403).json({ success: false, error: 'Faqat tasdiqlangan provayderlar bio kirita oladi', code: 'NOT_APPROVED' });

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: { bio }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Availability and Schedule ────────────────────────────────────────────────
/**
 * @desc    Availability statusni o'zgartirish
 * @route   PATCH /api/providers/availability
 * @access  Private (PROVIDER)
 */
export const updateAvailabilityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { status } = req.body;

    // Faqat AVAILABLE va BUSY manual tanlanishi mumkin — OFFLINE faqat isOnline orqali
    if (!['AVAILABLE', 'BUSY'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Faqat AVAILABLE yoki BUSY tanlanishi mumkin', code: 'INVALID_STATUS' });
    }

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi' });

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: { availabilityStatus: status as any }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Haftalik jadvalni olish
 * @route   GET /api/providers/schedule
 * @access  Private (PROVIDER)
 */
export const getSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const profile = await prisma.providerProfile.findUnique({ where: { userId }, include: { schedules: true } });
    
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi' });

    res.json({ success: true, data: profile.schedules });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Haftalik jadvalni saqlash
 * @route   POST /api/providers/schedule
 * @access  Private (PROVIDER)
 */
export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { schedules } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi' });

    await prisma.$transaction(async (tx) => {
      await tx.providerSchedule.deleteMany({ where: { providerId: profile.id } });
      
      if (schedules && schedules.length > 0) {
        const scheduleData = schedules.map((s: any) => ({
          providerId: profile.id,
          dayOfWeek: s.dayOfWeek,
          openTime: s.openTime,
          closeTime: s.closeTime,
          isActive: s.isActive
        }));
        await tx.providerSchedule.createMany({ data: scheduleData });
      }
    });

    const updatedSchedules = await prisma.providerSchedule.findMany({ where: { providerId: profile.id } });
    res.json({ success: true, data: updatedSchedules });
  } catch (error) {
    next(error);
  }
};

// ─── Add Skill ────────────────────────────────────────────────────────────────
/**
 * @desc    Profilga yangi ko'nikma qo'shish
 * @route   POST /api/providers/me/skills
 * @access  Private (PROVIDER)
 */
export const addSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { skill_id, price_from, price_to, price_note, experience_years, description } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });

    // ─── Kategoriya tekshiruvi ──────────────────────────────────────────────
    // 1. Provayderning APPROVED statusdagi BARCHA arizalarining categoryId larini ol
    const approvedApplications = await prisma.providerApplication.findMany({
      where: {
        userId,
        status: 'APPROVED',
        categoryId: { not: null }
      },
      select: {
        categoryId: true
      }
    });

    const approvedCategoryIds = approvedApplications
      .map(app => app.categoryId)
      .filter((id): id is string => !!id);

    if (approvedCategoryIds.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Sizda hech qanday tasdiqlangan kategoriya mavjud emas',
        code: 'NO_APPROVED_CATEGORIES'
      });
    }

    // 2. Qo'shilayotgan skill shu kategoriyalardan biriga tegishli ekanini tekshir
    const skill = await prisma.skill.findUnique({
      where: { id: skill_id },
      select: { categoryId: true, isActive: true }
    });

    if (!skill || !skill.isActive) {
      return res.status(400).json({ success: false, error: 'Skill topilmadi yoki nofaol', code: 'SKILL_NOT_FOUND' });
    }

    // Qo'shilayotgan skill shu kategoriyalardan biriga tegishli bo'lsa — ruxsat ber, aks holda xatolik qaytarsin
    if (!approvedCategoryIds.includes(skill.categoryId)) {
      return res.status(403).json({
        success: false,
        error: 'Ushbu skill sizning tasdiqlangan kategoriyalaringizga tegishli emas',
        code: 'CATEGORY_NOT_APPROVED'
      });
    }

    const existingSkill = await prisma.providerSkill.findFirst({ where: { providerId: profile.id, skillId: skill_id } });
    if (existingSkill) return res.status(400).json({ success: false, error: 'Bu skill allaqachon qo\'shilgan', code: 'SKILL_EXISTS' });

    const providerSkill = await prisma.providerSkill.create({
      data: {
        providerId: profile.id,
        skillId: skill_id,
        priceFrom: price_from ? Number(price_from) : null,
        priceTo: price_to ? Number(price_to) : null,
        priceNote: price_note || null,
        experienceYears: experience_years ? Number(experience_years) : 0,
        description: description || null
      }
    });

    res.status(201).json({ success: true, data: providerSkill });
  } catch (error) {
    next(error);
  }
};

// ─── Update Skill ─────────────────────────────────────────────────────────────
/**
 * @desc    Profil ko'nikmasini yangilash
 * @route   PATCH /api/providers/me/skills/:skillId
 * @access  Private (PROVIDER)
 */
export const updateSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { skillId } = req.params;
    const { price_from, price_to, price_note, experience_years, description, isActive } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });

    const providerSkill = await prisma.providerSkill.findFirst({
      where: { providerId: profile.id, skillId }
    });
    if (!providerSkill) {
      return res.status(404).json({ success: false, error: 'Xizmat topilmadi', code: 'SKILL_NOT_FOUND' });
    }

    // Validatsiya
    if (price_from !== undefined && price_to !== undefined && price_from !== null && price_to !== null) {
      if (Number(price_to) <= Number(price_from)) {
        return res.status(400).json({ success: false, error: 'priceTo priceFrom dan katta bo\'lishi kerak' });
      }
    }

    const updated = await prisma.providerSkill.update({
      where: { id: providerSkill.id },
      data: {
        priceFrom: price_from !== undefined ? (price_from ? Number(price_from) : null) : undefined,
        priceTo: price_to !== undefined ? (price_to ? Number(price_to) : null) : undefined,
        priceNote: price_note !== undefined ? price_note : undefined,
        experienceYears: experience_years !== undefined ? (experience_years ? Number(experience_years) : 0) : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Skill ─────────────────────────────────────────────────────────────
/**
 * @desc    Profildan ko'nikmani o'chirish
 * @route   DELETE /api/providers/me/skills/:skillId
 * @access  Private (PROVIDER)
 */
export const removeSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { skillId } = req.params;
    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });
    await prisma.providerSkill.deleteMany({ where: { providerId: profile.id, skillId } });
    res.json({ success: true, data: { message: 'Skill o\'chirildi' } });
  } catch (error) {
    next(error);
  }
};

// ─── Portfolio ────────────────────────────────────────────────────────────────
/**
 * @desc    Portfolioga rasm qo'shish
 * @route   POST /api/providers/me/portfolio
 * @access  Private (PROVIDER)
 */
export const addPortfolioImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const file = req.file;
    const { caption } = req.body;
    if (!file) return res.status(400).json({ success: false, error: 'Rasm yuklanmadi', code: 'NO_FILE' });
    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });
    const image = await prisma.portfolioImage.create({
      data: { providerId: profile.id, imageUrl: `/uploads/${file.filename}`, caption }
    });
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Portfoliodan rasmni o'chirish
 * @route   DELETE /api/providers/me/portfolio/:imageId
 * @access  Private (PROVIDER)
 */
export const removePortfolioImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { imageId } = req.params;
    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });
    const image = await prisma.portfolioImage.findFirst({ where: { id: imageId, providerId: profile.id } });
    if (!image) return res.status(404).json({ success: false, error: 'Rasm topilmadi', code: 'NOT_FOUND' });
    await prisma.portfolioImage.delete({ where: { id: imageId } });
    res.json({ success: true, data: { message: 'Rasm o\'chirildi' } });
  } catch (error) {
    next(error);
  }
};

// ─── Org: Apply to Create Organization ───────────────────────────────────────
/**
 * @desc    Tashkilot yaratish uchun ariza berish
 * @route   POST /api/providers/organizations/apply
 * @access  Private (PROVIDER)
 */
export const applyToCreateOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { name, description } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile || profile.status !== 'APPROVED') {
      return res.status(403).json({ success: false, error: 'Faqat tasdiqlangan provayderlar ariza bera oladi' });
    }

    const pendingApp = await prisma.organizationApplication.findFirst({
      where: { providerId: profile.id, status: 'PENDING' }
    });
    if (pendingApp) {
      return res.status(400).json({ success: false, error: 'Sizning arizangiz ko\'rib chiqilmoqda' });
    }

    const app = await prisma.organizationApplication.create({
      data: { providerId: profile.id, name, description }
    });

    res.status(201).json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
};

// ─── Org: Apply to Join Organization ─────────────────────────────────────────
/**
 * @desc    Tashkilotga qo'shilish uchun ariza berish
 * @route   POST /api/providers/organizations/join
 * @access  Private (PROVIDER)
 */
export const applyToJoinOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { organization_id, message } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile || profile.status !== 'APPROVED') {
      return res.status(403).json({ success: false, error: 'Faqat tasdiqlangan provayderlar ariza bera oladi' });
    }

    const org = await prisma.organization.findUnique({ where: { id: organization_id } });
    if (!org || !org.isActive) return res.status(404).json({ success: false, error: 'Tashkilot topilmadi' });

    const existing = await prisma.organizationJoinRequest.findFirst({
      where: { organizationId: organization_id, providerId: profile.id, status: 'PENDING' }
    });
    if (existing) return res.status(400).json({ success: false, error: 'Arizangiz allaqachon ko\'rib chiqilmoqda' });

    const req2 = await prisma.organizationJoinRequest.create({
      data: { organizationId: organization_id, providerId: profile.id, message }
    });

    // Notify org admin
    await sendNotification(
      org.adminProviderId,
      'Yangi qo\'shilish arizasi!',
      `Provayder "${profile.id}" sizning "${org.name}" tashkilotingizga qo\'shilmoqchi.`
    );

    res.status(201).json({ success: true, data: req2 });
  } catch (error) {
    next(error);
  }
};

// ─── Provider Settings ────────────────────────────────────────────────────────
/**
 * @desc    Provayder sozlamalarini yangilash (districts, dailyLimit, priceFrom, priceTo)
 * @route   PATCH /api/provider/settings
 * @access  Private (PROVIDER)
 */
export const updateProviderSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { districts, dailyLimit, priceFrom, priceTo } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Provayder profili topilmadi' });

    // Validatsiya
    if (dailyLimit !== undefined) {
      const dl = Number(dailyLimit);
      if (isNaN(dl) || dl < 1 || dl > 50)
        return res.status(400).json({ success: false, error: 'dailyLimit 1 dan 50 gacha bo\'lishi kerak' });
    }
    if (priceFrom !== undefined && priceTo !== undefined) {
      if (Number(priceTo) > 0 && Number(priceTo) <= Number(priceFrom))
        return res.status(400).json({ success: false, error: 'priceTo priceFrom dan katta bo\'lishi kerak' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {};
      if (dailyLimit !== undefined) data.dailyLimit = Number(dailyLimit);
      if (priceFrom !== undefined) data.priceFrom = Number(priceFrom);
      if (priceTo !== undefined) data.priceTo = Number(priceTo);

      const updated = await tx.providerProfile.update({
        where: { userId },
        data,
        include: { districts: true },
      });

      // Hududlarni yangilash
      if (districts && Array.isArray(districts)) {
        await tx.providerDistrict.deleteMany({ where: { providerId: profile.id } });
        if (districts.length > 0) {
          await tx.providerDistrict.createMany({
            data: districts.map((districtName: string) => ({
              providerId: profile.id,
              districtName: String(districtName).trim(),
            })),
          });
        }
      }

      return updated;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
