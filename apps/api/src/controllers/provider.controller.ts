import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendNotification } from './organization.controller';

// ─── Apply for Provider ───────────────────────────────────────────────────────
/**
 * @desc    Provayder bo'lish uchun ariza topshirish
 * @route   POST /api/providers/apply
 * @access  Private (USER)
 */
export const applyForProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });

    const { bio, skill_ids, districts, price_notes } = req.body;

    const existingProfile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (existingProfile) {
      if (existingProfile.status === 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilmoqda', code: 'APPLICATION_PENDING' });
      if (existingProfile.status === 'APPROVED') return res.status(400).json({ success: false, error: 'Siz allaqachon provaydersiz', code: 'ALREADY_PROVIDER' });
    }

    const newProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.providerProfile.upsert({
        where: { userId },
        update: { bio, serviceType: 'INDEPENDENT', status: 'PENDING' },
        create: { userId, bio, serviceType: 'INDEPENDENT', status: 'PENDING' }
      });

      await tx.providerSkill.deleteMany({ where: { providerId: profile.id } });
      await tx.providerDistrict.deleteMany({ where: { providerId: profile.id } });

      const skillData = skill_ids.map((skillId: string) => {
        const pNote = price_notes?.find((n: any) => n.skill_id === skillId);
        return {
          providerId: profile.id,
          skillId,
          priceFrom: pNote?.price_from,
          priceTo: pNote?.price_to,
          experienceYears: pNote?.experience_years ?? 0,
        };
      });
      await tx.providerSkill.createMany({ data: skillData });

      const districtData = districts.map((districtName: string) => ({ providerId: profile.id, districtName }));
      await tx.providerDistrict.createMany({ data: districtData });

      return profile;
    });

    res.status(201).json({ success: true, data: newProfile });
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

    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Noto\'g\'ri status' });
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
    const { skill_id, price_from, price_to, price_note, experience_years } = req.body;

    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'Profil topilmadi', code: 'NOT_FOUND' });

    const existingSkill = await prisma.providerSkill.findFirst({ where: { providerId: profile.id, skillId: skill_id } });
    if (existingSkill) return res.status(400).json({ success: false, error: 'Bu skill allaqachon qo\'shilgan', code: 'SKILL_EXISTS' });

    const skill = await prisma.providerSkill.create({
      data: {
        providerId: profile.id,
        skillId: skill_id,
        priceFrom: price_from,
        priceTo: price_to,
        priceNote: price_note,
        experienceYears: experience_years ?? 0,
      }
    });

    res.status(201).json({ success: true, data: skill });
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
