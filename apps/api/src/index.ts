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

app.get('/', (req: Request, res: Response) => {
  res.send('Mahalliy Xizmat Marketplace API is running...');
});

// Global Error Handler
import { errorHandler } from './middlewares/errorHandler';
app.use(errorHandler);

// Setup Socket.IO
import { prisma } from './lib/prisma';
import { verifyAccessToken } from './lib/jwt';

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

    // Update those who should be AVAILABLE
    if (activeProviderIds.length > 0) {
      await prisma.providerProfile.updateMany({
        where: { id: { in: activeProviderIds }, availabilityStatus: 'OFFLINE' },
        data: { availabilityStatus: 'AVAILABLE' }
      });
    }

    // Update those who should be OFFLINE (if they don't have an active schedule right now)
    await prisma.providerProfile.updateMany({
      where: {
        id: { notIn: activeProviderIds },
        availabilityStatus: 'AVAILABLE'
      },
      data: { availabilityStatus: 'OFFLINE' }
    });

  } catch (error) {
    console.error('Schedule check error', error);
  }
}, 5 * 60 * 1000);

httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
