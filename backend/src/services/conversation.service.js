
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
    throw new Error(
      "You cannot start a conversation with yourself"
    );
  }

  const existingConversation =
    await prisma.conversation.findFirst({
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

  const conversation =
    await prisma.conversation.create({
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
  const conversations =
    await prisma.conversation.findMany({
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

  return conversations;
}

export async function getConversationById(
  conversationId,
  userId
) {
  const conversation =
    await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            userId,
          },
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

  if (!conversation) {
    throw new Error(
      "Conversation not found or you are not a member"
    );
  }

  return conversation;
}

export async function verifyConversationMembership(
  conversationId,
  userId
) {
  const membership =
    await prisma.conversationMember.findUnique({
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
  content,
  replyToId = null,
  clientMessageId = null
) {
  const membership =
    await verifyConversationMembership(
      conversationId,
      senderId
    );

  if (!membership) {
    throw new Error(
      "You are not a member of this conversation"
    );
  }

  if (
    clientMessageId !== null &&
    (
      typeof clientMessageId !== "string" ||
      !clientMessageId.trim()
    )
  ) {
    throw new Error("Invalid client message ID");
  }

  // Check whether this message was already processed.
  if (clientMessageId) {
    const existingMessage =
      await prisma.message.findUnique({
        where: {
          senderId_clientMessageId: {
            senderId,
            clientMessageId,
          },
        },
        select: {
          id: true,
          content: true,
          type: true,
          senderId: true,
          conversationId: true,
          replyToId: true,
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
          replyTo: {
            select: {
              id: true,
              content: true,
              senderId: true,
              createdAt: true,
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

    if (existingMessage) {
      return {
        message: existingMessage,
        alreadyExisted: true,
      };
    }
  }

  if (replyToId !== null) {
    if (
      typeof replyToId !== "string" ||
      !replyToId.trim()
    ) {
      throw new Error("Invalid reply message ID");
    }

    const originalMessage =
      await prisma.message.findFirst({
        where: {
          id: replyToId,
          conversationId,
        },
        select: {
          id: true,
        },
      });

    if (!originalMessage) {
      throw new Error(
        "Original message not found in this conversation"
      );
    }
  }

  const message =
    await prisma.message.create({
      data: {
        content,
        type: "TEXT",
        senderId,
        conversationId,
        replyToId,
        clientMessageId,
      },
      select: {
        id: true,
        content: true,
        type: true,
        senderId: true,
        conversationId: true,
        replyToId: true,
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
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  return {
    message,
    alreadyExisted: false,
  };
}

export async function getConversationMessages(
  conversationId,
  userId
) {
  const membership =
    await verifyConversationMembership(
      conversationId,
      userId
    );

  if (!membership) {
    throw new Error(
      "You are not a member of this conversation"
    );
  }

  const messages =
    await prisma.message.findMany({
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
        replyToId: true,
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
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

  return messages;
}
