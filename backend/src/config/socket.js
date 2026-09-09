let io;

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