import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { emitNotification } from '../lib/socket';

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * @desc    Xabarnoma yuborish (Helper) — DB + real-time Socket.IO
 */
export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const notif = await prisma.notification.create({
      data: { userId, title, message }
    });
    // Real-time delivery
    emitNotification(userId, { ...notif, link });
  } catch (e) {
    console.error('Notification error:', e);
  }
};

// ─── Public ─────────────────────────────────────────────────────────────────

/**
 * @desc    Barcha faol tashkilotlarni olish
 * @route   GET /api/organizations
 * @access  Public
 */
export const getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { isActive: true },
      include: {
        skills: { include: { skill: true } },
        _count: { select: { members: true, orders: true } },
        adminProvider: { include: { user: { select: { name: true, avatar: true } } } }
      },
      orderBy: { rating: 'desc' }
    });
    res.json({ success: true, data: orgs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot tafsilotlarini id orqali olish
 * @route   GET /api/organizations/:id
 * @access  Public
 */
export const getOrganizationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: { include: { category: true } } } },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            provider: {
              include: {
                user: { select: { id: true, name: true, avatar: true, reliability: true } },
                providerSkills: { include: { skill: true } }
              }
            }
          }
        },
        adminProvider: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        _count: { select: { members: true, orders: true } }
      }
    });

    if (!org) return res.status(404).json({ success: false, error: 'Tashkilot topilmadi' });
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot buyurtmalarini olish
 * @route   GET /api/organizations/:id/orders
 * @access  Private (MEMBER, ORG_ADMIN)
 */
export const getOrganizationOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Check if user is a member
    const provider = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!provider) return res.status(403).json({ success: false, error: 'Ruxsat etilmagan' });

    const isMember = await prisma.organizationMember.findFirst({
      where: { organizationId: id, providerId: provider.id, status: 'ACTIVE' }
    });
    const org = await prisma.organization.findUnique({ where: { id } });
    const isAdmin = org?.adminProviderId === provider.id;

    if (!isMember && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Siz bu tashkilot a\'zosi emassiz' });
    }

    const orders = await prisma.order.findMany({
      where: { organizationId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        skill: true,
        provider: { include: { user: { select: { id: true, name: true, avatar: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// ─── Org Admin Actions ───────────────────────────────────────────────────────

/**
 * @desc    Tashkilotga qo'shilish arizalarini ko'rish
 * @route   GET /api/organizations/:id/requests
 * @access  Private (ORG_ADMIN)
 */
export const getJoinRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const provider = await prisma.providerProfile.findUnique({ where: { userId } });
    const org = await prisma.organization.findUnique({ where: { id } });

    if (!org || org.adminProviderId !== provider?.id) {
      return res.status(403).json({ success: false, error: 'Faqat tashkilot admini ko\'ra oladi' });
    }

    const requests = await prisma.organizationJoinRequest.findMany({
      where: { organizationId: id, status: 'PENDING' },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true } },
            providerSkills: { include: { skill: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Qo'shilish arizasini tasdiqlash
 * @route   POST /api/organizations/:id/requests/:reqId/approve
 * @access  Private (ORG_ADMIN)
 */
export const approveJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, reqId } = req.params;
    const userId = req.user?.userId;

    const provider = await prisma.providerProfile.findUnique({ where: { userId } });
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org || org.adminProviderId !== provider?.id) {
      return res.status(403).json({ success: false, error: 'Ruxsat etilmagan' });
    }

    const joinReq = await prisma.organizationJoinRequest.findUnique({ where: { id: reqId } });
    if (!joinReq || joinReq.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Ariza topilmadi yoki allaqachon ko\'rib chiqilgan' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.organizationJoinRequest.update({ where: { id: reqId }, data: { status: 'APPROVED' } });
      await tx.organizationMember.upsert({
        where: { organizationId_providerId: { organizationId: id, providerId: joinReq.providerId } },
        update: { status: 'ACTIVE' },
        create: { organizationId: id, providerId: joinReq.providerId, status: 'ACTIVE' }
      });
    });

    // Notify provider
    const memberUser = await prisma.providerProfile.findUnique({
      where: { id: joinReq.providerId },
      include: { user: true }
    });
    if (memberUser) {
      await sendNotification(
        memberUser.userId,
        'Tashkilotga qo\'shildingiz!',
        `Siz "${org.name}" tashkilotiga a\'zo bo\'ldingiz.`
      );
    }

    res.json({ success: true, data: { message: 'Ariza tasdiqlandi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Qo'shilish arizasini rad etish
 * @route   POST /api/organizations/:id/requests/:reqId/reject
 * @access  Private (ORG_ADMIN)
 */
export const rejectJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, reqId } = req.params;
    const { rejection_note } = req.body;
    const userId = req.user?.userId;

    const provider = await prisma.providerProfile.findUnique({ where: { userId } });
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org || org.adminProviderId !== provider?.id) {
      return res.status(403).json({ success: false, error: 'Ruxsat etilmagan' });
    }

    const joinReq = await prisma.organizationJoinRequest.findUnique({ where: { id: reqId } });
    if (!joinReq || joinReq.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Ariza topilmadi yoki allaqachon ko\'rib chiqilgan' });
    }

    await prisma.organizationJoinRequest.update({
      where: { id: reqId },
      data: { status: 'REJECTED', rejectionNote: rejection_note }
    });

    const memberUser = await prisma.providerProfile.findUnique({
      where: { id: joinReq.providerId }, include: { user: true }
    });
    if (memberUser) {
      await sendNotification(
        memberUser.userId,
        'Tashkilotga qo\'shilish rad etildi',
        `"${org.name}" tashkilotiga qo\'shilish arizangiz rad etildi. Sabab: ${rejection_note || 'Ko\'rsatilmagan'}`
      );
    }

    res.json({ success: true, data: { message: 'Ariza rad etildi' } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tashkilot a'zosini o'chirish
 * @route   DELETE /api/organizations/:id/members/:providerId
 * @access  Private (ORG_ADMIN)
 */
export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, providerId } = req.params;
    const userId = req.user?.userId;

    const provider = await prisma.providerProfile.findUnique({ where: { userId } });
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org || org.adminProviderId !== provider?.id) {
      return res.status(403).json({ success: false, error: 'Ruxsat etilmagan' });
    }

    await prisma.organizationMember.updateMany({
      where: { organizationId: id, providerId },
      data: { status: 'REJECTED' }
    });

    res.json({ success: true, data: { message: 'A\'zo o\'chirildi' } });
  } catch (error) {
    next(error);
  }
};
