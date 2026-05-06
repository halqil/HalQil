import { Server } from 'socket.io';

let _io: Server | null = null;

export const setIo = (io: Server) => {
  _io = io;
};

export const getIo = (): Server | null => _io;

/**
 * Foydalanuvchiga real-time notification yuborish
 * Socket.IO orqali userId room ga emit qilinadi
 */
export const emitNotification = (userId: string, payload: Record<string, any>) => {
  if (_io) {
    _io.to(`user_${userId}`).emit('new_notification', payload);
  }
};
