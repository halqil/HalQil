import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendNotification } from './organization.controller';

// ─── Reliability Helper: Provider ────────────────────────────────────────────
const recalcProviderReliability = async (providerId: string) => {
  const profile = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!profile) return;
  const total = profile.successfulOrders + profile.failedOrders;
  const reliability = total > 0 ? Math.round((profile.successfulOrders / total) * 100) : 100;
  await prisma.user.update({ where: { id: profile.userId }, data: { reliability } });
};

// ─── Reliability Helper: User ─────────────────────────────────────────────────
const recalcUserReliability = async (userId: string) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { successfulOrders: true, cancelledOrders: true } });
  if (!u) return;
  const total = u.successfulOrders + u.cancelledOrders;
  const reliability = total > 0 ? Math.round((u.successfulOrders / total) * 100) : 100;
  await prisma.user.update({ where: { id: userId }, data: { reliability } });
};

// ─── Legacy: Reliability Calculator (kept for compatibility) ─────────────────
const recalcReliability = recalcProviderReliability;

async function updateProviderReliability(providerUserId: string) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: providerUserId }
  })
  if (!profile) return
  const total = profile.successfulOrders + profile.failedOrders
  const reliability = total > 0
    ? Math.round((profile.successfulOrders / total) * 100)
    : 100
  await prisma.user.update({
    where: { id: providerUserId },
    data: { reliability }
  })
}

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

    const { provider_id, skill_id, description, address, preferred_date, images, organization_id } = req.body;

    // Provayder mavjudligini va holatini tekshirish
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { id: provider_id }
    });
    if (!providerProfile) {
      return res.status(404).json({ success: false, error: 'Provayder topilmadi', code: 'PROVIDER_NOT_FOUND' });
    }
    if (providerProfile.availabilityStatus === 'BUSY') {
      return res.status(409).json({ success: false, error: 'Provayder hozir band, keyinroq urinib ko\'ring', code: 'PROVIDER_BUSY' });
    }

    const activeOrder = await prisma.order.findFirst({
      where: { userId, skillId: skill_id, status: { in: ['PENDING', 'ACCEPTED', 'CHATTING', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'] } }
    });
    if (activeOrder) {
      return res.status(400).json({ success: false, error: 'Sizda bu xizmat turi bo\'yicha aktiv buyurtma mavjud', code: 'ACTIVE_ORDER_EXISTS' });
    }

    // preferredDate o'tib ketgan vaqt emasligini tekshirish
    if (preferred_date && new Date(preferred_date) < new Date()) {
      return res.status(400).json({ success: false, error: 'O\'tib ketgan vaqtni kiritib bo\'lmaydi', code: 'INVALID_DATE' });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        providerId: provider_id,
        skillId: skill_id,
        description,
        address,
        preferredDate: preferred_date ? new Date(preferred_date) : null,
        images: images || [],
        organizationId: organization_id || null,
        status: 'PENDING'
      }
    });

    // Notify provider — user ismi va link bilan
    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (providerProfile) {
      const shortDesc = description.slice(0, 50);
      await sendNotification(
        providerProfile.userId,
        'Yangi buyurtma!',
        `${sender?.name || 'Foydalanuvchi'} buyurtma yubordi: "${shortDesc}${description.length > 50 ? '...' : ''}"`,
        `/provider/dashboard`
      );
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
    const order = await prisma.order.findUnique({ where: { id }, include: { provider: true } });
    if (order?.status === 'AWAITING_CONFIRMATION' && order.completedAt) {
      const elapsed = Date.now() - order.completedAt.getTime();
      if (elapsed > 24 * 60 * 60 * 1000) {
        await prisma.order.update({ where: { id }, data: { status: 'COMPLETED' } });
        const autoProviderUserId = order.provider.userId;
        await prisma.providerProfile.update({
          where: { userId: autoProviderUserId },
          data: { successfulOrders: { increment: 1 } }
        });
        await updateProviderReliability(autoProviderUserId);
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
    const { message } = req.body;
    const acceptMessage = message?.trim() || 'Buyurtmangiz qabul qilindi';

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Buyurtma PENDING holatida emas' });
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'ACCEPTED' } });
    
    await sendNotification(order.userId, 'Buyurtmangiz qabul qilindi', acceptMessage);

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
    if (!order || !['PENDING', 'ACCEPTED'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Buyurtma uchun chat ochib bo\'lmaydi' });
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CHATTING' } });

    await sendNotification(order.userId, 'Provayder siz bilan bog\'lanmoqchi', 'Chat ochildi');

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
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: 'Rad etish sababi majburiy' });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !['PENDING', 'ACCEPTED'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Buyurtma rad etib bo\'lmaydi' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason }
    });

    await sendNotification(order.userId, 'Buyurtmangiz rad etildi', reason);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Provider: Finish Order (→ AWAITING_CONFIRMATION) ────────────────────────
/**
 * @desc    Buyurtmani yakunlash (Provayder) — muvaffaqiyatli yoki muvaffaqiyatsiz
 * @route   PATCH /api/orders/:id/finish
 * @access  Private (PROVIDER)
 */
export const finishOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, category, reason } = req.body;

    if (!type || !['SUCCESSFUL', 'UNSUCCESSFUL'].includes(type)) {
      return res.status(400).json({ success: false, error: 'type majburiy: SUCCESSFUL yoki UNSUCCESSFUL' });
    }
    if (type === 'UNSUCCESSFUL' && (!category || !reason)) {
      return res.status(400).json({ success: false, error: 'Muvaffaqiyatsiz yakunlashda category va reason majburiy' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !['ACCEPTED', 'CHATTING', 'IN_PROGRESS'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Buyurtma yakunlashga tayyor emas' });
    }

    const now = new Date();
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'AWAITING_CONFIRMATION',
        finishType: type,
        awaitingConfirmAt: now,
        completedAt: now,
        ...(type === 'UNSUCCESSFUL' ? { unsuccessCategory: category, unsuccessReason: reason, isSuccessful: false } : { isSuccessful: true })
      }
    });

    if (type === 'SUCCESSFUL') {
      await sendNotification(
        order.userId,
        'Xizmatni tasdiqlang',
        'Provayder xizmat ko\'rsatildi deb belgiladi. Iltimos tasdiqlang.',
        `/orders/${id}`
      );
    } else {
      await sendNotification(
        order.userId,
        'Xizmat muvaffaqiyatsiz yakunlandi',
        `Sabab: ${reason}. Iltimos tasdiqlang yoki shikoyat qiling.`,
        `/orders/${id}`
      );
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── User: Confirm or Dispute (AWAITING_CONFIRMATION → COMPLETED/DISPUTED/FAILED)
/**
 * @desc    Buyurtmani tasdiqlash yoki shikoyat (Mijoz)
 * @route   PATCH /api/orders/:id/confirm
 * @access  Private (USER)
 */
export const confirmOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, reason, rating, comment } = req.body;

    if (!action || !['CONFIRM', 'DISPUTE'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action majburiy: CONFIRM yoki DISPUTE' });
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { provider: true } });
    if (!order || order.status !== 'AWAITING_CONFIRMATION') {
      return res.status(400).json({ success: false, error: 'Buyurtma tasdiq kutmoqda emas' });
    }

    const provider = await prisma.providerProfile.findUnique({ where: { id: order.providerId } });

    if (action === 'DISPUTE') {
      if (!reason) return res.status(400).json({ success: false, error: 'Shikoyat sababi majburiy' });
      await prisma.order.update({ where: { id }, data: { status: 'DISPUTED', disputeReason: reason } });

      // Admin ga notification
      const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
      for (const admin of admins) {
        await sendNotification(admin.id, 'Yangi shikoyat', `Order bo'yicha shikoyat keldi: ${reason}`, `/admin`);
      }
      // Provayderga notification
      if (provider) {
        await sendNotification(provider.userId, 'Shikoyat keldi', 'Mijoz xizmat bo\'yicha shikoyat qildi. Admin ko\'rib chiqadi.', `/orders/${id}`);
      }
      return res.json({ success: true, data: { message: 'Shikoyat yuborildi. Admin ko\'rib chiqadi.' } });
    }

    // action === 'CONFIRM'
    const isSuccess = order.finishType === 'SUCCESSFUL';
    const newStatus = isSuccess ? 'COMPLETED' : 'FAILED';
    await prisma.order.update({ where: { id }, data: { status: newStatus, autoCompleted: false } });

    const providerUserId = order.provider.userId;
    if (isSuccess) {
      await prisma.providerProfile.update({
        where: { userId: providerUserId },
        data: { successfulOrders: { increment: 1 } }
      });
    } else {
      await prisma.providerProfile.update({
        where: { userId: providerUserId },
        data: { failedOrders: { increment: 1 } }
      });
    }
    await updateProviderReliability(providerUserId);

    // User: successfulOrders++, reliability
    const u = await prisma.user.findUnique({ where: { id: order.userId }, select: { successfulOrders: true, cancelledOrders: true } });
    if (u) {
      await prisma.user.update({ where: { id: order.userId }, data: { successfulOrders: u.successfulOrders + 1 } });
      await recalcUserReliability(order.userId);
    }
    if (provider) {
      if (isSuccess) {
        await sendNotification(provider.userId, 'Xizmat tasdiqlandi', 'Mijoz xizmatni tasdiqladi. Rahmat!', `/orders/${id}`);
      } else {
        await sendNotification(provider.userId, 'Buyurtma FAILED deb belgilandi', 'Mijoz buyurtmani tasdiqladi (muvaffaqiyatsiz)', `/orders/${id}`);
      }
    }

    // Review yaratish
    if (rating && provider) {
      await prisma.review.create({
        data: {
          orderId: id, reviewerId: order.userId, revieweeId: provider.userId,
          skillId: order.skillId, rating: Number(rating), comment: comment || null,
          fromRole: 'USER', isPositive: isSuccess
        }
      }).catch(() => {});
    }

    res.json({ success: true, data: { message: 'Tasdiqlandi!' } });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Resolve Dispute ───────────────────────────────────────────────────
/**
 * @desc    Shikoyatni hal qilish (Admin)
 * @route   PATCH /admin/orders/:id/resolve
 * @access  Private (ADMIN)
 */
export const resolveDispute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { decision, note } = req.body;

    if (!decision || !['PROVIDER_FAULT', 'USER_FAULT'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'decision majburiy: PROVIDER_FAULT yoki USER_FAULT' });
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { provider: true } });
    if (!order || order.status !== 'DISPUTED') {
      return res.status(400).json({ success: false, error: 'Buyurtma DISPUTED holatida emas' });
    }

    if (!note?.trim()) {
      return res.status(400).json({ success: false, error: 'Admin eslatmasi (note) majburiy' });
    }

    const provider = await prisma.providerProfile.findUnique({ where: { id: order.providerId } });
    const adminId = req.user?.userId;
    const now = new Date();

    if (decision === 'PROVIDER_FAULT') {
      await prisma.order.update({
        where: { id },
        data: { status: 'FAILED', resolvedBy: adminId, resolvedAt: now, resolveNote: note.trim(), resolveDecision: decision }
      });
      const providerUserId = order.provider.userId;
      await prisma.providerProfile.update({
        where: { userId: providerUserId },
        data: { failedOrders: { increment: 1 } }
      });
      await updateProviderReliability(providerUserId);
      if (provider) {
        await sendNotification(provider.userId, 'Admin qaror: Siz aybdor topildingiz', note.trim(), `/orders/${id}`);
      }
      await sendNotification(order.userId, 'Shikoyatingiz ko\'rib chiqildi', 'Provayder aybdor topildi.', `/orders/${id}`);
    } else {
      await prisma.order.update({
        where: { id },
        data: { status: 'COMPLETED', resolvedBy: adminId, resolvedAt: now, resolveNote: note.trim(), resolveDecision: decision }
      });
      const providerUserId = order.provider.userId;
      await prisma.providerProfile.update({
        where: { userId: providerUserId },
        data: { successfulOrders: { increment: 1 } }
      });
      await updateProviderReliability(providerUserId);
      if (provider) {
        await sendNotification(provider.userId, 'Admin qaror: Shikoyat asossiz', 'Xizmat COMPLETED deb belgilandi.', `/orders/${id}`);
      }
      await sendNotification(order.userId, 'Shikoyatingiz asossiz topildi', note.trim(), `/orders/${id}`);
    }

    res.json({ success: true, data: { message: 'Qaror qabul qilindi' } });
  } catch (error) {
    next(error);
  }
};

// ─── Legacy exports (kept for route compatibility) ────────────────────────────
export const completeOrder = finishOrder;
export const unsuccessfulOrder = finishOrder;
export const disputeOrder = async (req: Request, res: Response, next: NextFunction) => {
  req.body.action = 'DISPUTE';
  return confirmOrder(req, res, next);
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
      return res.status(400).json({
        success: false,
        error: order && order.status !== 'PENDING'
          ? 'Buyurtmani bekor qilib bo\'lmaydi — provayder allaqachon javob bergan'
          : 'Buyurtma topilmadi',
        code: 'CANNOT_CANCEL'
      });
    }

    await prisma.order.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason } });

    // User statistikasi: cancelledOrders++, reliability recalc
    const currentUser = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { successfulOrders: true, cancelledOrders: true }
    });
    if (currentUser) {
      const cancelled = currentUser.cancelledOrders + 1;
      const successful = currentUser.successfulOrders;
      const total = successful + cancelled;
      const reliability = total > 0 ? Math.round((successful / total) * 100) : 100;
      await prisma.user.update({
        where: { id: order.userId },
        data: { cancelledOrders: cancelled, reliability }
      });
    }

    // Provayderga notification
    const provider = await prisma.providerProfile.findUnique({ where: { id: order.providerId } });
    if (provider) {
      await sendNotification(
        provider.userId,
        'Buyurtma bekor qilindi',
        `Mijoz buyurtmani bekor qildi${reason ? `: ${reason}` : ''}`,
        '/provider/dashboard'
      );
    }

    res.json({ success: true, data: { message: 'Buyurtma bekor qilindi' } });
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
