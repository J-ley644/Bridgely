
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://bridgely-8itn.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export function connectSocket(token) {
  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;

