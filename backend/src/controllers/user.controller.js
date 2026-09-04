import prisma from "../config/prisma.js";
import { searchUserByUsername } from "../services/user.service.js";

export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
    });
  }
}

export async function searchUser(req, res) {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const user = await searchUserByUsername(
      username.trim().toLowerCase(),
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("User search error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search for user",
    });
  }
}