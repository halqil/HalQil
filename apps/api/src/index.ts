import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Serve static files
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import providerRoutes from './routes/provider.routes';
import orderRoutes from './routes/order.routes';
import searchRoutes from './routes/search.routes';
import reviewRoutes from './routes/review.routes';
import userRoutes from './routes/user.routes';
import catalogRoutes from './routes/catalog.routes';
import organizationRoutes from './routes/organization.routes';
import notificationRoutes from './routes/notification.routes';
import adminChatRoutes from './routes/adminChat.routes';
import supportRoutes from './routes/support.routes';
import chatRoutes from './routes/chat.routes';

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/provider', providerRoutes);
app.use('/orders', orderRoutes);
app.use('/providers', searchRoutes);
app.use('/reviews', reviewRoutes);
app.use('/user', userRoutes);
app.use('/catalog', catalogRoutes);
app.use('/organizations', organizationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/my/admin-chat', adminChatRoutes);
app.use('/support', supportRoutes);
app.use('/chats', chatRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Mahalliy Xizmat Marketplace API is running...');
});

// Global Error Handler
import { errorHandler } from './middlewares/errorHandler';
app.use(errorHandler);

// Setup Socket.IO
import { prisma } from './lib/prisma';
import { verifyAccessToken } from './lib/jwt';
import { setIo } from './lib/socket';

// io ni global registry ga register qilamiz (controllers dan ishlatish uchun)
setIo(io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = verifyAccessToken(token);
    (socket as any).user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);
  const user = (socket as any).user;

  if (user && user.userId) {
    try {
      await prisma.user.update({
        where: { id: user.userId },
        data: { isOnline: true, lastSeenAt: new Date() }
      });
      // Har bir user o'z personal room iga kiradi — notification uchun
      socket.join(`user_${user.userId}`);
    } catch (e) {}
  }

  socket.on('join_order', async ({ order_id }) => {
    socket.join(`order_${order_id}`);
    console.log(`User ${user.userId} joined order ${order_id}`);
  });

  socket.on('send_message', async ({ order_id, content, type }) => {
    try {
      const message = await prisma.message.create({
        data: {
          orderId: order_id,
          senderId: user.userId,
          content,
          type: type || 'TEXT'
        },
        include: { sender: { select: { name: true, avatar: true } } }
      });
      io.to(`order_${order_id}`).emit('new_message', message);

      // ─── inbox_update: ikkala tomonning user room iga ───────
      try {
        const order = await prisma.order.findUnique({
          where: { id: order_id },
          select: {
            userId: true,
            provider: { select: { userId: true } }
          }
        });
        if (order) {
          const inboxPayload = {
            orderId: order_id,
            lastMessage: { content, type: type || 'TEXT', createdAt: message.createdAt, senderId: user.userId },
            senderId: user.userId
          };
          io.to(`user_${order.userId}`).emit('inbox_update', inboxPayload);
          io.to(`user_${order.provider.userId}`).emit('inbox_update', inboxPayload);
        }
      } catch (e) {
        console.error('Error emitting inbox_update', e);
      }
    } catch (error) {
      console.error('Error saving message', error);
    }
  });

  socket.on('read_messages', async ({ order_id }) => {
    try {
      await prisma.message.updateMany({
        where: { orderId: order_id, senderId: { not: user.userId }, isRead: false },
        data: { isRead: true }
      });
    } catch (error) {}
  });

  // ─── ADMIN CHAT EVENTS ─────────────────────────────────────────────────────
  socket.on('join_admin_chat', async ({ chatId }) => {
    socket.join(`admin_chat_${chatId}`);
    console.log(`User ${user.userId} joined admin chat room admin_chat_${chatId}`);
  });

  socket.on('admin_chat_message', async ({ chatId, content, type, imageUrl }) => {
    try {
      const message = await prisma.adminChatMessage.create({
        data: {
          chatId,
          senderId: user.userId,
          content,
          type: type || 'TEXT',
          imageUrl: imageUrl || null
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true, role: true } }
        }
      });
      io.to(`admin_chat_${chatId}`).emit('new_admin_message', message);
    } catch (error) {
      console.error('Error saving admin message', error);
    }
  });

  socket.on('mark_read', async ({ chatId }) => {
    try {
      await prisma.adminChatMessage.updateMany({
        where: { chatId, senderId: { not: user.userId }, isRead: false },
        data: { isRead: true }
      });
      io.to(`admin_chat_${chatId}`).emit('messages_read', { chatId });
    } catch (error) {
      console.error('Error marking admin messages as read', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (user && user.userId) {
      try {
        await prisma.user.update({
          where: { id: user.userId },
          data: { isOnline: false, lastSeenAt: new Date() }
        });
      } catch (e) {}
    }
  });
});

// Setup simple cron for Schedule checking (every 5 minutes)
// OFFLINE ni cron orqali o'rnatmaymiz — bu faqat socket disconnect orqali boshqariladi
setInterval(async () => {
  try {
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

    const activeProviderIds = activeSchedules.map(s => s.providerId);

    // Faqat: active schedule bo'lgan provayderlarni AVAILABLE ga o'tkazamiz
    // (agar ular hozirda BUSY bo'lmasa)
    if (activeProviderIds.length > 0) {
      await prisma.providerProfile.updateMany({
        where: { id: { in: activeProviderIds }, availabilityStatus: 'OFFLINE' },
        data: { availabilityStatus: 'AVAILABLE' }
      });
    }
    // OFFLINE ni bu yerda o'rnatmaymiz — faqat isOnline socket orqali boshqariladi

  } catch (error) {
    console.error('Schedule check error', error);
  }
}, 5 * 60 * 1000);

// ─── Auto-complete: 24 soat o'tgan AWAITING_CONFIRMATION ─────────────────────
setInterval(async () => {
  try {
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
        // UNSUCCESSFUL auto-complete: faqat MY_FAULT bo'lsa provider zarari
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
  } catch (error) {
    console.error('Auto-complete cron error:', error);
  }
}, 5 * 60 * 1000);


httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
