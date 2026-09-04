import prisma from "../config/prisma.js";

export async function createDirectConversation(
  currentUserId,
  targetUsername
) {
  const targetUser = await prisma.user.findUnique({
    where: {
      username: targetUsername,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.id === currentUserId) {
    throw new Error("You cannot start a conversation with yourself");
  }

  // Find an existing direct conversation containing both users.
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        {
          members: {
            some: {
              userId: currentUserId,
            },
          },
        },
        {
          members: {
            some: {
              userId: targetUser.id,
            },
          },
        },
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      members: {
        create: [
          {
            userId: currentUserId,
          },
          {
            userId: targetUser.id,
          },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return conversation;
}

export async function getUserConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return conversations;
}