let io;

const onlineUsers = new Map();

export function initializeSocket(socketServer) {
  io = socketServer;
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
}

export function setUserOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socketId);
}

export function setUserOffline(userId, socketId) {
  const userSockets = onlineUsers.get(userId);

  if (!userSockets) {
    return;
  }

  userSockets.delete(socketId);

  if (userSockets.size === 0) {
    onlineUsers.delete(userId);
  }
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}