import express from "express";

import {
  createDirect,
  getConversations,
  getConversation,
  sendConversationMessage,
  getConversationMessages,
} from "../controllers/conversation.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  getConversations
);

router.post(
  "/direct",
  requireAuth,
  createDirect
);

router.get(
  "/:conversationId",
  requireAuth,
  getConversation
);

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