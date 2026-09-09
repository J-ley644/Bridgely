import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import prisma from "./config/prisma.js";
import { initializeSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
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