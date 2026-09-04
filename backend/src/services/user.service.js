import prisma from "../config/prisma.js";

export async function searchUserByUsername(username, currentUserId) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  // Don't return the authenticated user's own profile
  // from the discovery search.
  if (user.id === currentUserId) {
    return null;
  }

  return user;
}