import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runCronJobs = async () => {
  try {
    // 1. Schedule checking
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const activeSchedules = await prisma.providerSchedule.findMany({
      where: {
        isActive: true,
        dayOfWeek: dayOfWeek,
        openTime: { lte: currentTimeStr },
        closeTime: { gte: currentTimeStr }
      }
    });

    const activeProviderIds = activeSchedules.map((s: any) => s.providerId);

    if (activeProviderIds.length > 0) {
      await prisma.providerProfile.updateMany({
        where: { id: { in: activeProviderIds }, availabilityStatus: 'OFFLINE' },
        data: { availabilityStatus: 'AVAILABLE' }
      });
    }

    // 2. Auto-complete: 24 soat o'tgan AWAITING_CONFIRMATION
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pending = await prisma.order.findMany({
      where: { status: 'AWAITING_CONFIRMATION', awaitingConfirmAt: { lte: cutoff } }
    });

    for (const order of pending) {
      const isSuccess = order.finishType === 'SUCCESSFUL';
      const newStatus = isSuccess ? 'COMPLETED' : 'FAILED';

      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus, autoCompleted: true }
      });

      const provider = await prisma.providerProfile.findUnique({ where: { id: order.providerId } });

      if (isSuccess) {
        if (provider) {
          await prisma.providerProfile.update({
            where: { id: order.providerId },
            data: { successfulOrders: provider.successfulOrders + 1 }
          });
          const total = provider.successfulOrders + 1 + provider.failedOrders;
          const reliability = total > 0 ? Math.round(((provider.successfulOrders + 1) / total) * 100) : 100;
          await prisma.user.update({ where: { id: provider.userId }, data: { reliability } });
          
          await prisma.notification.create({
            data: {
              userId: provider.userId,
              title: 'Xizmat avtomatik tasdiqlandi',
              message: 'Mijoz 24 soat ichida javob bermadi. Xizmat avtomatik COMPLETED qilindi.',
              link: `/orders/${order.id}`
            }
          });
        }
        await prisma.notification.create({
          data: {
            userId: order.userId,
            title: 'Buyurtma avtomatik yakunlandi',
            message: 'Siz 24 soat ichida tasdiqlamagansiz. Buyurtma avtomatik yakunlandi.',
            link: `/orders/${order.id}`
          }
        });
      } else {
        if (order.unsuccessCategory === 'MY_FAULT' && provider) {
          const newFailed = provider.failedOrders + 1;
          await prisma.providerProfile.update({ where: { id: order.providerId }, data: { failedOrders: newFailed } });
          const total = provider.successfulOrders + newFailed;
          const reliability = total > 0 ? Math.round((provider.successfulOrders / total) * 100) : 100;
          await prisma.user.update({ where: { id: provider.userId }, data: { reliability } });
        }
        if (provider) {
          await prisma.notification.create({
            data: { userId: provider.userId, title: 'Buyurtma avtomatik FAILED qilindi', message: 'Mijoz 24 soat javob bermadi.', link: `/orders/${order.id}` }
          });
        }
      }
    }
    
    return { success: true, processedOrders: pending.length };
  } catch (error) {
    console.error('Cron job error:', error);
    throw error;
  }
};
