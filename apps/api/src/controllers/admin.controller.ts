import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// ------------------------ CATEGORY ------------------------

/**
 * @desc    Kategoriyalarni olish
 * @route   GET /api/admin/categories
 * @access  SUPER_ADMIN
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_active } = req.query;
    
    let filter: any = {};
    if (is_active !== undefined) {
      filter.isActive = is_active === 'true';
    }

    const categories = await prisma.category.findMany({
      where: filter,
      include: {
        skills: { orderBy: { createdAt: 'desc' } },
        _count: { select: { skills: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: categories });
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

    const existing = await prisma.category.findUnique({ where: { name } });
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
 * @route   PUT /api/admin/categories/:id
 * @access  SUPER_ADMIN
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi', code: 'NOT_FOUND' });

    if (name && name !== category.name) {
      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) return res.status(400).json({ success: false, error: 'Kategoriya nomi allaqachon mavjud', code: 'DUPLICATE_CATEGORY' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, description, icon }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kategoriya holatini o'zgartirish (Faol/Nofaol)
 * @route   PATCH /api/admin/categories/:id/toggle
 * @access  SUPER_ADMIN
 */
export const toggleCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ success: false, error: 'Kategoriya topilmadi', code: 'NOT_FOUND' });

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive }
    });

    // If deactivated, also deactivate its skills
    if (!updated.isActive) {
      await prisma.skill.updateMany({
        where: { categoryId: id },
        data: { isActive: false }
      });
    }

    res.json({ success: true, data: updated });
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
      include: { category: true },
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
 * @route   PUT /api/admin/skills/:id
 * @access  SUPER_ADMIN
 */
export const updateSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) return res.status(404).json({ success: false, error: 'Skill topilmadi', code: 'NOT_FOUND' });

    const updated = await prisma.skill.update({
      where: { id },
      data: { name, description }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ko'nikma holatini o'zgartirish (Faol/Nofaol)
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

// ------------------------ APPLICATIONS ------------------------

/**
 * @desc    Mutaxassislik arizalarini olish
 * @route   GET /api/admin/applications
 * @access  SUPER_ADMIN
 */
export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await prisma.providerProfile.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        providerSkills: { include: { skill: true } },
        districts: true
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ariza tafsilotlarini olish
 * @route   GET /api/admin/applications/:id
 * @access  SUPER_ADMIN
 */
export const getApplicationDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const application = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        providerSkills: { include: { skill: true } },
        districts: true,
        portfolio: true
      }
    });

    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi', code: 'NOT_FOUND' });

    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Arizani tasdiqlash
 * @route   POST /api/admin/applications/:id/approve
 * @access  SUPER_ADMIN
 */
export const approveApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const application = await prisma.providerProfile.findUnique({ where: { id }, include: { user: true } });
    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi', code: 'NOT_FOUND' });

    if (application.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilgan', code: 'ALREADY_PROCESSED' });

    await prisma.$transaction(async (tx) => {
      await tx.providerProfile.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'PROVIDER' }
      });
    });

    res.json({ success: true, data: { message: 'Ariza tasdiqlandi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Arizani rad etish
 * @route   POST /api/admin/applications/:id/reject
 * @access  SUPER_ADMIN
 */
export const rejectApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rejection_note } = req.body;

    if (!rejection_note) return res.status(400).json({ success: false, error: 'Rad etish sababini kiritish majburiy', code: 'MISSING_REASON' });

    const application = await prisma.providerProfile.findUnique({ where: { id } });
    if (!application) return res.status(404).json({ success: false, error: 'Ariza topilmadi', code: 'NOT_FOUND' });

    if (application.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Ariza allaqachon ko\'rib chiqilgan', code: 'ALREADY_PROCESSED' });

    await prisma.providerProfile.update({
      where: { id },
      data: { status: 'REJECTED', rejectionNote: rejection_note }
    });

    res.json({ success: true, data: { message: 'Ariza rad etildi' } });
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
 * @desc    Barcha foydalanuvchilarni olish
 * @route   GET /api/admin/users
 * @access  SUPER_ADMIN
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, search } = req.query;

    let filter: any = { status: { not: 'DELETED' } };
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: filter,
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
        isOnline: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
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

    const updated = await prisma.user.update({ where: { id }, data: { status: 'DELETED' } });
    res.json({ success: true, data: { message: 'Foydalanuvchi o\'chirildi', user: updated } });
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
      where: { adminId },
      include: {
        targetUser: { select: { id: true, name: true, avatar: true, email: true, username: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 } // Last message
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Yangi admin chat yaratish yoki mavjudini olish
 * @route   POST /api/admin/chats
 * @access  SUPER_ADMIN
 */
export const createAdminChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId as string;
    const { targetUserId } = req.body;

    let chat = await prisma.adminChat.findFirst({
      where: { adminId, targetUserId }
    });

    if (!chat) {
      chat = await prisma.adminChat.create({
        data: { adminId, targetUserId }
      });
    }

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

    const message = await prisma.adminChatMessage.create({
      data: { chatId: id, senderId, content }
    });

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

    let whereClause = {};
    if (targetRole === 'USER') whereClause = { role: 'USER' };
    else if (targetRole === 'PROVIDER') whereClause = { role: 'PROVIDER' };

    const users = await prisma.user.findMany({ where: whereClause, select: { id: true } });
    
    const notifications = users.map(u => ({
      userId: u.id,
      type: type || 'SYSTEM',
      title,
      message,
      senderId
    }));

    await prisma.notification.createMany({ data: notifications });

    res.json({ success: true, data: { message: `${notifications.length} ta foydalanuvchiga yuborildi` } });
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

    const notification = await prisma.notification.create({
      data: { userId, type: type || 'SYSTEM', title, message, senderId }
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

