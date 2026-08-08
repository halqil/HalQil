import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

dotenv.config();

const app: Express = express();
const port = env.PORT;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  },
});

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })); // Allow images to be served to frontend

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Serve static files
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, env.UPLOAD_DIR)));

// Liveness & Readiness checks
import { PrismaClient } from '@prisma/client';
const prismaHealth = new PrismaClient();

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    await prismaHealth.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

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
app.use('/chat', chatRoutes);

// Health check endpoint — cron job keep-alive (Render free tier uxlab qolmasligi uchun)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// Cron jobs (to be called by Render Cron or external ping)
import { runCronJobs } from './workers/cron';
app.post('/cron/run', async (req: Request, res: Response) => {
  // Simple protection for cron endpoint
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${env.JWT_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const result = await runCronJobs();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal cron error' });
  }
});


httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
