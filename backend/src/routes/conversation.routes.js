import express from "express";
import {
  createDirect,
  getConversations,
  sendConversationMessage,
  getConversationMessages,
} from "../controllers/conversation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, getConversations);

router.post("/direct", requireAuth, createDirect);

router.post(
  "/:conversationId/messages",
  requireAuth,
  sendConversationMessage
);

router.get(
  "/:conversationId/messages",
  requireAuth,
  getConversationMessages
);

export default router;