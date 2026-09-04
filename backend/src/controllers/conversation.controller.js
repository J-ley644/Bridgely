import {
  createDirectConversation,
  getUserConversations,
} from "../services/conversation.service.js";
export async function createDirect(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const conversation = await createDirectConversation(
      req.user.userId,
      username.trim().toLowerCase()
    );

    return res.status(200).json({
      success: true,
      message: "Direct conversation ready",
      conversation,
    });
  } catch (error) {
    console.error("Create direct conversation error:", error);

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
      message: "Failed to create direct conversation",
    });
  }
}

export async function getConversations(req, res) {
  try {
    const conversations = await getUserConversations(
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations",
    });
  }
}