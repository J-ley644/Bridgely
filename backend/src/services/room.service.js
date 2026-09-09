import prisma from "../config/prisma.js";

const ROOM_MEMBER_LIMITS = {
  PUBLIC: 2000,
  PRIVATE: 1300,
};

function getRoomMemberLimit(privacy) {
  return ROOM_MEMBER_LIMITS[privacy] || 1300;
}

export async function createRoom(
  creatorId,
  name,
  description,
  privacy
) {
  const cleanName = name?.trim();

  if (!cleanName) {
    throw new Error("Room name is required");
  }

  if (!["PUBLIC", "PRIVATE"].includes(privacy)) {
    throw new Error("Invalid room privacy");
  }

  const room = await prisma.room.create({
    data: {
      name: cleanName,
      description: description?.trim() || null,
      privacy,
      creatorId,
      members: {
        create: {
          userId: creatorId,
          role: "OWNER",
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
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

  return room;
}

export async function getRoomById(
  roomId,
  userId
) {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
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

  if (!room) {
    throw new Error("Room not found");
  }

  const isMember = room.members.some(
    (member) => member.userId === userId
  );

  if (room.privacy === "PRIVATE" && !isMember) {
    throw new Error(
      "This is a private room"
    );
  }

  return room;
}

export async function joinRoom(
  roomId,
  userId
) {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  const alreadyMember = room.members.some(
    (member) => member.userId === userId
  );

  if (alreadyMember) {
    throw new Error(
      "You are already a member of this room"
    );
  }

  if (room.privacy === "PRIVATE") {
    throw new Error(
      "You cannot directly join a private room"
    );
  }

  const memberLimit = getRoomMemberLimit(
    room.privacy
  );

  if (room.members.length >= memberLimit) {
    throw new Error(
      `This room has reached its ${memberLimit}-member limit`
    );
  }

  const membership =
    await prisma.roomMember.create({
      data: {
        userId,
        roomId,
        role: "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

  return membership;
}

export async function leaveRoom(
  roomId,
  userId
) {
  const membership =
    await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "You are not a member of this room"
    );
  }

  if (membership.role === "OWNER") {
    throw new Error(
      "The room owner cannot leave the room"
    );
  }

  await prisma.roomMember.delete({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
  });

  return true;
}

export async function getUserRooms(
  userId
) {
  const rooms =
    await prisma.room.findMany({
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
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

  return rooms;
}