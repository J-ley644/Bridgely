import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { sendVerificationEmail } from "./email.service.js";

const SALT_ROUNDS = 12;
const VERIFICATION_CODE_EXPIRY_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 5;

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerUser({
  username,
  displayName,
  email,
  phoneNumber,
  password,
}) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhoneNumber = phoneNumber.trim();

  const existingUsername = await prisma.user.findUnique({
    where: {
      username: normalizedUsername,
    },
  });

  if (existingUsername) {
    throw new Error("Username is already taken");
  }

  const existingEmail = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingEmail) {
    throw new Error("Email is already registered");
  }

  const existingPhone = await prisma.user.findUnique({
    where: {
      phoneNumber: normalizedPhoneNumber,
    },
  });

  if (existingPhone) {
    throw new Error("Phone number is already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const verificationCode = generateVerificationCode();

  const verificationCodeHash = await bcrypt.hash(
    verificationCode,
    SALT_ROUNDS
  );

  const verificationCodeExpiresAt = new Date(
    Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000
  );

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      displayName: displayName.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      passwordHash,
      emailVerified: false,
      verificationCodeHash,
      verificationCodeExpiresAt,
      verificationAttempts: 0,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  try {
    await sendVerificationEmail({
      email: normalizedEmail,
      username: normalizedUsername,
      code: verificationCode,
    });
  } catch (error) {
    console.error("Verification email error:", error);

    // Remove the incomplete account if email delivery fails.
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    throw new Error(
      "We could not send the verification email. Please try again."
    );
  }

  return user;
}

export async function verifyEmail({
  username,
  code,
}) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedCode = code.trim();

  const user = await prisma.user.findUnique({
    where: {
      username: normalizedUsername,
    },
  });

  if (!user) {
    throw new Error("Invalid verification request");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  if (!user.verificationCodeHash) {
    throw new Error("No verification code is active");
  }

  if (
    !user.verificationCodeExpiresAt ||
    user.verificationCodeExpiresAt < new Date()
  ) {
    throw new Error(
      "Verification code has expired. Please request a new code."
    );
  }

  if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    throw new Error(
      "Too many verification attempts. Please request a new code."
    );
  }

  const codeMatches = await bcrypt.compare(
    normalizedCode,
    user.verificationCodeHash
  );

  if (!codeMatches) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verificationAttempts: {
          increment: 1,
        },
      },
    });

    throw new Error("Invalid verification code");
  }

  const verifiedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      emailVerified: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return verifiedUser;
}

export async function resendVerificationCode({
  username,
}) {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      username: normalizedUsername,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  if (!user.email) {
    throw new Error("No email address is associated with this account");
  }

  const verificationCode = generateVerificationCode();

  const verificationCodeHash = await bcrypt.hash(
    verificationCode,
    SALT_ROUNDS
  );

  const verificationCodeExpiresAt = new Date(
    Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      verificationCodeHash,
      verificationCodeExpiresAt,
      verificationAttempts: 0,
    },
  });

  await sendVerificationEmail({
    email: user.email,
    username: user.username,
    code: verificationCode,
  });

  return {
    username: user.username,
    email: user.email,
  };
}

export async function loginUser({
  username,
  password,
}) {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      username: normalizedUsername,
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

  if (!user.emailVerified) {
    throw new Error(
      "Please verify your email before logging in"
    );
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
      emailVerified: user.emailVerified,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  };
}