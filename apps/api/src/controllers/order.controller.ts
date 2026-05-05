import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendNotification } from './organization.controller';

// ─── Reliability Calculator ──────────────────────────────────────────────────
const recalcReliability = async (userId: string) => {
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!profile) return;

  const total = await prisma.order.count({
    where: { providerId: profile.id, status: { in: ['COMPLETED', 'REJECTED', 'DISPUTED'] } }
  });
  const successful = await prisma.order.count({
    where: { providerId: profile.id, status: 'COMPLETED' }
  });

  const reliability = total > 0 ? Math.round((successful / total) * 100) : 100;
  await prisma.user.update({ where: { id: userId }, data: { reliability } });
};

// ─── Create Order ─────────────────────────────────────────────────────────────
/**
 * @desc    Yangi buyurtma yaratish
 * @route   POST /api/orders
 * @access  Private (USER)
 */
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { provider_id, skill_id, description, address, preferred_time, images, organization_id } = req.body;

    const activeOrder = await prisma.order.findFirst({
      where: { userId, skillId: skill_id, status: { in: ['PENDING', 'ACCEPTED', 'CHATTING', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'] } }
    });
    if (activeOrder) {
      return res.status(400).json({ success: false, error: 'Sizda bu xizmat turi bo\'yicha aktiv buyurtma mavjud', code: 'ACTIVE_ORDER_EXISTS' });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        providerId: provider_id,
        skillId: skill_id,
        description,
        address,
        preferredTime: preferred_time,
        images: images || [],
        organizationId: organization_id || null,
        status: 'PENDING'
      }
    });

    // Notify provider
    const provider = await prisma.providerProfile.findUnique({ where: { id: provider_id } });
    if (provider) {
      await sendNotification(provider.userId, 'Yangi buyurtma!', `Sizga yangi buyurtma keldi: "${description.slice(0, 50)}..."`);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── Get Orders ───────────────────────────────────────────────────────────────
/**
 * @desc    Buyurtmalar ro'yxatini olish (User yoki Provider uchun)
 * @route   GET /api/orders
 * @access  Private
 */
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let filter: any = {};
    if (role === 'PROVIDER') {
      const providerProfile = await prisma.providerProfile.findUnique({ where: { userId } });
      if (providerProfile) {
        filter = { OR: [{ userId }, { providerId: providerProfile.id }] };
      } else {
        filter = { userId };
      }
    } else {
      filter = { userId };
    }

    const orders = await prisma.order.findMany({
      where: filter,
      include: {
        provider: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        skill: true,
        user: { select: { id: true, name: true, avatar: true } },
        organization: { select: { id: true, name: true, logo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// ─── Get Order Detail ─────────────────────────────────────────────────────────
/**
 * @desc    Buyurtma tafsilotlarini olish
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Auto-complete if AWAITING_CONFIRMATION and 24h passed
    const order = await prisma.order.findUnique({ where: { id } });
    if (order?.status === 'AWAITING_CONFIRMATION' && order.completedAt) {
      const elapsed = Date.now() - order.completedAt.getTime();
      if (elapsed > 24 * 60 * 60 * 1000) {
        await prisma.order.update({ where: { id }, data: { status: 'COMPLETED' } });
        // Negative reliability impact
        const provider = await prisma.providerProfile.findUnique({ where: { id: order.providerId } });
        if (provider) await recalcReliability(provider.userId);
      }
    }

    const fresh = await prisma.order.findUnique({
      where: { id },
      include: {
        provider: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        skill: true,
        user: { select: { id: true, name: true, avatar: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        reviews: true,
        organization: { select: { id: true, name: true, logo: true } }
      }
    });

    if (!fresh) return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    res.json({ success: true, data: fresh });
  } catch (error) {
    next(error);
  }
};

// ─── Provider: Accept (PENDING → ACCEPTED) ────────────────────────────────────
/**
 * @desc    Buyurtmani qabul qilish (Provayder)
 * @route   POST /api/orders/:id/accept
 * @access  Private (PROVIDER)
 */
export const acceptOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Buyurtma PENDING holatida emas' });
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'ACCEPTED' } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Provider: Open Chat (PENDING → CHATTING) ─────────────────────────────────
/**
 * @desc    Chatni boshlash (PENDING -> CHATTING)
 * @route   POST /api/orders/:id/open-chat
 * @access  Private (PROVIDER)
 */
export const openChatOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Buyurtma PENDING holatida emas' });
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CHATTING' } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Provider: Reject (PENDING → REJECTED + rejectionReason) ─────────────────
/**
 * @desc    Buyurtmani rad etish (Provayder)
 * @route   POST /api/orders/:id/reject
 * @access  Private (PROVIDER)
 */
export const rejectOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    if (!rejection_reason) return res.status(400).json({ success: false, error: 'Rad etish sababi majburiy' });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Buyurtma PENDING holatida emas' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: rejection_reason }
    });

    // Notify user
    await sendNotification(order.userId, 'Buyurtmangiz rad etildi', `Sabab: ${rejection_reason}`);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Provider: Mark Complete (→ AWAITING_CONFIRMATION) ────────────────────────
/**
 * @desc    Buyurtmani yakunlash (Provayder)
 * @route   POST /api/orders/:id/complete
 * @access  Private (PROVIDER)
 */
export const completeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !['ACCEPTED', 'CHATTING', 'IN_PROGRESS'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Buyurtma bajarilmoqda holatida emas' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'AWAITING_CONFIRMATION', completedAt: new Date() }
    });

    // Notify user
    await sendNotification(order.userId, 'Xizmat bajarildi!', 'Provayder xizmatni bajarildi deb belgiladi. Iltimos, 24 soat ichida tasdiqlang.');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── User: Confirm Complete (AWAITING_CONFIRMATION → COMPLETED + +reliability) ─
/**
 * @desc    Buyurtmani tasdiqlash (Mijoz)
 * @route   POST /api/orders/:id/confirm
 * @access  Private (USER)
 */
export const confirmOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'AWAITING_CONFIRMATION') {
      return res.status(400).json({ success: false, error: 'Buyurtma tasdiq kutmoqda emas' });
    }

    await prisma.order.update({ where: { id }, data: { status: 'COMPLETED' } });

    // Positive reliability
    const provider = await prisma.providerProfile.findUnique({ where: { id: order.providerId } });
    if (provider) await recalcReliability(provider.userId);

    res.json({ success: true, data: { message: 'Buyurtma tasdiqlandi!' } });
  } catch (error) {
    next(error);
  }
};

// ─── User: Dispute (AWAITING_CONFIRMATION → DISPUTED) ────────────────────────
/**
 * @desc    Buyurtma bo'yicha shikoyat qilish (Mijoz)
 * @route   POST /api/orders/:id/dispute
 * @access  Private (USER)
 */
export const disputeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'AWAITING_CONFIRMATION') {
      return res.status(400).json({ success: false, error: 'Buyurtma tasdiq kutmoqda emas' });
    }

    await prisma.order.update({ where: { id }, data: { status: 'DISPUTED', cancelReason: reason } });
    res.json({ success: true, data: { message: 'Shikoyat yuborildi. Admin ko\'rib chiqadi.' } });
  } catch (error) {
    next(error);
  }
};

// ─── User: Cancel (PENDING → CANCELLED) ──────────────────────────────────────
/**
 * @desc    Buyurtmani bekor qilish (Mijoz)
 * @route   POST /api/orders/:id/cancel
 * @access  Private (USER)
 */
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Faqat PENDING buyurtmani bekor qilish mumkin' });
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Legacy: start chat (ACCEPTED → CHATTING) ────────────────────────────────
/**
 * @desc    Chatni boshlash (Legacy)
 * @route   POST /api/orders/:id/start-chat
 * @access  Private (PROVIDER)
 */
export const startChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CHATTING' } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
