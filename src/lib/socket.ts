import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;
const roomViewers: Map<string, Set<string>> = new Map();

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    // Join personal notification room
    socket.on('register_user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Mission room viewer tracking
    socket.on('join_mission', (missionId: string) => {
      if (!missionId) return;
      const room = `mission:${missionId}`;
      socket.join(room);

      if (!roomViewers.has(missionId)) {
        roomViewers.set(missionId, new Set());
      }
      roomViewers.get(missionId)!.add(socket.id);

      const count = roomViewers.get(missionId)!.size;
      io?.to(room).emit('viewers_count', { missionId, count });
    });

    socket.on('leave_mission', (missionId: string) => {
      if (!missionId) return;
      const room = `mission:${missionId}`;
      socket.leave(room);

      if (roomViewers.has(missionId)) {
        roomViewers.get(missionId)!.delete(socket.id);
        const count = roomViewers.get(missionId)!.size;
        io?.to(room).emit('viewers_count', { missionId, count });
      }
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('mission:')) {
          const missionId = room.replace('mission:', '');
          if (roomViewers.has(missionId)) {
            roomViewers.get(missionId)!.delete(socket.id);
            const count = roomViewers.get(missionId)!.size;
            io?.to(`mission:${missionId}`).emit('viewers_count', { missionId, count });
          }
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function notifyMissionUpdated(missionId: string, volunteersJoined: number) {
  if (!io) return;
  io.to(`mission:${missionId}`).emit('mission:updated', { missionId, volunteersJoined });
}

export function sendUserNotification(userId: string, notification: { title: string; message: string; type?: string; link?: string }) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

export function notifyMissionUpdateAdded(missionId: string, update: unknown) {
  if (!io) return;
  io.to(`mission:${missionId}`).emit('update:added', { missionId, update });
}
