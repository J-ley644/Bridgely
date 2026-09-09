import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import prisma from "./config/prisma.js";

import {
  initializeSocket,
  setUserOnline,
  setUserOffline,
  getOnlineUserIds,
  isUserOnline,
} from "./config/socket.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    if (!process.env.JWT_SECRET) {
      return next(
        new Error(
          "JWT_SECRET is not configured"
        )
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    });

    if (!user) {
      return next(
        new Error("User not found")
      );
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error
    );

    next(
      new Error(
        "Invalid or expired authentication token"
      )
    );
  }
});

io.on("connection", (socket) => {
  console.log(
    `🔌 Socket connected: ${socket.id} (${socket.user.username})`
  );

  /*
   * Check whether this user was already online
   * before registering this new socket.
   */
  const alreadyOnline = isUserOnline(
    socket.user.id
  );

  // Register this socket
  setUserOnline(
    socket.user.id,
    socket.id
  );

  console.log(
    `🟢 ${socket.user.username} is now online`
  );

  /*
   * Send the current online-user list to the
   * newly connected client.
   */
  socket.emit(
    "presence:online-users",
    {
      userIds: getOnlineUserIds(),
    }
  );

  /*
   * Only broadcast an "online" event when this
   * is the user's first active connection.
   *
   * This prevents opening another tab/device from
   * incorrectly creating another presence transition.
   */
  if (!alreadyOnline) {
    socket.broadcast.emit(
      "presence:update",
      {
        userId: socket.user.id,
        username: socket.user.username,
        status: "online",
      }
    );
  }

  socket.on(
    "join-conversation",
    async (conversationId) => {
      try {
        if (!conversationId) {
          return;
        }

        const membership =
          await prisma.conversationMember.findUnique({
            where: {
              userId_conversationId: {
                userId: socket.user.id,
                conversationId,
              },
            },
          });

        if (!membership) {
          socket.emit(
            "socket-error",
            {
              message:
                "You are not a member of this conversation",
            }
          );

          return;
        }

        const roomName =
          `conversation:${conversationId}`;

        socket.join(roomName);

        console.log(
          `👥 ${socket.user.username} joined ${roomName}`
        );
      } catch (error) {
        console.error(
          "Join conversation socket error:",
          error
        );

        socket.emit(
          "socket-error",
          {
            message:
              "Unable to join conversation",
          }
        );
      }
    }
  );


  socket.on(
  "join-room",
  async (roomId) => {
    try {
      if (!roomId) {
        return;
      }

      const membership =
        await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.user.id,
              roomId,
            },
          },
        });

      if (!membership) {
        socket.emit("socket-error", {
          message:
            "You are not a member of this room",
        });

        return;
      }

      const roomName = `room:${roomId}`;

      socket.join(roomName);

      console.log(
        `👥 ${socket.user.username} joined ${roomName}`
      );
    } catch (error) {
      console.error(
        "Join room socket error:",
        error
      );

      socket.emit("socket-error", {
        message: "Unable to join room",
      });
    }
  }
);

socket.on(
  "leave-room",
  (roomId) => {
    if (!roomId) {
      return;
    }

    const roomName = `room:${roomId}`;

    socket.leave(roomName);

    console.log(
      `👋 ${socket.user.username} left ${roomName}`
    );
  }
);

  socket.on(
    "leave-conversation",
    (conversationId) => {
      if (!conversationId) {
        return;
      }

      const roomName =
        `conversation:${conversationId}`;

      socket.leave(roomName);

      console.log(
        `👋 ${socket.user.username} left ${roomName}`
      );
    }
  );

  socket.on("disconnect", () => {
    /*
     * Remove only this socket.
     */
    setUserOffline(
      socket.user.id,
      socket.id
    );

    /*
     * Only mark the user offline when their
     * final active socket has disconnected.
     */
    const stillOnline = isUserOnline(
      socket.user.id
    );

    if (!stillOnline) {
      console.log(
        `🔴 ${socket.user.username} is now offline`
      );

      socket.broadcast.emit(
        "presence:update",
        {
          userId: socket.user.id,
          username: socket.user.username,
          status: "offline",
        }
      );
    }

    console.log(
      `🔌 Socket disconnected: ${socket.id} (${socket.user.username})`
    );
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Bridgely API running on port ${PORT}`
  );

  console.log(
    `⚡ Bridgely real-time server ready`
  );
});