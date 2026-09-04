import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const SALT_ROUNDS = 12;

export async function registerUser({
  username,
  displayName,
  email,
  password,
}) {
  const existingUsername = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUsername) {
    throw new Error("Username is already taken");
  }

  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      throw new Error("Email is already registered");
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      email: email || null,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return user;
}

export async function loginUser({
  username,
  password,
}) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid username or password");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  };
}