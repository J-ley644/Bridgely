import {
  createDirectConversation,
  getUserConversations,
  getConversationById,
  sendMessage,
  getConversationMessages as getMessages,
} from "../services/conversation.service.js";

import { getIO } from "../config/socket.js";

export async function createDirect(req, res) {
  try {
    const { username } = req.body || {};

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const conversation =
      await createDirectConversation(
        req.user.userId,
        username.trim().toLowerCase()
      );

    return res.status(200).json({
      success: true,
      message: "Direct conversation ready",
      conversation,
    });
  } catch (error) {
    console.error(
      "Create direct conversation error:",
      error
    );

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "You cannot start a conversation with yourself"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create direct conversation",
    });
  }
}

export async function getConversations(req, res) {
  try {
    const conversations =
      await getUserConversations(
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve conversations",
    });
  }
}

export async function getConversation(
  req,
  res
) {
  try {
    const { conversationId } =
      req.params;

    const conversation =
      await getConversationById(
        conversationId,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "Get conversation error:",
      error
    );

    if (
      error.message ===
      "Conversation not found or you are not a member"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve conversation",
    });
  }
}

export async function sendConversationMessage(
  req,
  res
) {
  try {
    const { conversationId } =
      req.params;

    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Message content is required",
      });
    }

    const message = await sendMessage(
      conversationId,
      req.user.userId,
      content.trim()
    );

    const io = getIO();

    io.to(
      `conversation:${conversationId}`
    ).emit(
      "message:new",
      message
    );

    return res.status(201).json({
      success: true,
      message:
        "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    if (
      error.message ===
      "You are not a member of this conversation"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to send message",
    });
  }
}

export async function getConversationMessages(
  req,
  res
) {
  try {
    const { conversationId } =
      req.params;

    const messages =
      await getMessages(
        conversationId,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    if (
      error.message ===
      "You are not a member of this conversation"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve messages",
    });
  }
}