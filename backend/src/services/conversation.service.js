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

export async function verifyConversationMembership(
  conversationId,
  userId
) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },
  });

  return membership;
}

export async function sendMessage(
  conversationId,
  senderId,
  content
) {
  const membership = await verifyConversationMembership(
    conversationId,
    senderId
  );

  if (!membership) {
    throw new Error("You are not a member of this conversation");
  }

  const message = await prisma.message.create({
    data: {
      content,
      type: "TEXT",
      senderId,
      conversationId,
    },
    select: {
      id: true,
      content: true,
      type: true,
      senderId: true,
      conversationId: true,
      createdAt: true,
      updatedAt: true,
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Update the conversation timestamp so conversations
  // with recent messages appear first.
  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return message;
}

export async function getConversationMessages(
  conversationId,
  userId
) {
  const membership = await verifyConversationMembership(
    conversationId,
    userId
  );

  if (!membership) {
    throw new Error("You are not a member of this conversation");
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      content: true,
      type: true,
      senderId: true,
      conversationId: true,
      createdAt: true,
      updatedAt: true,
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return messages;
}