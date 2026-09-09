import {
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
  getUserRooms,
  getRoomMessages,
  sendRoomMessage,
} from "../services/room.service.js";

import { getIO } from "../config/socket.js";

export async function createRoomController(
  req,
  res
) {
  try {
    const {
      name,
      description,
      privacy,
    } = req.body || {};

    const room = await createRoom(
      req.user.userId,
      name,
      description,
      privacy
    );

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error(
      "Create room error:",
      error
    );

    if (
      error.message ===
        "Room name is required" ||
      error.message ===
        "Invalid room privacy"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
}

export async function getRoomController(
  req,
  res
) {
  try {
    const { roomId } = req.params;

    const room = await getRoomById(
      roomId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(
      "Get room error:",
      error
    );

    if (
      error.message === "Room not found" ||
      error.message ===
        "This is a private room"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve room",
    });
  }
}

export async function joinRoomController(
  req,
  res
) {
  try {
    const { roomId } = req.params;

    const membership = await joinRoom(
      roomId,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Joined room successfully",
      membership,
    });
  } catch (error) {
    console.error(
      "Join room error:",
      error
    );

    const clientErrors = [
      "Room not found",
      "You are already a member of this room",
      "You cannot directly join a private room",
    ];

    if (
      clientErrors.includes(error.message) ||
      error.message.includes(
        "has reached its"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to join room",
    });
  }
}

export async function leaveRoomController(
  req,
  res
) {
  try {
    const { roomId } = req.params;

    await leaveRoom(
      roomId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Left room successfully",
    });
  } catch (error) {
    console.error(
      "Leave room error:",
      error
    );

    const clientErrors = [
      "You are not a member of this room",
      "The room owner cannot leave the room",
    ];

    if (
      clientErrors.includes(error.message)
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to leave room",
    });
  }
}

export async function getMyRoomsController(
  req,
  res
) {
  try {
    const rooms = await getUserRooms(
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error(
      "Get user rooms error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve rooms",
    });
  }
}

export async function getRoomMessagesController(
  req,
  res
) {
  try {
    const { roomId } = req.params;

    const messages = await getRoomMessages(
      roomId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get room messages error:",
      error
    );

    if (
      error.message ===
      "You are not a member of this room"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve room messages",
    });
  }
}

export async function sendRoomMessageController(
  req,
  res
) {
  try {
    const { roomId } = req.params;
    const { content } = req.body || {};

    if (
      !content ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const message = await sendRoomMessage(
      roomId,
      req.user.userId,
      content
    );

    const io = getIO();

    io.to(`room:${roomId}`).emit(
      "room:message:new",
      message
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error(
      "Send room message error:",
      error
    );

    if (
      error.message ===
      "You are not a member of this room"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send room message",
    });
  }
}