import express from "express";

import {
  createRoomController,
  getRoomController,
  joinRoomController,
  leaveRoomController,
  getMyRoomsController,
  getRoomMessagesController,
  sendRoomMessageController,
} from "../controllers/room.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createRoomController);

router.get("/", getMyRoomsController);

router.get("/:roomId", getRoomController);

router.get(
  "/:roomId/messages",
  getRoomMessagesController
);

router.post(
  "/:roomId/messages",
  sendRoomMessageController
);

router.post(
  "/:roomId/join",
  joinRoomController
);

router.post(
  "/:roomId/leave",
  leaveRoomController
);

export default router;